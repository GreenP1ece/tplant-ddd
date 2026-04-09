import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { DddAnalyzer } from '../../src/ddd/DddAnalyzer.js';
import ts from 'typescript';

function createProgram(files: string[]): ts.Program {
  return ts.createProgram(files, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    noEmit: true
  });
}

describe('DddAnalyzer', () => {
  it('extracts bounded-context, invariants and emits', () => {
    const fixture = path.resolve('test/fixtures/note.ts');
    const program = createProgram([fixture]);
    const analyzer = new DddAnalyzer(program);

    const classes = analyzer.analyze();
    const note = classes.find(c => c.className === 'Note')!;

    expect(note.boundedContext).toBe('Note');
    expect(note.invariants).toEqual([
      'Title must not be empty',
      'Content must be valid NoteContent',
    ]);

    // emits из методов
    expect(note.allEmits).toContain('NoteCreatedEvent');
    expect(note.allEmits).toContain('NoteContentUpdatedEvent');
    expect(note.allEmits).toContain('NoteMovedEvent');

    // getter wordCount помечен как query-method и kind getter
    const wc = note.methods.find(m => m.name === 'wordCount')!;
    expect(wc.kind).toBe('getter');
    expect(wc.dddTag).toBe('query-method');
  });
});