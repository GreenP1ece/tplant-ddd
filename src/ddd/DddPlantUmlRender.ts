// src/ddd/DddPlantUmlRenderer.ts

import type {
  DddClassMeta,
  DddRelation,
  DddStereotype,
  DddMemberTag,
} from './types.js';
import {
  STEREOTYPE_COLOR,
  STEREOTYPE_LABEL,
  MEMBER_TAG_LABEL,
} from './types.js';

// ─── Стрелки ─────────────────────────────────────────────────────────────────

const ARROWS: Record<string, string> = {
  composition: '*-->',
  association: '-->',
  dependency:  '..>',
};

// ─── Главный класс ────────────────────────────────────────────────────────────

export class DddPlantUmlRenderer {

  private lines: string[] = [];

  // ─── Публичный API ──────────────────────────────────────────────────────────

  renderDiagram(
    boundedContextName: string,
    classes: DddClassMeta[],
    relations: DddRelation[],
    diagramTitle: string,
  ): string {
    this.lines = [];

    this.pushHeader(diagramTitle);
    this.pushLine('');

    this.pushLine(`package "${boundedContextName} «Bounded Context»" {`);
    this.pushLine('');

    // Группируем по stereotype для блоков `together`
    const groups = this.groupByStereotype(classes);
    for (const group of groups) {
      if (group.length > 1) {
        this.pushLine('  together {');
        for (const cls of group) this.pushClass(cls, '    ');
        this.pushLine('  }');
      } else {
        for (const cls of group) this.pushClass(cls, '  ');
      }
      this.pushLine('');
    }

    this.pushLine('}'); // end package
    this.pushLine('');

    this.pushRelations(relations);
    this.pushLine('');

    this.pushLegend();
    this.pushLine('');
    this.pushLine('@enduml');

    return this.lines.join('\n');
  }

  // ─── Приватные методы ───────────────────────────────────────────────────────

  private pushHeader(title: string): void {
    this.pushLine('@startuml');
    this.pushLine('');
    this.pushLine('!theme plain');
    this.pushLine('skinparam linetype ortho');
    this.pushLine('skinparam classAttributeIconSize 0');
    this.pushLine('');
    this.pushLine(`title ${title}`);
    this.pushLine('caption Generated from code with DDD stereotypes');
  }

  private pushClass(cls: DddClassMeta, indent: string): void {
    const stereotype = cls.stereotype ?? 'entity';
    const color = STEREOTYPE_COLOR[stereotype] ?? '#FFFFFF';
    const label = STEREOTYPE_LABEL[stereotype] ?? stereotype;

    // Заголовок класса
    this.pushLine(`${indent}class ${cls.className} <<${label}>> ${color} {`);

    // Инварианты
    if (cls.invariants.length > 0) {
      this.pushLine(`${indent}  <size:10><i>Invariants:</i></size>`);
      for (const inv of cls.invariants) {
        this.pushLine(`${indent}  <size:9>• ${inv}</size>`);
      }
      this.pushLine(`${indent}  __`);
    }

    // Properties
    for (const prop of cls.properties) {
      this.pushLine(`${indent}  ${this.renderProperty(prop)}`);
    }

    // Разделитель перед методами
    if (cls.properties.length > 0 && cls.methods.length > 0) {
      this.pushLine(`${indent}  __`);
    }

    // Methods
    for (const method of cls.methods) {
      this.pushLine(`${indent}  ${this.renderMethod(method)}`);
    }

    // Domain events section
    if (cls.allEmits.length > 0) {
      this.pushLine(`${indent}  __domain events__`);
      this.pushLine(`${indent}  .. emits ..`);
      for (const evt of cls.allEmits) {
        this.pushLine(`${indent}  ${evt}`);
      }
    }

    this.pushLine(`${indent}}`);
  }

  private renderProperty(prop: DddPropertyMeta): string {
    const vis = prop.isPrivate ? '-' : '+';
    const tagPart = prop.dddTag
      ? `«${MEMBER_TAG_LABEL[prop.dddTag]}» `
      : '';
    const arrayPart = prop.isArray ? '[]' : '';
    const optPart = prop.isOptional ? '?' : '';
    return `${vis} ${tagPart}${prop.name}: ${prop.typeName}${arrayPart}${optPart}`;
  }

  private renderMethod(method: DddMethodMeta): string {
    const vis = method.isPrivate ? '-' : '+';
    const tagPart = method.dddTag
      ? `«${MEMBER_TAG_LABEL[method.dddTag]}» `
      : '';
    const staticPart = method.isStatic ? '{static} ' : '';
    const params = method.params ? method.params : '';
    return `${vis} ${tagPart}${staticPart}${method.name}(${params}): ${method.returnType}`;
  }

  private pushRelations(relations: DddRelation[]): void {
    if (relations.length === 0) return;
    this.pushLine("' Relationships");
    for (const rel of relations) {
      const arrow = ARROWS[rel.kind] ?? '-->';
      const cardinality = rel.cardinality ? ` "${rel.cardinality}"` : '';
      const label = rel.label ? ` : ${rel.label}` : '';
      this.pushLine(`${rel.from} ${arrow}${cardinality} ${rel.to}${label}`);
    }
  }

  private pushLegend(): void {
    this.pushLine('legend right');
    this.pushLine('  |= Color |= Stereotype |');
    for (const [stereotype, color] of Object.entries(STEREOTYPE_COLOR)) {
      const label = STEREOTYPE_LABEL[stereotype as DddStereotype];
      this.pushLine(`  | <${color}> | ${label} |`);
    }
    this.pushLine('endlegend');
  }

  /**
   * Группирует классы по стереотипу для блоков `together {}`.
   * Порядок групп: aggregate-root → value-object → entity → domain-event → остальные
   */
  private groupByStereotype(classes: DddClassMeta[]): DddClassMeta[][] {
    const order: Array<DddStereotype | 'unknown'> = [
      'aggregate-root',
      'entity',
      'value-object',
      'domain-event',
      'repository',
      'domain-service',
      'factory',
      'identifier',
      'unknown',
    ];

    const buckets = new Map<string, DddClassMeta[]>();
    for (const o of order) buckets.set(o, []);

    for (const cls of classes) {
      const key = cls.stereotype ?? 'unknown';
      const bucket = buckets.get(key) ?? buckets.get('unknown')!;
      bucket.push(cls);
    }

    // Возвращаем непустые корзины
    return [...buckets.values()].filter((b) => b.length > 0);
  }

  private pushLine(line: string): void {
    this.lines.push(line);
  }
}