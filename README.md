# Quiz

Quiz is a tiny, phone-first practice loop for one learner. It mixes deterministic mental arithmetic and computer-unit conversions with systems, protocol, authentication, Bash, and kubectl recall. It never executes shell input and never evaluates generated answers as code.

## Run locally

Requires Node.js 22.

```sh
npm ci
npm run dev
```

Open <http://localhost:3000/practice>. Set `PORT` or `DATABASE_PATH` to override their defaults, `3000` and `data/quiz.sqlite`.

For a production-like run:

```sh
npm run build
DATABASE_PATH=data/quiz.sqlite npm start
```

The container runs as a non-root user and only needs write access to `/data` and `/tmp`:

```sh
docker build -t quiz .
docker run --rm -p 3000:3000 -v quiz-data:/data --read-only --tmpfs /tmp quiz
```

## Data ownership

SQLite is the canonical record for the single learner. Stop the process, then copy the file configured by `DATABASE_PATH` to back up or export all attempts, review intervals, and pending generated questions. If copying a live database, use SQLite's backup command instead of copying only the main file because WAL files may contain recent writes.

## Architecture

The Node HTTP server renders HTML and accepts small form posts. Static content is Git-versioned in the `src/*-content.ts` modules. Generated prompts use a seeded PRNG and materialize into SQLite until reviewed. Exact integer and decimal graders are registered by name, bounded, and never use `eval`. A transparent interval scheduler prefers due cards, otherwise alternating generated and static content.

`GET /healthz` is liveness. `GET /readyz` confirms the process opened its database during startup. CI tests, typechecks, and builds every branch push (including `main`) and pull request. After those checks pass, a push to `main` builds and publishes `ghcr.io/michaelmuz/quiz:latest`, but repository owners must configure package visibility separately.

## Deliberately deferred

There are no accounts, dashboard, PWA or sync layer, model calls, shell execution, editor, CMS, advanced spaced-repetition algorithm, or multi-user schema. The private homelab route is the authentication boundary.
