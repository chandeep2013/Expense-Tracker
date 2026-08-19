import { createApp } from "./app.js";
import { loadConfig, isLive } from "./config.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const config = loadConfig();
const app = createApp(config);

app.listen(PORT, HOST, () => {
  const mode = isLive(config) ? "LIVE (Gmail)" : "SAMPLE (fixtures)";
  console.log(`[expense-tracker] API on http://${HOST}:${PORT} — mode: ${mode}`);
  console.log(`[expense-tracker] labels: ${config.labels.join(", ")}`);
  if (!isLive(config)) {
    console.log(
      "[expense-tracker] Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN to read your inbox."
    );
  }
});
