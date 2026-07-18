import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { contentBank, generateQuestion, generatedDefinitions, gradeAnswer, type StaticItem } from "./content.js";
import type { QuizStore } from "./store.js";
import { chooseStableId } from "./scheduler.js";

type AppOptions = { seed?: () => number; now?: () => Date };
const sessionLength = 8;

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function layout(body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Quiz</title><style>
  :root{color-scheme:dark;--ink:#f8f7ff;--muted:#aaa6c2;--card:#211d38;--line:#393254;--violet:#8b5cf6;--cyan:#22d3ee;--good:#4ade80;--bad:#fb7185}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 90% 0,#29325c 0,transparent 30rem),#100e1b;color:var(--ink);font:16px/1.5 system-ui,sans-serif;min-height:100vh}main{width:min(100% - 28px,680px);margin:auto;padding:24px 0 56px}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:26px}.brand{font-weight:900;font-size:1.35rem;letter-spacing:-.04em}.brand i{color:var(--cyan);font-style:normal}.counter{color:var(--muted);font-size:.88rem}.track{height:7px;background:#29243f;border-radius:9px;margin:0 0 22px;overflow:hidden}.track span{display:block;height:100%;background:linear-gradient(90deg,var(--violet),var(--cyan));border-radius:9px}.card{background:color-mix(in srgb,var(--card) 94%,transparent);border:1px solid var(--line);border-radius:22px;padding:clamp(20px,6vw,34px);box-shadow:0 25px 80px #05040b66}.eyebrow{color:var(--cyan);font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}h1{font-size:clamp(1.45rem,7vw,2.2rem);line-height:1.18;letter-spacing:-.035em;margin:13px 0 24px}pre{white-space:pre-wrap;background:#11101a;border:1px solid #343047;padding:18px;border-radius:14px;color:#d8f8ff;font:600 .96rem/1.65 ui-monospace,monospace;overflow:auto}input[type=text]{width:100%;font:700 1.35rem system-ui;padding:16px 17px;border:2px solid #494263;border-radius:14px;background:#151323;color:white;outline:none;margin-bottom:12px}input:focus{border-color:var(--cyan);box-shadow:0 0 0 4px #22d3ee22}button,.button{min-height:52px;border:0;border-radius:14px;padding:13px 18px;font:800 1rem system-ui;cursor:pointer;color:#110e20;background:linear-gradient(135deg,#a78bfa,var(--cyan));width:100%}.choices,.ratings{display:grid;gap:10px}.choice{background:#312b49;color:var(--ink);border:1px solid #4c446a;text-align:left}.reveal summary{list-style:none}.reveal summary::-webkit-details-marker{display:none}.answer{margin-top:16px;padding:17px;background:#161426;border-left:4px solid var(--cyan);border-radius:10px;color:#dedbea}.ratings{grid-template-columns:repeat(2,1fr);margin-top:14px}.ratings button{color:white;background:#332e4b}.ratings button[value=again]{border-bottom:3px solid var(--bad)}.ratings button[value=easy]{border-bottom:3px solid var(--good)}.result{padding:12px 16px;margin-bottom:14px;border-radius:12px;background:#213b34;color:#a7f3d0}.source{display:inline-block;color:#a5eff9;margin-top:16px;font-size:.88rem}@media(min-width:540px){main{padding-top:42px}.ratings{grid-template-columns:repeat(4,1fr)}}
  </style></head><body><main>${body}</main></body></html>`;
}

function pageChrome(position: number, inner: string, result: string | null, expectedAnswer: string | null): string {
  const shown = position % sessionLength + 1;
  const feedback = result && expectedAnswer
    ? `<div class="result">${result === "correct" ? "Correct. Nice work." : "Not quite. Keep it moving."} Expected answer: ${escape(expectedAnswer)}</div>`
    : "";
  return `<header><div class="brand">Qu<i>i</i>z</div><div class="counter">Question ${shown} of ${sessionLength}</div></header>
    <div class="track"><span style="width:${shown / sessionLength * 100}%"></span></div>
    ${feedback}${inner}`;
}

function source(item: StaticItem): string {
  return item.source ? `<a class="source" href="${escape(item.source.url)}" target="_blank" rel="noreferrer">Reference: ${escape(item.source.label)}</a>` : "";
}

function renderStatic(item: StaticItem, position: number, result: string | null, expectedAnswer: string | null): string {
  const submissionId = `static-${item.id}-${position}`;
  const prompt = item.kind === "bash" ? `<pre><code>${escape(item.prompt)}</code></pre>` : `<h1>${escape(item.prompt)}</h1>`;
  const choices = item.choices ? `<div class="choices">${item.choices.map((choice) => `<button class="choice" type="button" onclick="this.closest('.card').querySelector('details').open=true">${escape(choice)}</button>`).join("")}</div>` : "";
  return pageChrome(position, `<section class="card"><div class="eyebrow">${escape(item.topic)} · ${item.kind === "bash" ? "Predict" : "Recall"}</div>${prompt}${choices}
    <details class="reveal"><summary class="button">Reveal answer</summary><div class="answer">${escape(item.answer)}</div>${source(item)}
    <form class="ratings" method="post" action="/practice"><input type="hidden" name="questionId" value="${escape(item.id)}"><input type="hidden" name="submissionId" value="${submissionId}">
    ${(["again", "hard", "good", "easy"] as const).map((rating) => `<button name="rating" value="${rating}">${rating[0]!.toUpperCase() + rating.slice(1)}</button>`).join("")}</form></details></section>`, result, expectedAnswer);
}

function renderGenerated(store: QuizStore, id: string, position: number, result: string | null, expectedAnswer: string | null, seed: () => number): string {
  const question = store.getOrCreatePending(id, () => generateQuestion(id, seed()));
  const prefixRecall = question.grader === "iec-prefix";
  return pageChrome(position, `<section class="card"><div class="eyebrow">${prefixRecall ? "Quick recall" : "Quick calculation"}</div><h1>${escape(question.prompt)}</h1>
    <form method="post" action="/practice"><input type="hidden" name="questionId" value="${escape(id)}"><input type="hidden" name="submissionId" value="generated-${escape(id)}-${question.seed}"><input type="hidden" name="seed" value="${question.seed}">
    <input name="response" type="text" inputmode="${prefixRecall ? "text" : "numeric"}" autocomplete="off" maxlength="24" aria-label="Your answer" required autofocus><button>Check answer</button></form></section>`, result, expectedAnswer);
}

async function formBody(request: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 8_192) throw new Error("Form too large");
    chunks.push(chunk);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

export function createQuizServer(store: QuizStore, options: AppOptions = {}) {
  const seed = options.seed ?? (() => Math.floor(Math.random() * 0x7fffffff));
  const now = options.now ?? (() => new Date());
  return createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", "http://quiz.local");
    if (request.method === "GET" && (url.pathname === "/healthz" || url.pathname === "/readyz")) {
      response.writeHead(200, { "content-type": "text/plain; charset=utf-8" }).end("ok"); return;
    }
    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(303, { location: "/practice" }).end(); return;
    }
    if (request.method === "GET" && url.pathname === "/practice") {
      const position = store.attemptCount();
      const result = url.searchParams.get("result");
      const reviewed = store.attemptBySubmission(url.searchParams.get("review") ?? "");
      const expectedAnswer = reviewed?.correct === null ? null : reviewed?.expectedAnswer ?? null;
      const stableId = chooseStableId(position, store.allReviewStates(), now());
      const generated = generatedDefinitions.some((item) => item.id === stableId);
      const body = generated
        ? renderGenerated(store, stableId, position, result, expectedAnswer, seed)
        : renderStatic(contentBank.find((item) => item.id === stableId)!, position, result, expectedAnswer);
      response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).end(layout(body)); return;
    }
    if (request.method === "POST" && url.pathname === "/practice") {
      try {
        const form = await formBody(request);
        const questionId = form.get("questionId") ?? "";
        const submissionId = form.get("submissionId") ?? "";
        const generated = generatedDefinitions.find((item) => item.id === questionId);
        const item = contentBank.find((candidate) => candidate.id === questionId);
        if ((!generated && !item) || !submissionId) throw new Error("Invalid question");
        const existing = store.attemptBySubmission(submissionId);
        if (existing) {
          const suffix = existing.correct === null ? "" : `?result=${existing.correct ? "correct" : "incorrect"}&review=${encodeURIComponent(submissionId)}`;
          response.writeHead(303, { location: `/practice${suffix}` }).end(); return;
        }
        const reviewedAt = now().toISOString();
        let correct: boolean | null = null;
        if (generated) {
          const pending = store.getPending(questionId);
          if (!pending) throw new Error("Question is no longer pending");
          const userResponse = form.get("response") ?? "";
          correct = gradeAnswer(pending.grader, userResponse, pending.expectedAnswer);
          store.recordAttempt({ submissionId, stableId: questionId, seed: pending.seed, prompt: pending.prompt,
            expectedAnswer: pending.expectedAnswer, response: userResponse, correct, rating: correct ? "good" : "again", reviewedAt });
        } else {
          const rating = form.get("rating");
          if (!(["again", "hard", "good", "easy"] as string[]).includes(rating ?? "")) throw new Error("Invalid rating");
          store.recordAttempt({ submissionId, stableId: item!.id, seed: null, prompt: item!.prompt,
            expectedAnswer: item!.answer, response: null, correct: null, rating: rating as "again" | "hard" | "good" | "easy", reviewedAt });
        }
        response.writeHead(303, { location: `/practice${correct === null ? "" : `?result=${correct ? "correct" : "incorrect"}&review=${encodeURIComponent(submissionId)}`}` }).end(); return;
      } catch {
        response.writeHead(400, { "content-type": "text/plain; charset=utf-8" }).end("Invalid submission"); return;
      }
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
  });
}
