import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createQuizServer } from "./app.js";
import { QuizStore } from "./store.js";

const databasePath = process.env.DATABASE_PATH ?? "data/quiz.sqlite";
mkdirSync(dirname(databasePath), { recursive: true });
const store = new QuizStore(databasePath);
const server = createQuizServer(store);
const port = Number(process.env.PORT ?? 3000);

server.listen(port, "0.0.0.0", () => {
  console.log(`Quiz listening on :${port}`);
});

function shutdown() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
