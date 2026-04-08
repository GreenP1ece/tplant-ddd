// src/ddd/DddPlantUmlRenderer.ts

import { DddClassMeta, DddStereotype } from './JsDocDddParser';

const STEREOTYPE_COLORS: Record<DddStereotype, string> = {
  'aggregate-root': '#FEFECE',
  'value-object':   '#E8F5E9',
  'entity':         '#E3F2FD',
  'domain-event':   '#FFF3E0',
  'repository':     '#F3E5F5',
  'factory':        '#FCE4EC',
  'domain-service': '#E0F7FA',
};

const STEREOTYPE_LABELS: Record<DddStereotype, string> = {
  'aggregate-root': 'Aggregate Root',
  'value-object':   'Value Object',
  'entity':         'Entity',
  'domain-event':   'Domain Event',
  'repository':     'Repository',
  'factory':        'Factory',
  'domain-service': 'Domain Service',
};

export class DddPlantUmlRenderer {

  private lines: string[] = [];

  renderHeader(boundedContextName: string): void {
    this.lines.push(
      '@startuml',
      '!theme plain',
      'skinparam linetype ortho',
      'skinparam classAttributeIconSize 0',
      '',
      `package "${boundedContextName} «Bounded Context»" {`,
    );
  }

  renderClass(
    className: string,
    meta: DddClassMeta,
    properties: RenderedProperty[],
    methods: RenderedMethod[],
  ): void {
    const stereotype = meta.stereotype ?? 'entity';
    const color = STEREOTYPE_COLORS[stereotype];
    const label = STEREOTYPE_LABELS[stereotype];

    // Invariants block
    const invariantLines = (meta.invariants ?? []).map(
      inv => `    <size:9>• ${inv}</size>`
    );

    // Properties
    const propLines = properties.map(p => {
      const vis = p.isPrivate ? '-' : '+';
      const tag = p.dddTag ? `«${p.dddTag}» ` : '';
      const opt = p.optional ? '?' : '';
      return `    ${vis} ${tag}${p.name}: ${p.type}${opt}`;
    });

    // Methods
    const methodLines = methods.map(m => {
      const vis = m.isPrivate ? '-' : '+';
      const tag = m.dddTag ? `«${m.dddTag}» ` : '';
      const stat = m.isStatic ? '{static} ' : '';
      return `    ${vis} ${tag}${stat}${m.name}(${m.params}): ${m.returnType}`;
    });

    // Events emitted
    const eventSection = (meta.emits ?? []).length > 0
      ? ['    __domain events__', '    .. emits ..', ...(meta.emits ?? []).map(e => `    ${e}`)]
      : [];

    this.lines.push(
      `  class ${className} <<${label}>> ${color} {`,
      ...(invariantLines.length > 0
        ? [`    <size:10><i>Invariants:</i></size>`, ...invariantLines, '    __']
        : []),
      ...propLines,
      '    __',
      ...methodLines,
      ...eventSection,
      '  }',
      '',
    );
  }

  renderRelationships(relations: DddRelation[]): void {
    this.lines.push("' Relationships");
    for (const rel of relations) {
      this.lines.push(`${rel.from} ${rel.arrow} ${rel.to}${rel.label ? ` : ${rel.label}` : ''}`);
    }
  }

  renderLegend(): void {
    this.lines.push(
      '',
      'legend right',
      '  |= Color |= Stereotype |',
      '  | <#FEFECE> | Aggregate Root |',
      '  | <#E8F5E9> | Value Object |',
      '  | <#FFF3E0> | Domain Event |',
      '  | <#ECEFF1> | Identifier |',
      '  | <#E3F2FD> | Entity |',
      'endlegend',
      '',
      '@enduml',
    );
  }

  toString(): string {
    return this.lines.join('\n');
  }
}

// Вспомогательные типы
export interface RenderedProperty {
  name: string; type: string;
  isPrivate: boolean; optional: boolean;
  dddTag?: string;
}
export interface RenderedMethod {
  name: string; params: string; returnType: string;
  isPrivate: boolean; isStatic: boolean;
  dddTag?: string; emits?: string[];
}
export interface DddRelation {
  from: string; to: string;
  arrow: '*-->' | '-->' | '..>' | '*-->'; 
  label?: string;
}