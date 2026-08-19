import { google, type gmail_v1 } from "googleapis";
import type { AppConfig } from "./config.js";
import { isLive } from "./config.js";
import { SAMPLE_EMAILS } from "./fixtures.js";
import type { RawEmail } from "./types.js";

function decodeBody(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";
  const fromData = (data?: string | null) =>
    data ? Buffer.from(data, "base64url").toString("utf8") : "";

  // Prefer text/plain, then text/html (stripped), walking nested parts.
  const walk = (part: gmail_v1.Schema$MessagePart): string | null => {
    if (part.mimeType === "text/plain" && part.body?.data) return fromData(part.body.data);
    for (const child of part.parts ?? []) {
      const found = walk(child);
      if (found) return found;
    }
    if (part.mimeType === "text/html" && part.body?.data) {
      return fromData(part.body.data).replace(/<[^>]+>/g, " ");
    }
    return null;
  };

  return (walk(payload) ?? fromData(payload.body?.data))
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function header(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function gmailClient(config: AppConfig): gmail_v1.Gmail {
  const { clientId, clientSecret, refreshToken } = config.google!;
  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth });
}

/**
 * Fetch transaction emails from Gmail. Reads the inbox plus each configured
 * label (e.g. "UPI", "Credit card"), merging labels when the same message
 * appears under more than one query. Falls back to local sample emails when no
 * credentials are configured so the app is always runnable.
 */
export async function fetchEmails(config: AppConfig): Promise<RawEmail[]> {
  if (!isLive(config)) return SAMPLE_EMAILS;

  const gmail = gmailClient(config);

  // Resolve configured label display names to Gmail label IDs.
  const { data: labelData } = await gmail.users.labels.list({ userId: "me" });
  const labelsByName = new Map(
    (labelData.labels ?? []).map((l) => [l.name?.toLowerCase() ?? "", l])
  );

  const queries: { labelId: string; labelName: string }[] = [
    { labelId: "INBOX", labelName: "INBOX" },
  ];
  for (const name of config.labels) {
    const found = labelsByName.get(name.toLowerCase());
    if (found?.id) queries.push({ labelId: found.id, labelName: found.name ?? name });
  }

  const byId = new Map<string, RawEmail>();
  for (const query of queries) {
    const { data: list } = await gmail.users.messages.list({
      userId: "me",
      labelIds: [query.labelId],
      maxResults: config.maxMessages,
    });
    for (const ref of list.messages ?? []) {
      if (!ref.id) continue;
      const existing = byId.get(ref.id);
      if (existing) {
        if (!existing.labels.includes(query.labelName)) existing.labels.push(query.labelName);
        continue;
      }
      const { data: msg } = await gmail.users.messages.get({
        userId: "me",
        id: ref.id,
        format: "full",
      });
      byId.set(ref.id, {
        id: ref.id,
        labels: [query.labelName],
        from: header(msg.payload?.headers, "From"),
        subject: header(msg.payload?.headers, "Subject"),
        body: decodeBody(msg.payload) || msg.snippet || "",
        internalDate: Number(msg.internalDate ?? Date.now()),
      });
    }
  }

  return [...byId.values()];
}
