/**
 * Runtime configuration, driven entirely by environment variables so no
 * secrets live in the repo. When the Google OAuth variables are absent the app
 * runs in "sample" mode against local fixtures, which keeps it fully runnable
 * end-to-end before credentials are provided.
 */
export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface AppConfig {
  /** Gmail labels to read in addition to the inbox. */
  labels: string[];
  /** Present only when all three OAuth env vars are set. */
  google?: GoogleCredentials;
  /** Max messages to fetch per label/query. */
  maxMessages: number;
}

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

export function loadConfig(): AppConfig {
  const clientId = firstEnv("GOOGLE_CLIENT_ID", "GMAIL_CLIENT_ID");
  const clientSecret = firstEnv("GOOGLE_CLIENT_SECRET", "GMAIL_CLIENT_SECRET");
  const refreshToken = firstEnv("GOOGLE_REFRESH_TOKEN", "GMAIL_REFRESH_TOKEN");

  const labels = (process.env.GMAIL_LABELS ?? "UPI,Credit card")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  const google =
    clientId && clientSecret && refreshToken
      ? { clientId, clientSecret, refreshToken }
      : undefined;

  return {
    labels,
    google,
    maxMessages: Number(process.env.GMAIL_MAX_MESSAGES ?? 50),
  };
}

export function isLive(config: AppConfig): boolean {
  return Boolean(config.google);
}
