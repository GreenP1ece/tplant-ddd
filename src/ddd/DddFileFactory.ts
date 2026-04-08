// src/ddd/DddFileFactory.ts

import ts from 'typescript';
import { JsDocDddParser, DddClassMeta } from './JsDocDddParser';

/** 
 * Обходит программу и возвращает Map<className → DddClassMeta> 
 * Запускается ПАРАЛЛЕЛЬНО с обычным FileFactory 
 */
export class DddFileFactory {

  static analyze(program: ts.Program): Map<string, DddClassMeta> {
    const result = new Map<string, DddClassMeta>();
    const checker = program.getTypeChecker();

    for (const sourceFile of program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue;

      ts.forEachChild(sourceFile, node => {
        if (!ts.isClassDeclaration(node) || !node.name) return;

        const meta = JsDocDddParser.parseClass(node, checker);

        // Собираем @emits со всех методов
        node.members.forEach(member => {
          if (ts.isMethodDeclaration(member)) {
            const emits = JsDocDddParser.parseEmits(member);
            meta.emits = [...(meta.emits ?? []), ...emits];
          }
        });

        result.set(node.name.text, meta);
      });
    }

    return result;
  }
}