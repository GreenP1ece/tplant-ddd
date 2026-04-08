// src/ddd/types.ts

// ─── Стереотипы ───────────────────────────────────────────────────────────────

export type DddStereotype =
  | 'aggregate-root'
  | 'value-object'
  | 'entity'
  | 'domain-event'
  | 'repository'
  | 'factory'
  | 'domain-service'
  | 'identifier';

export type DddMemberTag =
  | 'id'
  | 'identifier'
  | 'value-object'
  | 'reference'
  | 'ref'
  | 'domain-events'
  | 'factory'
  | 'command-method'
  | 'query-method'
  | 'immutable';

// ─── Мета-информация ──────────────────────────────────────────────────────────

export interface DddPropertyMeta {
  name: string;
  typeName: string;        
  isArray: boolean;
  isOptional: boolean;
  isPrivate: boolean;
  isReadonly: boolean;
  dddTag: DddMemberTag | undefined;
}

export interface DddMethodMeta {
  name: string;
  isStatic: boolean;
  isPrivate: boolean;
  params: string;          // уже отформатированная строка параметров
  returnType: string;
  dddTag: DddMemberTag | undefined;
  emits: string[];         // имена событий из @emits
}

export interface DddClassMeta {
  className: string;
  filePath: string;
  stereotype: DddStereotype | undefined;
  boundedContext: string | undefined;
  invariants: string[];
  properties: DddPropertyMeta[];
  methods: DddMethodMeta[];
  allEmits: string[];      // объединение всех @emits со всех методов
}

// ─── Связи ────────────────────────────────────────────────────────────────────

export type RelationKind =
  | 'composition'    // *-->
  | 'association'    // -->
  | 'dependency';    // ..>

export interface DddRelation {
  from: string;
  to: string;
  kind: RelationKind;
  label: string | undefined;
  cardinality: string | undefined;  // "*", "1", etc.
}

// ─── Константы ────────────────────────────────────────────────────────────────

export const STEREOTYPE_COLOR: Record<DddStereotype, string> = {
  'aggregate-root':  '#FEFECE',
  'value-object':    '#E8F5E9',
  'entity':          '#E3F2FD',
  'domain-event':    '#FFF3E0',
  'repository':      '#F3E5F5',
  'factory':         '#FCE4EC',
  'domain-service':  '#E0F7FA',
  'identifier':      '#ECEFF1',
};

export const STEREOTYPE_LABEL: Record<DddStereotype, string> = {
  'aggregate-root':  'Aggregate Root',
  'value-object':    'Value Object',
  'entity':          'Entity',
  'domain-event':    'Domain Event',
  'repository':      'Repository',
  'factory':         'Factory',
  'domain-service':  'Domain Service',
  'identifier':      'Identifier',
};

// Теги участников, которые рендерятся как «гиллометы» (« »)
export const MEMBER_TAG_LABEL: Record<DddMemberTag, string> = {
  'id':             'id',
  'identifier':     'id',
  'value-object':   'value-object',
  'reference':      'ref',
  'ref':            'ref',
  'domain-events':  'events',
  'factory':        'factory',
  'command-method': 'command',
  'query-method':   'query',
  'immutable':      'immutable',
};