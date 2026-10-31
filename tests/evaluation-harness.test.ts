import { execFileSync } from 'node:child_process';
import { expect, test } from 'vitest';
test('evaluation separates heldout answers, first/repair success and rendered/source fidelity', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
 import {readFileSync} from 'node:fs';
 import {modelTask,dataHash,summarizeRun} from './scripts/evaluation-harness.mjs';
 const document=JSON.parse(readFileSync('resources/recipes/bar.json','utf8'));
 const task={id:'synthetic-harness-selftest',family:'literal-table',split:'heldout',prompt:'Use supplied source rows.',expectedDataHash:dataHash(document.data.rows),expectedValues:[120,180,150]};
 const wrong=structuredClone(document);wrong.data.rows[0].revenue=121;
 const result=summarizeRun([task],[{id:task.id,document:wrong},{id:task.id,document}],{model:'synthetic-selftest',settings:{temperature:0},compilerRevision:'test'});
 process.stdout.write(JSON.stringify({request:modelTask(task),result}));
 `,
    ],
    { encoding: 'utf8' },
  );
  const value = JSON.parse(output);
  expect(value.request).toEqual({
    id: 'synthetic-harness-selftest',
    prompt: 'Use supplied source rows.',
  });
  expect(value.result).toMatchObject({
    initial: 0,
    afterRepair: 1,
    total: 1,
    results: [
      {
        attempts: [
          { dataFidelity: false, renderedFidelity: false },
          { correct: true },
        ],
      },
    ],
  });
});
