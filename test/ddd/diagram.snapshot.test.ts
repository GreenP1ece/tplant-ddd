import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { DddOrchestrator } from '../../src/ddd/DddOchestrator.js';
import { normalizeEol } from '../helpers/normalize.js';

describe('DddOrchestrator diagram', () => {
  it('generates stable PlantUML for Note bounded context', () => {
    const fixture = path.resolve('test/fixtures/note.ts');

    const puml = DddOrchestrator.generate({
      inputFiles: [fixture],
      boundedContext: 'Note',
      title: 'Note Module (Bounded Context)',
      includeUnAnnotated: false,
    });

    expect(normalizeEol(puml)).toMatchSnapshot();
  });
});