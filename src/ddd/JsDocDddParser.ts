// src/ddd/JsDocDddParser.ts

import ts from 'typescript';

export type DddStereotype =
  | 'aggregate-root'
  | 'value-object'
  | 'entity'
  | 'domain-event'
  | 'repository'
  | 'factory'
  | 'domain-service';

export type DddMemberTag =
  | 'identifier'
  | 'value-object'
  | 'reference'
  | 'domain-events'
  | 'factory'
  | 'command-method'
  | 'query-method';

export interface DddClassMeta {
  stereotype?: DddStereotype;
  boundedContext?: string;
  invariants?: string[];
  emits?: string[];        // из @emits на методах
}

export interface DddMemberMeta {
  tag?: DddMemberTag;
}

export class JsDocDddParser {

  /** Читает мета-информацию класса из его JSDoc */
  static parseClass(node: ts.ClassDeclaration, checker: ts.TypeChecker): DddClassMeta {
    const meta: DddClassMeta = { invariants: [], emits: [] };
    const jsDocTags = ts.getJSDocTags(node);

    for (const tag of jsDocTags) {
      const tagName = tag.tagName.text;
      const comment = this.tagComment(tag);

      switch (tagName) {
        case 'ddd':
          meta.stereotype = comment as DddStereotype;
          break;
        case 'bounded-context':
          meta.boundedContext = comment;
          break;
        case 'invariant':
          meta.invariants!.push(comment);
          break;
      }
    }
    return meta;
  }

  /** Читает мета-информацию члена класса (property / method) */
  static parseMember(node: ts.ClassElement): DddMemberMeta {
    const meta: DddMemberMeta = {};
    const jsDocTags = ts.getJSDocTags(node);

    for (const tag of jsDocTags) {
      if (tag.tagName.text === 'ddd') {
        meta.tag = this.tagComment(tag) as DddMemberTag;
      }
    }
    return meta;
  }

  /** Читает @emits с методов */
  static parseEmits(node: ts.MethodDeclaration): string[] {
    return ts.getJSDocTags(node)
      .filter(t => t.tagName.text === 'emits')
      .map(t => this.tagComment(t));
  }

  private static tagComment(tag: ts.JSDocTag): string {
    if (typeof tag.comment === 'string') return tag.comment.trim();
    if (Array.isArray(tag.comment)) {
      return tag.comment.map(c => ('text' in c ? c.text : '')).join('').trim();
    }
    return '';
  }
}