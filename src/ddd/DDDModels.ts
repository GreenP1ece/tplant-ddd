// src/ddd/DddModels.ts

import { DddClassMeta, DddMemberMeta } from './JsDocDddParser';

/** Расширение над IClass из tplant */
export interface IDddClass {
  ddd: DddClassMeta;
  properties: IDddProperty[];
  methods: IDddMethod[];
}

export interface IDddProperty {
  dddTag?: string;       
}

export interface IDddMethod {
  dddTag?: string;     
  emits?: string[];    
}