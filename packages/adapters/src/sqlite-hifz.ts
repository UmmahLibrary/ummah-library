import { createRequire } from "node:module";
import type { DatabaseSync } from "node:sqlite";
import type { HifzCard, HifzRecord, HifzRepository, VerseKey } from "@ummahlibrary/core";

// `node:sqlite` is an experimental builtin not yet recognized by bundlers/test
// runners, so load it through require() (a type-only import keeps the typings).
type DatabaseSyncCtor = new (path: string) => DatabaseSync;
const { DatabaseSync: Database } = createRequire(import.meta.url)("node:sqlite") as {
  DatabaseSync: DatabaseSyncCtor;
};

/**
 * Durable `HifzRepository` backed by SQLite (Node's built-in `node:sqlite`).
 * The reference for a persistent progress store — the template for expo-sqlite
 * on mobile and a Postgres adapter on the server. Imported via the package
 * subpath `@ummahlibrary/adapters/sqlite` so it never reaches a web bundle.
 */
interface Row {
  sura: number;
  aya: number;
  repetitions: number;
  ease_factor: number;
  interval_days: number;
  due: string;
  last_reviewed: string | null;
}

const toCard = (r: Row): HifzCard => ({
  repetitions: r.repetitions,
  easeFactor: r.ease_factor,
  intervalDays: r.interval_days,
  due: r.due,
  lastReviewed: r.last_reviewed,
});

const toRecord = (r: Row): HifzRecord => ({ ayah: { sura: r.sura, aya: r.aya }, card: toCard(r) });

export class SqliteHifzRepository implements HifzRepository {
  readonly #db: DatabaseSync;

  constructor(filename = ":memory:") {
    this.#db = new Database(filename);
    this.#db.exec(`
      CREATE TABLE IF NOT EXISTS hifz (
        sura          INTEGER NOT NULL,
        aya           INTEGER NOT NULL,
        repetitions   INTEGER NOT NULL,
        ease_factor   REAL    NOT NULL,
        interval_days INTEGER NOT NULL,
        due           TEXT    NOT NULL,
        last_reviewed TEXT,
        PRIMARY KEY (sura, aya)
      );
    `);
  }

  /** Release the underlying database handle. */
  close(): void {
    this.#db.close();
  }

  get(ref: VerseKey): Promise<HifzCard | null> {
    const row = this.#db
      .prepare("SELECT * FROM hifz WHERE sura = ? AND aya = ?")
      .get(ref.sura, ref.aya) as unknown as Row | undefined;
    return Promise.resolve(row ? toCard(row) : null);
  }

  save(ref: VerseKey, card: HifzCard): Promise<void> {
    this.#db
      .prepare(
        `INSERT INTO hifz (sura, aya, repetitions, ease_factor, interval_days, due, last_reviewed)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (sura, aya) DO UPDATE SET
           repetitions = excluded.repetitions,
           ease_factor = excluded.ease_factor,
           interval_days = excluded.interval_days,
           due = excluded.due,
           last_reviewed = excluded.last_reviewed`,
      )
      .run(
        ref.sura,
        ref.aya,
        card.repetitions,
        card.easeFactor,
        card.intervalDays,
        card.due,
        card.lastReviewed,
      );
    return Promise.resolve();
  }

  remove(ref: VerseKey): Promise<void> {
    this.#db.prepare("DELETE FROM hifz WHERE sura = ? AND aya = ?").run(ref.sura, ref.aya);
    return Promise.resolve();
  }

  due(now: Date): Promise<readonly HifzRecord[]> {
    // ISO timestamps sort lexicographically, so `<=` compares chronologically.
    const rows = this.#db
      .prepare("SELECT * FROM hifz WHERE due <= ? ORDER BY sura, aya")
      .all(now.toISOString()) as unknown as Row[];
    return Promise.resolve(rows.map(toRecord));
  }

  all(): Promise<readonly HifzRecord[]> {
    const rows = this.#db
      .prepare("SELECT * FROM hifz ORDER BY sura, aya")
      .all() as unknown as Row[];
    return Promise.resolve(rows.map(toRecord));
  }
}
