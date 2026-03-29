import {
  HELP_INTRO_MESSAGE,
  STOCKCOMPASS_HELP_SECTIONS,
  type HelpSection,
} from "./system-help-knowledge";

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "in",
  "on",
  "for",
  "of",
  "is",
  "are",
  "how",
  "do",
  "i",
  "my",
  "me",
  "can",
  "what",
  "where",
  "when",
  "why",
  "does",
  "with",
  "from",
  "at",
  "it",
  "we",
  "you",
  "this",
  "that",
  "be",
  "have",
  "has",
  "get",
  "use",
  "using",
]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function scoreSection(section: HelpSection, queryLower: string, tokens: string[]): number {
  let score = 0;
  for (const kw of section.keywords) {
    if (queryLower.includes(kw)) score += 5;
  }
  const titleLow = section.title.toLowerCase();
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (titleLow.includes(t)) score += 4;
    if (section.body.toLowerCase().includes(t)) score += 1;
  }
  if (section.id === "overview" && tokens.length === 0) score += 0;
  return score;
}

function formatSection(s: HelpSection): string {
  return `**${s.title}**\n\n${s.body}`;
}

const FALLBACK_LINES = [
  "I match your question to built-in **StockCompass** guides. I didn’t find a strong match for that phrasing.",
  "",
  "Try asking about:",
  "• **Sign in / register / demo**",
  "• **My Portfolio** — create a book, add or **remove** holdings, ticker search",
  "• **Dashboard / sectors** — browse markets",
  "• **Profile** — change **name**, **email**, **log out**",
  "• **Disclaimer** — advice and data limits",
  "",
  "Or open **AI Tools → Stocky** for **stock research** (separate from this help).",
];

export function getHelpResponse(rawQuery: string): string {
  const query = rawQuery.trim();
  if (!query) {
    return HELP_INTRO_MESSAGE;
  }

  const queryLower = query.toLowerCase();
  const tokens = tokenize(query);

  const ranked = STOCKCOMPASS_HELP_SECTIONS.map((s) => ({
    section: s,
    score: scoreSection(s, queryLower, tokens),
  })).sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const second = ranked[1];

  if (top.score < 3) {
    return FALLBACK_LINES.join("\n");
  }

  if (second && second.score >= top.score * 0.65 && top.section.id !== second.section.id) {
    return `${formatSection(top.section)}\n\n---\n\n${formatSection(second.section)}`;
  }

  return formatSection(top.section);
}
