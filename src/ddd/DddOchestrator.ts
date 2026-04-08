// src/ddd/DddOrchestrator.ts

import ts from 'typescript';
import path from 'node:path';
import { DddAnalyzer } from './DddAnalyzer.js';
import { RelationInferrer } from './RelationInferrer.js';
import { DddPlantUmlRenderer } from './DddPlantUmlRender.js';
import type { DddClassMeta } from './types.js';

export interface OrchestratorOptions {
  /**
   * Glob-паттерны или конкретные пути к .ts файлам.
   * Передаются напрямую в ts.createProgram.
   */
  inputFiles: string[];

  /**
   * Путь к tsconfig.json. Если не указан — используются дефолтные опции.
   */
  tsConfigPath?: string;

  /**
   * Название bounded context для заголовка пакета.
   * Если не указано — берётся из @bounded-context первого найденного
   * aggregate-root, иначе — имя директории первого файла.
   */
  boundedContext?: string;

  /**
   * Заголовок диаграммы (строка title в PlantUML).
   */
  title?: string;

  /**
   * Если true — в диаграмму включаются классы без @ddd-аннотаций.
   * По умолчанию false.
   */
  includeUnAnnotated?: boolean;
}

export class DddOrchestrator {

  static generate(options: OrchestratorOptions): string {
    const program = this.createProgram(options);
    const analyzer = new DddAnalyzer(program);

    let classes = analyzer.analyze();

    // Фильтруем классы без стереотипа, если не нужны
    if (!options.includeUnAnnotated) {
      classes = classes.filter((c) => c.stereotype !== undefined);
    }

    if (classes.length === 0) {
      return '\'  tplant-ddd: no @ddd-annotated classes found\n@startuml\n@enduml';
    }

    // Определяем bounded context
    const boundedContext =
      options.boundedContext ??
      this.inferBoundedContext(classes, options.inputFiles);

    // Выводим связи
    const relations = RelationInferrer.infer(classes);

    // Заголовок диаграммы
    const title =
      options.title ??
      `${boundedContext} Module (Bounded Context)`;

    // Рендерим
    const renderer = new DddPlantUmlRenderer();
    return renderer.renderDiagram(boundedContext, classes, relations, title);
  }

  // ─── Приватные ─────────────────────────────────────────────────────────────

  private static createProgram(options: OrchestratorOptions): ts.Program {
    // Если передан tsconfig — читаем его
    if (options.tsConfigPath) {
      const configFile = ts.readConfigFile(options.tsConfigPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(options.tsConfigPath),
      );
      return ts.createProgram(
        parsedConfig.fileNames,
        parsedConfig.options,
      );
    }

    // Иначе — минимальные опции
    return ts.createProgram(options.inputFiles, {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      noEmit: true,
    });
  }

  private static inferBoundedContext(
    classes: DddClassMeta[],
    inputFiles: string[],
  ): string {
    // 1. Из @bounded-context на aggregate-root
    const root = classes.find((c) => c.stereotype === 'aggregate-root');
    if (root?.boundedContext) return root.boundedContext;

    // 2. Из имени директории первого файла
    const firstFile = inputFiles[0];
    if (firstFile) {
      const parts = path.dirname(firstFile).split(path.sep);
      // Берём последний значимый сегмент
      const segment = parts.filter(Boolean).pop();
      if (segment && segment !== '.') {
        return segment.charAt(0).toUpperCase() + segment.slice(1);
      }
    }

    return 'Domain';
  }
}