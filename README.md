# tplant-ddd

DDD-aware TypeScript → UML (PlantUML) generator.

This project is a **fork of `tplant`** that focuses on **Domain-Driven Design diagrams**.  
It reads JSDoc annotations like `@ddd`, `@bounded-context`, `@invariant`, `@emits` and generates a PlantUML class diagram with **DDD stereotypes**, **invariants**, and **domain-event emissions**.

> License: **GPL-3.0** (same as upstream `tplant`).  
> Upstream: `bafolts/tplant` (original author and contributors credited in that repository).

---

## What it generates

From code like this:

```ts
/**
 * @ddd aggregate-root
 * @bounded-context Note
 * @invariant Title must not be empty
 * @invariant Content must be valid NoteContent
 */
export class Note {
  /** @ddd identifier */
  readonly id: NoteId;

  /** @ddd value-object */
  private _content: NoteContent;

  /** @ddd reference */
  private _directoryId: DirectoryId | null;

  /**
   * @ddd factory
   * @emits NoteCreatedEvent
   */
  static create(/* ... */) { /* ... */ }

  /**
   * @ddd command-method
   * @emits NoteMovedEvent
   */
  moveToDirectory(directoryId: DirectoryId | null) { /* ... */ }

  /** @ddd query-method */
  get wordCount(): number { /* ... */ }
}

It generates PlantUML like:

@startuml
title Note Module (Bounded Context)
caption Generated from code with DDD stereotypes

package "Note «Bounded Context»" {

  class Note <<Aggregate Root>> #FEFECE {
    <size:10><i>Invariants:</i></size>
    <size:9>• Title must not be empty</size>
    <size:9>• Content must be valid NoteContent</size>
    __
    + «id» id: NoteId
    - «value-object» content: NoteContent
    - «ref» directoryId: DirectoryId?
    __
    + «factory» {static} create(...): Result<Note>
    + «command» moveToDirectory(directoryId: DirectoryId?): Result<void>
    + «query» wordCount: number
    __domain events__
    .. emits ..
    NoteCreatedEvent
    NoteMovedEvent
  }
}

@enduml

## Install

### Global install

```shell
npm install --global tplant-ddd
```
Or with `npx` (no install):

```shell
npx tplant-ddd --help
```

## Usage

### Generate .puml

```shell
tplant-ddd --input "src/**/*.ts" --context "Note" --output "note.puml"
```

If `--output` is not provided, the PlantUML text is printed to STDOUT:

```shell
tplant-ddd --input "src/**/*.ts" --context "Note" > note.puml
```

### Dev run (TypeScript directly)

```shell
npm run dev -- --input "test/fixtures/note.ts" --context "Note" --output "note.puml"
```
## DDD annotations

### Class-level tags
* `@ddd <stereotype>`
Supported stereotypes:
    * `aggregate-root`
    * `entity`
    * `value-object`
    * `domain-event`
    * `identifier`
    * `repository` (optional / future)
    * `domain-service` (optional / future)
* `@bounded-context <Name>`
  Groups classes into a PlantUml `package`.
* `@invariant <Text>`
  Adds invariant lines in the class box.

### Member-level tags
* `/** @ddd identifier */` on properties
* `/** @ddd value-object */` on properties
* `/** @ddd reference */` (or `ref`) on properties
* `/** @ddd factory */` on methods
* `/** @ddd command-method */`on methods
* `/** @ddd query-method */` on methods / getters
* `/** @emits <DomainEventClassName> */` on methods/getters (adds “raises/emits” section + relations)

## Options

`--input <path/glob>`

Glob or path to TypeScript file(s).

### Examples:

```Shell
tplant-ddd --input "src/note/**/*.ts"
tplant-ddd --input "src/note/domain/note.entity.ts"
```

`--output <path>`

Output .puml file. If omitted, output goes to STDOUT.

`--tsconfig <path>`

Use a project `tsconfig.json` to compile/resolve types the same way as your app.

### Example:

```Shell
tplant-ddd --input "src/**/*.ts" --tsconfig "./tsconfig.json" --output domain.puml
```

`--context <name>`

Bounded Context name (used in PlantUML `package` title).
If omitted, the tool will try to infer it from `@bounded-context`.

`--title <text>`

Overrides the PlantUML `title`.

`--all`

Include classes without `@ddd` annotations (useful for mixed diagrams).

## Scripts

This repo currently runs upstream (Jest) tests and fork-specific (Vitest) tests separately:
```typescript
"scripts": {
  "build": "tsc",
  "dev": "tsx src/cli.ts",
  "build:dev": "tsc --sourceMap -w",
  "lint": "eslint src --ext .ts",
  "prepare": "npm run build",
  "prepublishOnly": "npm run build",
  "test-jest": "jest",
  "test": "vitest run",
  "test:watch": "vitest"
}
```
## Notes
* This fork generates PlantUML text. Converting `.puml` to images (SVG/PNG) is usually done by PlantUML itself (local jar) or a PlantUML server, depending on your workflow.
* Upstream `tplant` also supports Mermaid and image generation workflows; this fork focuses on DDD diagrams.

## References
TypeScript Compiler API: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
Upstream project: https://github.com/bafolts/tplant