import { describe, it, expect } from 'vitest';
import path from 'node:path';
import ts from 'typescript';
import { DddAnalyzer } from '../../src/ddd/DddAnalyzer.js';
import { RelationInferrer } from '../../src/ddd/RelationInferrer.js';

function createProgram(files: string[]): ts.Program {
  return ts.createProgram(files, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    noEmit: true
  });
}

describe('RelationInferrer', () => {
  it('infers composition/ref/id and emits relations', () => {
    const fixture = path.resolve('test/fixtures/note.ts');
    const program = createProgram([fixture]);
    const classes = new DddAnalyzer(program).analyze();

    const annotated = classes.filter(c => c.stereotype !== undefined);
    const rel = RelationInferrer.infer(annotated);

    // Note contains NoteContent (value-object) => composition
    expect(rel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'Note', to: 'NoteContent', kind: 'composition' }),
      ]),
    );

    // Note references DirectoryId => dependency
    expect(rel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'Note', to: 'DirectoryId', kind: 'dependency' }),
      ]),
    );

    // Note raises events via @emits => dependency
    expect(rel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'Note', to: 'NoteMovedEvent', kind: 'dependency', label: 'raises' }),
      ]),
    );
  });
});