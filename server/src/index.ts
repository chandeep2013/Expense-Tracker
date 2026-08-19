import { createApp } from "./app.js";
import { openDatabase } from "./db.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const db = openDatabase();
const app = createApp(db);

const server = app.listen(PORT, HOST, () => {
  console.log(`[expense-tracker] API listening on http://${HOST}:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
