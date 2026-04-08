// src/ddd/JsDocDddParser.ts

import ts from 'typescript';
import type { DddStereotype, DddMemberTag } from './types.js';

// ─── Вспомогательная функция извлечения текста тега ──────────────────────────

function tagText(tag: ts.JSDocTag): string {
  const c = tag.comment;
  if (!c) return '';

  if (typeof c === 'string') return c.trim();

  return (c as ts.NodeArray<ts.JSDocComment>)
    .map((chunk) => ('text' in chunk ? (chunk.text as string) : ''))
    .join('')
    .trim();
}

// ─── Класс ────────────────────────────────────────────────────────────────────

export class JsDocDddParser {

  /**
   * Возвращает DDD-стереотип класса из тега @ddd <stereotype>
   * Пример: @ddd aggregate-root
   */
  static classStereotype(node: ts.ClassDeclaration): DddStereotype | undefined {
    for (const tag of ts.getJSDocTags(node)) {
      if (tag.tagName.text === 'ddd') {
        return tagText(tag) as DddStereotype;
      }
    }
    return undefined;
  }

  /**
   * Возвращает название bounded-context из @bounded-context <name>
   */
  static boundedContext(node: ts.ClassDeclaration): string | undefined {
    for (const tag of ts.getJSDocTags(node)) {
      if (tag.tagName.text === 'bounded-context') {
        return tagText(tag);
      }
    }
    return undefined;
  }

  /**
   * Собирает все @invariant <text> в массив строк
   */
  static invariants(node: ts.ClassDeclaration): string[] {
    return ts.getJSDocTags(node)
      .filter((t) => t.tagName.text === 'invariant')
      .map(tagText);
  }

  /**
   * Возвращает DDD-тег члена класса из @ddd <tag>
   * Применяется к property и method
   */
  static memberTag(node: ts.ClassElement): DddMemberTag | undefined {
    for (const tag of ts.getJSDocTags(node)) {
      if (tag.tagName.text === 'ddd') {
        return tagText(tag) as DddMemberTag;
      }
    }
    return undefined;
  }

  /**
   * Собирает все @emits <EventName> с метода
   */
  static emits(node: ts.MethodDeclaration | ts.GetAccessorDeclaration): string[] {
    return ts.getJSDocTags(node)
      .filter((t) => t.tagName.text === 'emits')
      .map(tagText)
      .filter(Boolean);
  }
}