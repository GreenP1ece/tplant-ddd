// src/ddd/DddAnalyzer.ts

import ts from 'typescript';
import { JsDocDddParser } from './JsDocDddParser.js';
import type {
  DddClassMeta,
  DddPropertyMeta,
  DddMethodMeta,
} from './types.js';

// ─── Вспомогательные функции ─────────────────────────────────────────────────

/**
 * Превращает TypeNode в читаемую строку.
 * Обрабатывает: string, number, SomeType, SomeType | null, SomeType[]
 */
function typeNodeToString(node: ts.TypeNode | undefined, checker: ts.TypeChecker): string {
  if (!node) return 'any';
  return checker.typeToString(checker.getTypeFromTypeNode(node));
}

/**
 * Извлекает «базовое» имя типа без [] и | null/undefined
 * Нужно для RelationInferrer, чтобы сопоставить с именами классов.
 */
function baseTypeName(typeStr: string): string {
  return typeStr
    .replace(/\[\]/g, '')
    .replace(/\s*\|\s*null/g, '')
    .replace(/\s*\|\s*undefined/g, '')
    .trim();
}

function isArrayType(node: ts.TypeNode | undefined): boolean {
  if (!node) return false;
  return ts.isArrayTypeNode(node);
}

function isOptionalType(node: ts.TypeNode | undefined): boolean {
  if (!node) return false;
  if (ts.isUnionTypeNode(node)) {
    return node.types.some(
      (t) =>
        t.kind === ts.SyntaxKind.NullKeyword ||
        t.kind === ts.SyntaxKind.UndefinedKeyword,
    );
  }
  return false;
}

function formatParams(
  params: ts.NodeArray<ts.ParameterDeclaration>,
  checker: ts.TypeChecker,
): string {
  if (params.length === 0) return '';
  // Если параметров много — сокращаем до "..."
  if (params.length > 3) return '...';
  return params
    .map((p) => {
      const name = p.name.getText();
      const type = typeNodeToString(p.type, checker);
      const opt = p.questionToken ? '?' : '';
      return `${name}${opt}: ${type}`;
    })
    .join(', ');
}

// ─── Основной класс ───────────────────────────────────────────────────────────

export class DddAnalyzer {

  private readonly checker: ts.TypeChecker;

  constructor(private readonly program: ts.Program) {
    this.checker = program.getTypeChecker();
  }

  /**
   * Точка входа.
   * Возвращает все DddClassMeta из исходных файлов программы.
   */
  analyze(): DddClassMeta[] {
    const result: DddClassMeta[] = [];

    for (const sourceFile of this.program.getSourceFiles()) {
      // Пропускаем .d.ts и node_modules
      if (sourceFile.isDeclarationFile) continue;
      if (sourceFile.fileName.includes('node_modules')) continue;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name) {
          const meta = this.analyzeClass(node, sourceFile.fileName);
          result.push(meta);
        }
      });
    }

    return result;
  }

  // ─── Приватные методы ───────────────────────────────────────────────────────

  private analyzeClass(
    node: ts.ClassDeclaration,
    filePath: string,
  ): DddClassMeta {
    const className = node.name!.text;

    const properties: DddPropertyMeta[] = [];
    const methods: DddMethodMeta[] = [];
    const allEmits: string[] = [];

    for (const member of node.members) {
      // ── Property (включая readonly и private field) ──
      if (ts.isPropertyDeclaration(member) && member.name) {
        properties.push(this.analyzeProperty(member));
        continue;
      }

      // ── Method ──
      if (ts.isMethodDeclaration(member) && member.name) {
        const m = this.analyzeMethod(member);
        methods.push(m);
        allEmits.push(...m.emits);
        continue;
      }

      // ── get accessor (readonly computed property) ──
      if (ts.isGetAccessor(member) && member.name) {
        const m = this.analyzeAccessor(member);
        methods.push(m);
        allEmits.push(...m.emits);
        continue;
      }

      // ── Constructor ── (пропускаем, но можно добавить позже)
    }

    return {
      className,
      filePath,
      stereotype:     JsDocDddParser.classStereotype(node),
      boundedContext: JsDocDddParser.boundedContext(node),
      invariants:     JsDocDddParser.invariants(node),
      properties,
      methods,
      allEmits:       [...new Set(allEmits)], // дедупликация
    };
  }

  private analyzeProperty(node: ts.PropertyDeclaration): DddPropertyMeta {
    const name = node.name.getText();
    const rawType = typeNodeToString(node.type, this.checker);

    // Снимаем leading underscore у приватных полей (_title → title)
    const cleanName = name.startsWith('_') ? name.slice(1) : name;

    const modifiers = node.modifiers ?? [];
    const isPrivate =
      modifiers.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword) ||
      name.startsWith('_') ||
      name.startsWith('#');
    const isReadonly = modifiers.some(
      (m) => m.kind === ts.SyntaxKind.ReadonlyKeyword,
    );

    return {
      name:       cleanName,
      typeName:   baseTypeName(rawType),
      isArray:    isArrayType(node.type),
      isOptional: isOptionalType(node.type) || !!node.questionToken,
      isPrivate,
      isReadonly,
      dddTag:     JsDocDddParser.memberTag(node),
    };
  }

  private analyzeMethod(node: ts.MethodDeclaration): DddMethodMeta {
    const name = node.name.getText();
    const modifiers = node.modifiers ?? [];

    return {
      kind: 'method',
      name,
      isStatic:   modifiers.some((m) => m.kind === ts.SyntaxKind.StaticKeyword),
      isPrivate:  modifiers.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword),
      params:     formatParams(node.parameters, this.checker),
      returnType: typeNodeToString(node.type, this.checker),
      dddTag:     JsDocDddParser.memberTag(node),
      emits:      JsDocDddParser.emits(node),
    };
  }

  private analyzeAccessor(node: ts.GetAccessorDeclaration): DddMethodMeta {
    const name = node.name.getText();
    return {
      kind: 'getter',
      name,
      isStatic:   false,
      isPrivate:  false,
      params:     '',
      returnType: typeNodeToString(node.type, this.checker),
      dddTag:     JsDocDddParser.memberTag(node),
      emits:      JsDocDddParser.emits(node),
    };
  }
}