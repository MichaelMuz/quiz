import Database from "better-sqlite3";
import type { GeneratedQuestion, Rating } from "./content.js";

export type Attempt = {
  submissionId: string;
  stableId: string;
  seed: number | null;
  prompt: string;
  expectedAnswer: string;
  response: string | null;
  correct: boolean | null;
  rating: Rating | null;
  reviewedAt: string;
};

export type ReviewState = { stableId: string; interval: number; reviews: number; dueAt: string; updatedAt: string };

export class QuizStore {
  private readonly db: Database.Database;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attempts (
        submission_id TEXT PRIMARY KEY,
        stable_id TEXT NOT NULL,
        seed INTEGER,
        prompt TEXT NOT NULL,
        expected_answer TEXT NOT NULL,
        response TEXT,
        correct INTEGER,
        rating TEXT,
        reviewed_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS review_state (
        stable_id TEXT PRIMARY KEY,
        interval_days INTEGER NOT NULL,
        reviews INTEGER NOT NULL,
        due_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pending_generated (
        stable_id TEXT PRIMARY KEY,
        seed INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        expected_answer TEXT NOT NULL,
        grader TEXT NOT NULL
      );
    `);
  }

  recordAttempt(attempt: Attempt): Attempt {
    const existing = this.attemptBySubmission(attempt.submissionId);
    if (existing) return existing;
    this.db.transaction(() => {
      this.db.prepare(`INSERT OR IGNORE INTO attempts
        (submission_id, stable_id, seed, prompt, expected_answer, response, correct, rating, reviewed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(attempt.submissionId, attempt.stableId, attempt.seed, attempt.prompt, attempt.expectedAnswer,
          attempt.response, attempt.correct === null ? null : Number(attempt.correct), attempt.rating, attempt.reviewedAt);
      if (attempt.rating) this.updateReview(attempt.stableId, attempt.rating, attempt.reviewedAt);
      this.db.prepare("DELETE FROM pending_generated WHERE stable_id = ?").run(attempt.stableId);
    })();
    return this.attemptBySubmission(attempt.submissionId)!;
  }

  attemptBySubmission(submissionId: string): Attempt | null {
    const row = this.db.prepare("SELECT * FROM attempts WHERE submission_id = ?").get(submissionId) as Record<string, unknown> | undefined;
    return row ? {
      submissionId: String(row.submission_id), stableId: String(row.stable_id), seed: row.seed as number | null,
      prompt: String(row.prompt), expectedAnswer: String(row.expected_answer), response: row.response as string | null,
      correct: row.correct === null ? null : Boolean(row.correct), rating: row.rating as Rating | null,
      reviewedAt: String(row.reviewed_at),
    } : null;
  }

  private updateReview(stableId: string, rating: Rating, reviewedAt: string): void {
    const current = this.reviewState(stableId);
    const base = current?.interval ?? 1;
    const interval = rating === "again" ? 0 : rating === "hard" ? Math.max(1, base) : rating === "good" ? Math.max(2, base * 2) : Math.max(4, base * 4);
    const due = new Date(reviewedAt);
    due.setUTCDate(due.getUTCDate() + interval);
    this.db.prepare(`INSERT INTO review_state (stable_id, interval_days, reviews, due_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(stable_id) DO UPDATE SET interval_days=excluded.interval_days,
        reviews=excluded.reviews, due_at=excluded.due_at, updated_at=excluded.updated_at`)
      .run(stableId, interval, (current?.reviews ?? 0) + 1, due.toISOString(), reviewedAt);
  }

  reviewState(stableId: string): ReviewState | null {
    const row = this.db.prepare("SELECT * FROM review_state WHERE stable_id = ?").get(stableId) as Record<string, unknown> | undefined;
    return row ? { stableId, interval: Number(row.interval_days), reviews: Number(row.reviews), dueAt: String(row.due_at), updatedAt: String(row.updated_at) } : null;
  }

  allReviewStates(): ReviewState[] {
    const rows = this.db.prepare("SELECT stable_id FROM review_state").all() as { stable_id: string }[];
    return rows.map((row) => this.reviewState(row.stable_id)!);
  }

  attemptCount(): number {
    return Number((this.db.prepare("SELECT count(*) AS count FROM attempts").get() as { count: number }).count);
  }

  getPending(stableId: string): GeneratedQuestion | null {
    const row = this.db.prepare("SELECT * FROM pending_generated WHERE stable_id = ?").get(stableId) as Record<string, unknown> | undefined;
    return row ? { stableId, seed: Number(row.seed), prompt: String(row.prompt), expectedAnswer: String(row.expected_answer), grader: String(row.grader) } : null;
  }

  getOrCreatePending(stableId: string, create: () => GeneratedQuestion): GeneratedQuestion {
    const existing = this.getPending(stableId);
    if (existing) return existing;
    const generated = create();
    this.db.prepare(`INSERT OR IGNORE INTO pending_generated (stable_id, seed, prompt, expected_answer, grader)
      VALUES (?, ?, ?, ?, ?)`)
      .run(generated.stableId, generated.seed, generated.prompt, generated.expectedAnswer, generated.grader);
    return this.getPending(stableId)!;
  }

  clearPending(stableId: string): void {
    this.db.prepare("DELETE FROM pending_generated WHERE stable_id = ?").run(stableId);
  }

  close(): void { this.db.close(); }
}
