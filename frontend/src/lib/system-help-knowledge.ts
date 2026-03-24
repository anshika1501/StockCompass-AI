/**
 * StockCompass product documentation for the in-app help assistant.
 * Extend sections + keywords as the product grows.
 */
export type HelpSection = {
  id: string;
  title: string;
  keywords: string[];
  body: string;
};

export const STOCKCOMPASS_HELP_SECTIONS: HelpSection[] = [
  {
    id: "overview",
    title: "What is StockCompass?",
    keywords: [
      "what",
      "stockcompass",
      "app",
      "product",
      "platform",
      "do",
      "purpose",
      "overview",
    ],
    body: `StockCompass is a financial dashboard for exploring **market sectors**, building **personal portfolios**, and using **AI-assisted tools** (sentiment, PCA, predictions, and more).

• **Home** (/) is the marketing site with product highlights.
• After **Sign in**, you use the **dashboard** (white main area + dark left sidebar) for real workflows.
• Features are educational and analytical—not personalized investment advice. Always verify decisions independently.`,
  },
  {
    id: "auth",
    title: "Sign in, register, and demo",
    keywords: [
      "login",
      "log",
      "sign",
      "register",
      "password",
      "account",
      "demo",
      "create",
      "new",
      "user",
    ],
    body: `**Sign in:** Use **Sign in** in the header (marketing site) or open **/login**.

On the sign-in page:
• **Sign in** is the main form at the top (email + password).
• **New users:** scroll to **New to StockCompass?** and fill **name**, **email**, **password**, then **Create account**. After success, sign in with the same email.
• **Try demo account** uses a sample user so you can explore without registering.

**Logged in:** The dashboard top bar shows **Home** and your **name**. Click your name for **Settings** (update display name and email) or **Log out** (returns you to the home page).`,
  },
  {
    id: "navigation",
    title: "Dashboard and sidebar",
    keywords: [
      "nav",
      "sidebar",
      "menu",
      "where",
      "find",
      "page",
      "route",
      "dashboard",
      "home",
      "header",
    ],
    body: `**Top bar (dashboard):**
• **Home** → marketing home (/).
• Your **profile** (name / avatar) → **Settings** or **Log out**.

**Left sidebar:**
• **Dashboard** → sector hub (**/portfolios**) — browse sectors and stocks.
• **My Portfolio** → **/my-portfolio** — your personal portfolios and holdings.
• **Markets** — Sectors, Nifty 50, Gold/Silver, Compare assets.
• **AI Tools** — PCA, Sentiment, Stock prediction, full **Chatbot** page.`,
  },
  {
    id: "sectors",
    title: "Sectors and Market page",
    keywords: [
      "sector",
      "sectors",
      "market",
      "coverage",
      "browse",
      "explore",
      "stocks",
      "nifty",
    ],
    body: `Open **Dashboard** or **Sectors** to reach **/portfolios**.

• You’ll see **coverage** stats (sectors, listed securities, etc.).
• Each **sector card** links to a **sector detail** page with stocks for that theme.
• If you see **Market data · Live feed**, that’s a status strip (when logged in).`,
  },
  {
    id: "my-portfolio",
    title: "My Portfolio — CRUD",
    keywords: [
      "portfolio",
      "portfolios",
      "holding",
      "holdings",
      "add",
      "stock",
      "ticker",
      "delete",
      "create",
      "edit",
      "quantity",
      "buy",
      "price",
      "inr",
      "rupee",
    ],
    body: `**My Portfolio** (**/my-portfolio**) is for **your** books and positions.

**Create a portfolio**
• Use **Create portfolio**: name + optional description; use **Suggestions** chips if you want quick names.
• Click a **portfolio card** to select it (blue highlight).

**Edit / delete a portfolio**
• **Pencil** → change name and description, **Save**.
• **Trash** → deletes the portfolio and all its holdings (confirmed).

**Add a holding**
• Select a portfolio, then use **Add holding**: **Ticker** (try the live search), **Company name**, **Quantity**, **Buy price (₹)** → **Add to portfolio**.

**Holdings table**
• **Search** filters rows.
• **Remove** deletes one line (holding).

Amounts are shown in **INR (₹)** where applicable.`,
  },
  {
    id: "profile-settings",
    title: "Profile and Settings",
    keywords: [
      "profile",
      "settings",
      "name",
      "email",
      "update",
      "change",
      "logout",
      "log out",
      "sign out",
    ],
    body: `Click your **name** (or avatar chip on mobile) in the **top bar**.

• **Settings** opens a dialog: update **display name** and **email** (email is also your login). Save applies on the server and refreshes locally.
• **Log out** clears your session and sends you to **Home**.
• Inside Settings you can also use **Log out and go to home**.`,
  },
  {
    id: "chatbot-help",
    title: "This help chat",
    keywords: [
      "chat",
      "chatbot",
      "help",
      "assistant",
      "floating",
      "button",
      "question",
    ],
    body: `The **floating blue chat** (when you’re not on the home page) answers **how to use StockCompass**—navigation, portfolios, auth, and settings.

For **stock-level research** with retrieval over your data, use **AI Tools → Chatbot** (**/chatbot**) and the **Stock research** mode there (requires backend / models as configured).

This quick help does **not** place trades or access your brokerage.`,
  },
  {
    id: "disclaimer",
    title: "Disclaimer and data",
    keywords: [
      "disclaimer",
      "advice",
      "legal",
      "risk",
      "accurate",
      "data",
      "wrong",
      "error",
    ],
    body: `StockCompass provides **analytics and education**, not investment, tax, or legal advice.

• Market data and AI outputs can be **delayed or incomplete**.
• **Past performance** doesn’t guarantee future results.
• For large decisions, consult a qualified professional.`,
  },
];

export const HELP_SUGGESTED_PROMPTS = [
  "How do I add a stock to my portfolio?",
  "Where do I sign in and register?",
  "How do I change my email or log out?",
  "What is the difference between Dashboard and My Portfolio?",
];

export const HELP_INTRO_MESSAGE = `Hi — I'm your **StockCompass guide**. Ask how to use the app: **sign-in**, **My Portfolio**, **sectors**, **settings**, or **this chat**.

Try a suggestion below or type your own question.`;
