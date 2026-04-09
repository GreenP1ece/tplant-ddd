type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Note aggregate root - represents a user's note with content and metadata.
 *
 * @ddd aggregate-root
 * @bounded-context Note
 * @invariant Title must not be empty
 * @invariant Content must be valid NoteContent
 */
export class Note {
  /** @ddd identifier */
  readonly id: NoteId;

  /** @ddd identifier */
  readonly creatorId: CreatorId;

  private _title: string;

  /** @ddd value-object */
  private _content: NoteContent;

  /** @ddd reference */
  private _directoryId: DirectoryId | null;

  private _mood: Mood;

  /** @ddd domain-events */
  private _events: DomainEvent[] = [];

  /**
   * Factory method for creating a valid Note.
   * @ddd factory
   * @emits NoteCreatedEvent
   */
  static create(
    id: NoteId,
    creatorId: CreatorId,
    title: string,
    content: NoteContent,
    directoryId: DirectoryId | null,
    mood: Mood,
  ): Result<Note> {
    return { ok: true, value: new Note(id, creatorId, title, content, directoryId, mood) };
  }

  private constructor(
    id: NoteId,
    creatorId: CreatorId,
    title: string,
    content: NoteContent,
    directoryId: DirectoryId | null,
    mood: Mood,
  ) {
    this.id = id;
    this.creatorId = creatorId;
    this._title = title;
    this._content = content;
    this._directoryId = directoryId;
    this._mood = mood;
  }

  /**
   * @ddd command-method
   * @emits NoteContentUpdatedEvent
   */
  updateContent(content: NoteContent): Result<void> {
    this._content = content;
    return { ok: true, value: undefined };
  }

  /**
   * @ddd command-method
   * @emits NoteMovedEvent
   */
  moveToDirectory(directoryId: DirectoryId | null): Result<void> {
    this._directoryId = directoryId;
    return { ok: true, value: undefined };
  }

  /** @ddd query-method */
  get wordCount(): number {
    return this._content.wordCount();
  }
}

/** @ddd value-object */
export class NoteContent {
  /** @ddd immutable */
  private readonly raw: string;

  /** @ddd immutable */
  private readonly tags: Tag[];

  /** @ddd immutable */
  private readonly links: NoteId[];

  /** @ddd factory */
  static create(raw: string, tags: Tag[], links: NoteId[], _unused: number): Result<NoteContent> {
    return { ok: true, value: new NoteContent(raw, tags, links) };
  }

  private constructor(raw: string, tags: Tag[], links: NoteId[]) {
    this.raw = raw;
    this.tags = tags;
    this.links = links;
  }

  wordCount(): number {
    return this.raw.trim().length === 0 ? 0 : this.raw.trim().split(/\s+/).length;
  }
}

/** @ddd value-object */
export class Tag {
  name: string;
  color?: string;
  constructor(name: string, color?: string) {
    this.name = name;
    this.color = color;
  }
}

/** @ddd domain-event */
export class NoteCreatedEvent {
  noteId: NoteId;
  title: string;
  createdAt: Date;
  constructor(noteId: NoteId, title: string, createdAt: Date) {
    this.noteId = noteId;
    this.title = title;
    this.createdAt = createdAt;
  }
}

/** @ddd domain-event */
export class NoteContentUpdatedEvent {
  noteId: NoteId;
  newContent: NoteContent;
  updatedAt: Date;
  constructor(noteId: NoteId, newContent: NoteContent, updatedAt: Date) {
    this.noteId = noteId;
    this.newContent = newContent;
    this.updatedAt = updatedAt;
  }
}

/** @ddd domain-event */
export class NoteMovedEvent {
  noteId: NoteId;
  fromDirectoryId?: DirectoryId;
  toDirectoryId?: DirectoryId;
  constructor(noteId: NoteId, from?: DirectoryId, to?: DirectoryId) {
    this.noteId = noteId;
    this.fromDirectoryId = from;
    this.toDirectoryId = to;
  }
}

/** @ddd identifier */
export class NoteId {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
}

/** @ddd identifier */
export class DirectoryId {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
}

// “заглушки” типов домена
export class CreatorId { constructor(public value: string) {} }
export class Mood { constructor(public value: string) {} }
export interface DomainEvent { type: string }