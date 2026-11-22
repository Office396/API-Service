import type { ToolKind } from "./tools";
import { metaExample } from "./meta-tags";

// Executable request bodies (including generators that don't take an `input` field).
export const toolExamples = {
  base64: { input: "Hello, world!", mode: "encode" }, hash: { input: "hello", algorithm: "sha256" },
  uuid: { count: 3 }, slug: { input: "Friday release notes" }, case: { input: "project name", mode: "snake" },
  json: { input: '{"ready":true,"count":3}', mode: "pretty" },
  jwt: { input: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzYW1wbGUifQ.c2FtcGxl" },
  wordcount: { input: "Take a walk. Write a note." }, lorem: { count: 2, unit: "sentences", seed: 7 },
  password: { length: 24 }, color: { hex: "#68ba9c" }, cron: { expression: "*/15 * * * *" },
  utm: { url: "https://example.com/notes", source: "newsletter", medium: "email", campaign: "launch" },
  robots: { rules: [{ agent: "*", allow: ["/"], disallow: ["/drafts/"] }] },
  email: { email: "ada@example.com" }, csv: { input: '[{"name":"Ada","seats":3}]' },
  meta: { title: metaExample.title, description: metaExample.description, url: metaExample.url },
} satisfies Record<ToolKind, Record<string, unknown>>;
