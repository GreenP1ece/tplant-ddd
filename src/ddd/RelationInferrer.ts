// src/ddd/RelationInferrer.ts
//
// Строит список связей между классами на основе:
//   1. Типов полей (property type → другой класс в наборе)
//   2. Тегов @ddd на полях (ref → dependency, value-object → composition)
//   3. Тегов @emits на методах  (→ dependency к событию)

import type {
  DddClassMeta,
  DddRelation,
  RelationKind,
  DddPropertyMeta,
} from './types.js';

export class RelationInferrer {

  /**
   * @param classes - все классы из одного bounded context (или всего проекта)
   */
  static infer(classes: DddClassMeta[]): DddRelation[] {
    const classNames = new Set(classes.map((c) => c.className));
    const relations: DddRelation[] = [];
    const seen = new Set<string>(); // дедупликация "From→To:label"

    const add = (r: DddRelation): void => {
      const key = `${r.from}→${r.to}:${r.label ?? ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        relations.push(r);
      }
    };

    for (const cls of classes) {
      // ── Связи из полей ──────────────────────────────────────────────────────
      for (const prop of cls.properties) {
        const targetName = prop.typeName;
        if (!classNames.has(targetName)) continue;     // тип не в нашем наборе
        if (targetName === cls.className) continue;    // self-reference

        add({
          from:        cls.className,
          to:          targetName,
          kind:        this.kindFromTag(prop),
          label:       this.labelFromTag(prop),
          cardinality: prop.isArray ? '*' : undefined,
        });
      }

      // ── Связи из @emits ─────────────────────────────────────────────────────
      for (const eventName of cls.allEmits) {
        if (!classNames.has(eventName)) continue;
        add({
          from:        cls.className,
          to:          eventName,
          kind:        'dependency',
          label:       'raises',
          cardinality: undefined,
        });
      }
    }

    return relations;
  }

  // ── Определяем вид стрелки по тегу поля ──────────────────────────────────

  private static kindFromTag(prop: DddPropertyMeta): RelationKind {
    switch (prop.dddTag) {
      case 'value-object':
        return 'composition';   // *-->
      case 'reference':
      case 'ref':
        return 'dependency';    // ..>
      case 'id':
      case 'identifier':
        return 'association';   // -->
      default:
        // Без тега — решаем по характеру поля
        return prop.isPrivate ? 'composition' : 'association';
    }
  }

  private static labelFromTag(prop: DddPropertyMeta): string | undefined {
    switch (prop.dddTag) {
      case 'value-object': return 'contains';
      case 'reference':
      case 'ref':          return 'references';
      case 'id':
      case 'identifier':   return 'identified by';
      default:             return undefined;
    }
  }
}