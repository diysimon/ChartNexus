import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import bar from '../resources/recipes/bar.json';

const script = resolve('scripts/eval-ollama.mjs');
function run(code: string): unknown {
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '-e', code], {
      encoding: 'utf8',
    }),
  );
}

describe('local model pilot runner', () => {
  test('sends task data without reference answer or assertions and rejects unregistered tools', () => {
    const result = run(`
      import {buildTaskMessage, validateToolCall, parseCandidate, parseModelOutput} from ${JSON.stringify(`file://${script}`)};
      const task={id:'t',prompt:{en:'draw'},reference:{data:{rows:[1]},chart:{secret:'answer'}},expected:{assertions:['SECRET_ASSERTION']}};
      const prompt=buildTaskMessage(task);
      let malformed;try{parseCandidate('not json')}catch{malformed=true}
      let narrative;try{parseModelOutput('hello '+JSON.stringify({a:1}))}catch{narrative=true}
      const repaired=parseModelOutput(${JSON.stringify('```json\n{"a":1}\n```')});
      process.stdout.write(JSON.stringify({repaired,narrative,prompt,allowed:validateToolCall({function:{name:'validate_chart',arguments:{document:{}}}}),denied:validateToolCall({function:{name:'shell',arguments:{}}}),malformed}));
    `) as {
      prompt: string;
      repaired: { formatRepair: string; candidate: { a: number } };
      allowed: { ok: boolean };
      denied: { code: string };
      malformed: boolean;
      narrative: boolean;
    };
    expect(result.repaired).toEqual({
      formatRepair: 'markdown-json-fence',
      candidate: { a: 1 },
    });
    expect(result.prompt).toContain('sourceData');
    expect(result.prompt).not.toContain('SECRET_ASSERTION');
    expect(result.prompt).not.toContain('answer');
    expect(result.allowed.ok).toBe(true);
    expect(result.denied.code).toBe('TOOL_NOT_ALLOWED');
    expect(result.malformed).toBe(true);
    expect(result.narrative).toBe(true);
  });
  test('rejects unknown task IDs and existing output files without contacting a model', () => {
    const dir = mkdtempSync(join(tmpdir(), 'chartnexus-pilot-'));
    try {
      mkdirSync(join(dir, 'outputs'));
      const existing = join(dir, 'outputs', 'existing.json');
      writeFileSync(existing, 'keep');
      const clash = spawnSync(
        process.execPath,
        [
          script,
          '--model',
          'qwen3.5:9b',
          '--tasks',
          'create-bar',
          '--output',
          'existing.json',
        ],
        { cwd: dir, encoding: 'utf8' },
      );
      expect(clash.status).toBe(2);
      expect(clash.stderr).toContain('OUTPUT_EXISTS');
      expect(readFileSync(existing, 'utf8')).toBe('keep');
      const missing = spawnSync(
        process.execPath,
        [
          script,
          '--model',
          'qwen3.5:9b',
          '--tasks',
          'does-not-exist',
          '--output',
          'new.json',
        ],
        { cwd: dir, encoding: 'utf8' },
      );
      expect(missing.status).toBe(2);
      expect(missing.stderr).toContain('Unknown task ID');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  test('captures local model unavailability without losing task context', () => {
    const result = run(`
      import {runTask} from ${JSON.stringify(`file://${script}`)};
      let info;
      try { await runTask({task:{id:'t',prompt:{en:'draw'}},chat:async()=>{throw new Error('LOCAL_MODEL_UNAVAILABLE')},tools:[],callTool:async()=>({})}) }
      catch(error) { info={message:error.message,trace:error.pilotTrace} }
      process.stdout.write(JSON.stringify(info));
    `) as {
      message: string;
      trace: { promptHash: string; toolCalls: unknown[]; usage: unknown };
    };
    expect(result.message).toBe('LOCAL_MODEL_UNAVAILABLE');
    expect(result.trace.promptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.trace.toolCalls).toEqual([]);
    expect(result.trace.usage).toBeNull();
  });
  test('preserves trace when the model produces invalid JSON', () => {
    const result = run(`
      import {runTask} from ${JSON.stringify(`file://${script}`)};
      let trace;
      try { await runTask({task:{id:'t',prompt:{en:'draw'}},chat:async()=>({message:{content:'not json'},prompt_eval_count:2,eval_count:1}),tools:[],callTool:async()=>({})}) }
      catch(error) { trace=error.pilotTrace }
      process.stdout.write(JSON.stringify(trace));
    `) as {
      rawOutput: string;
      usage: { inputTokens: number; outputTokens: number };
    };
    expect(result.rawOutput).toBe('not json');
    expect(result.usage).toEqual({ inputTokens: 2, outputTokens: 1 });
  });
  test('verifies MCP-rendered SVG and rejects a mismatched artifact hash', () => {
    const result = run(`
      import {renderCandidate} from ${JSON.stringify(`file://${script}`)};
      import {createHash} from 'node:crypto';
      const svg='<svg></svg>';
      const goodHash=createHash('sha256').update(svg).digest('hex');
      let expected=goodHash;
      const client={callTool:async()=>({content:[{type:'resource_link',uri:'chartnexus://artifacts/x.svg'}],structuredContent:{value:{sha256:expected}}}),readResource:async()=>({contents:[{text:svg}]})};
      const candidate=${JSON.stringify(bar)};
      const valid=await renderCandidate(client,candidate);
      expected='wrong';
      const invalid=await renderCandidate(client,candidate);
      const skipped=await renderCandidate(client,{});
      process.stdout.write(JSON.stringify({valid,invalid,skipped}));
    `) as {
      valid: { status: string };
      invalid: { reason: string };
      skipped: { status: string };
    };
    expect(result.valid.status).toBe('verified');
    expect(result.invalid.reason).toBe('ARTIFACT_CHECK_FAILED');
    expect(result.skipped.status).toBe('skipped-invalid');
  });
  test('records MCP diagnostic codes separately from model output', () => {
    const result = run(`
      import {runTask} from ${JSON.stringify(`file://${script}`)};
      let count=0;
      const chat=async()=>++count===1?{message:{role:'assistant',tool_calls:[{function:{name:'validate_chart',arguments:{document:{}}}}]}}:{message:{role:'assistant',content:'{"diagnosticCode":"INVALID_SCHEMA","diagnosticPath":""}'}};
      const output=await runTask({task:{id:'t',prompt:{en:'diagnose'}},chat,tools:[],callTool:async()=>({isError:true,structuredContent:{diagnostics:[{code:'INVALID_SCHEMA'}]}})});
      process.stdout.write(JSON.stringify(output.toolCalls));
    `);
    expect(result).toEqual([
      { name: 'validate_chart', ok: false, diagnostics: ['INVALID_SCHEMA'] },
    ]);
  });
  test('records model-initiated tool calls and bounds repeated calls', () => {
    const result = run(`
      import {runTask} from ${JSON.stringify(`file://${script}`)};
      const task={id:'t',prompt:{en:'draw'},reference:{data:{rows:[1]}}};
      let count=0;
      const chat=async()=>++count===1?{prompt_eval_count:0,eval_count:0,message:{role:'assistant',tool_calls:[{function:{name:'validate_chart',arguments:{document:{}}}}]}}:{message:{role:'assistant',content:'{"result":"ok"}'},prompt_eval_count:3,eval_count:4,done_reason:'stop'};
      const good=await runTask({task,chat,tools:[],callTool:async()=>({isError:false})});
      let error='';try{await runTask({task,chat:async()=>({message:{role:'assistant',tool_calls:[{function:{name:'shell',arguments:{}}}]}}),tools:[],callTool:async()=>({}),maxToolRounds:1})}catch(e){error=e.message}
      process.stdout.write(JSON.stringify({good,error}));
    `) as {
      good: {
        toolCalls: { name: string; ok: boolean }[];
        usage: { inputTokens: number; outputTokens: number };
      };
      error: string;
    };
    expect(result.good.toolCalls).toEqual([
      { name: 'validate_chart', ok: true },
    ]);
    expect(result.good.usage).toEqual({ inputTokens: 3, outputTokens: 4 });
    expect(result.error).toBe('TOOL_ROUND_LIMIT');
  });
});
