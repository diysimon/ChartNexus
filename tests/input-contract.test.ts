import { expect, test } from 'vitest';
import {
  getChartInputContract,
  createUpdateController,
} from '@chartnexus/runtime';
import {
  compileChart,
  compileChatChart,
  validateChart,
} from '@chartnexus/core';
import { chartDocument02Schema } from '@chartnexus/schema';
import legacy from '../resources/recipes/bar.json';
import canonical from '../resources/recipes/chat-bar.json';

for (const chatPresentation of [false, true]) {
  for (const orderedUpdates of [false, true]) {
    test(`input contract chat=${chatPresentation} ordered=${orderedUpdates}`, () => {
      const contract = getChartInputContract({
        chatPresentation,
        orderedUpdates,
      });
      expect(contract.documentExample).toEqual(canonical);
      expect(contract.documentSchema).toEqual(chartDocument02Schema);
      expect(validateChart(contract.documentExample).ok).toBe(true);
      expect(compileChart(contract.documentExample).ok).toBe(true);
      expect(compileChatChart(contract.documentExample).ok).toBe(true);
      expect(contract.description).toContain('Recommend schemaVersion 0.2');
      expect(contract.description).toContain(
        chatPresentation ? 'accepts only' : 'also accepts',
      );
      expect(
        contract.acceptedProfiles.some(
          (profile) => profile.schemaVersion === '0.1',
        ),
      ).toBe(!chatPresentation);
      if (orderedUpdates) {
        let revision = 0;
        const controller = createUpdateController({
          getRevision: () => revision,
          resize: () => ({ ok: true, value: true }),
          dispose() {},
          update(input) {
            const compiled = chatPresentation
              ? compileChatChart(input)
              : compileChart(input);
            return compiled.ok
              ? { ok: true, value: { revision: ++revision } }
              : compiled;
          },
        });
        expect(controller.commit(contract.inputExample)).toEqual({
          ok: true,
          value: { status: 'applied', revision: 1 },
        });
        expect(contract.hostOwnedFields).toEqual([
          'operationId',
          'baseRevision',
        ]);
        controller.dispose();
      } else expect(contract.inputExample).toEqual(canonical);
    });
  }
}

test('legacy non-chat acceptance and chat rejection stay explicit; guidance is isolated', () => {
  expect(compileChart(legacy).ok).toBe(true);
  const rejected = compileChatChart(legacy);
  expect(rejected.ok).toBe(false);
  if (!rejected.ok)
    expect(rejected.diagnostics[0]?.code).toBe('UNSUPPORTED_CAPABILITY');
  const first = getChartInputContract();
  first.documentExample.id = 'changed';
  Object.defineProperty(first.documentSchema, 'title', { value: 'changed' });
  first.acceptedProfiles.length = 0;
  const next = getChartInputContract();
  expect(next.documentExample).toEqual(canonical);
  expect(next.documentSchema).toEqual(chartDocument02Schema);
  expect(next.acceptedProfiles).toHaveLength(4);
});

test('actual OpenUI prompt and A2UI property schema describe the enabled host profile', async () => {
  const { createOpenUIChart } = await import('@chartnexus/adapter-openui');
  const { createA2uiChart } = await import('@chartnexus/adapter-a2ui');
  const { createLibrary } = await import('@openuidev/react-lang');
  for (const chat of [false, true]) {
    for (const orderedUpdates of [false, true]) {
      const options = {
        orderedUpdates,
        ...(chat ? { chatPresentation: { theme: 'dark' as const } } : {}),
      };
      const contract = getChartInputContract({
        chatPresentation: chat,
        orderedUpdates,
      });
      const component = createOpenUIChart(options);
      const library = createLibrary({
        components: [component],
        root: 'ChartNexusChart',
      });
      const prompt = library.prompt();
      expect(prompt).toContain(
        chat
          ? 'accepts only intent with schemaVersion 0.2'
          : 'also accepts schemaVersion 0.1',
      );
      expect(component.props.shape.document.description).toBe(
        contract.description,
      );
      const a2ui = createA2uiChart(options);
      expect(a2ui.schema).toHaveProperty(
        'shape.document.description',
        contract.description,
      );
      expect(
        a2ui.schema.safeParse({
          document: JSON.stringify(contract.inputExample),
        }).success,
      ).toBe(true);
    }
  }
});
