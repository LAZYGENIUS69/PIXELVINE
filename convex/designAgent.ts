/**
 * Design Agent Orchestrator — 2026 HiFi Edition
 *
 * Dual-step Architect → Designer pipeline.
 * Primary: Groq (raw groq-sdk) — blazing fast
 * Fallback: Google Gemini via @google/generative-ai — automatic on quota errors
 *
 * Step 1 (Architect): userPrompt → JSON plan (screens + theme)
 * Step 2 (Designer):  each screen → premium HTML + inline CSS (2026 HiFi standards)
 */

import Groq from "groq-sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Screen {
  id: string;
  name: string;
  purpose: string;
  visualDescription: string;
}

interface AnalysisResult {
  screens: Screen[];
  themeToUse: { colorPalette: string; typographyVibe: string };
}

// ---------------------------------------------------------------------------
// AI Client — Groq only
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const GROQ_MODEL = "llama-3.3-70b-versatile";
const CEREBRAS_MODEL = "gpt-oss-120b"; // 120B model, up to 32768 tokens, free

/** Groq call — fastest, 100K tokens/day free */
async function callGroq(systemPrompt: string, userPrompt: string, temperature: number): Promise<string> {
  const apiKey = (process.env.GROQ_API_KEY || process.env.groq || "").trim();
  if (!apiKey) throw new Error("NO_GROQ_KEY");
  const groq = new Groq({ apiKey });
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: 4096,
  });
  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Groq returned empty response");
  return text;
}

/** Cerebras call — fast, 1M tokens/day free (OpenAI-compatible) */
async function callCerebras(systemPrompt: string, userPrompt: string, temperature: number): Promise<string> {
  const apiKey = (process.env.CEREBRAS_API_KEY || process.env.CEREBRAS || "").trim();
  if (!apiKey) throw new Error("NO_CEREBRAS_KEY");
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CEREBRAS_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: 8192,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${res.status} ${errText}`);
  }
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Cerebras returned empty response");
  return text;
}

const isRateLimit = (err: unknown) => {
  const msg = String(err);
  return msg.includes("429") || msg.includes("rate_limit_exceeded") || msg.includes("Rate limit") || msg.includes("RESOURCE_EXHAUSTED");
};

/**
 * AI dispatcher — 3-tier fallback:
 *  1. Groq         (100K tokens/day, blazing fast)
 *  2. Cerebras     (1M tokens/day, equally fast — kicks in on Groq 429)
 *  3. Gemini lite  (last resort — kicks in if both above are rate-limited)
 */
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.7
): Promise<string> {
  // 1. Try Groq
  const groqKey = (process.env.GROQ_API_KEY || process.env.groq || "").trim();
  if (groqKey) {
    try {
      const text = await callGroq(systemPrompt, userPrompt, temperature);
      console.log("[DesignAgent] ✓ Groq");
      return text;
    } catch (err) {
      if (!isRateLimit(err)) throw err;
      console.warn("[DesignAgent] Groq rate-limited → trying Cerebras");
    }
  }

  // 2. Try Cerebras
  const cerebrasKey = (process.env.CEREBRAS_API_KEY || process.env.CEREBRAS || "").trim();
  if (cerebrasKey) {
    try {
      const text = await callCerebras(systemPrompt, userPrompt, temperature);
      console.log("[DesignAgent] ✓ Cerebras");
      return text;
    } catch (err) {
      if (!isRateLimit(err) && !String(err).includes("NO_CEREBRAS_KEY")) throw err;
      console.warn("[DesignAgent] Cerebras rate-limited or failed");
    }
  }

  throw new Error("Both Groq and Cerebras failed or were not configured.");
}


// ---------------------------------------------------------------------------
// JSON extractor
// ---------------------------------------------------------------------------

function extractJSON(raw: string): string {
  const s = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1)
    throw new Error(`No JSON object found. Got: ${s.slice(0, 200)}`);
  return s.slice(start, end + 1);
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const ARCHITECT_SYSTEM = `You are a Senior Mobile App Architect and Creative Director. Plan exactly 3 DISTINCT mobile screens.

Each screen MUST be a different type. Assign from this list based on the app domain:
- ONBOARDING: full-screen splash, huge headline, hero card, single CTA, no nav bar
- LOGIN: form with inputs, social login buttons, biometric option, no nav bar
- DASHBOARD: main home, balance hero, chart, activity list, bottom nav
- PROFILE: avatar, stats row, settings list
- STATS: chart hero, breakdown bars, leaderboard
- EXPLORE: search bar, category chips, cards grid

Return ONLY valid JSON — no markdown, no backtick fences, no explanation. Exact shape:
{
  "screens": [
    { "id": "screen_1", "name": "...", "type": "ONBOARDING", "purpose": "...", "visualDescription": "...", "primaryColor": "#hex", "accentColor": "#hex" },
    { "id": "screen_2", "name": "...", "type": "LOGIN", "purpose": "...", "visualDescription": "...", "primaryColor": "#hex", "accentColor": "#hex" },
    { "id": "screen_3", "name": "...", "type": "DASHBOARD", "purpose": "...", "visualDescription": "...", "primaryColor": "#hex", "accentColor": "#hex" }
  ],
  "themeToUse": {
    "bg": "#hex",
    "primary": "#hex",
    "accent": "#hex",
    "colorPalette": "one-line description",
    "typographyVibe": "bold/clean/elegant/playful"
  }
}

Domain color palettes (use EXACT hex values):
- FINTECH: bg=#0A0A0A, primary=#22C55E, accent=#16A34A
- FITNESS: bg=#0D0D0D, primary=#F97316, accent=#FB923C
- SOCIAL: bg=#0C0014, primary=#A855F7, accent=#EC4899
- FOOD: bg=#0A0D08, primary=#22C55E, accent=#84CC16
- TRAVEL: bg=#040D1A, primary=#38BDF8, accent=#0EA5E9
- ECOMMERCE: bg=#0A0A08, primary=#FBBF24, accent=#F59E0B
- DEFAULT: bg=#0A0A0F, primary=#8B5CF6, accent=#A78BFA`;

const WEB_ARCHITECT_SYSTEM = `You are a Senior Web Product Designer at a Tier-1 SaaS company (think Linear, Vercel, Stripe, Notion). Plan exactly 3 DISTINCT desktop web pages/views.

Each page MUST be a different type. Assign from this list based on the app domain:
- LANDING: hero section, features grid, CTA, dark glassy navbar
- AUTH: centered card with login/signup form, brand logo, social auth
- DASHBOARD: sidebar nav, top header, metric cards, chart, data table
- SETTINGS: sidebar nav, settings panels with toggles and inputs
- ANALYTICS: full-width charts, KPI cards, filters bar, data table
- EXPLORE: search + filter sidebar, card grid or list, pagination

Return ONLY valid JSON — no markdown, no backtick fences, no explanation. Exact shape:
{
  "screens": [
    { "id": "screen_1", "name": "...", "type": "LANDING", "purpose": "...", "visualDescription": "...", "primaryColor": "#hex", "accentColor": "#hex" },
    { "id": "screen_2", "name": "...", "type": "AUTH", "purpose": "...", "visualDescription": "...", "primaryColor": "#hex", "accentColor": "#hex" },
    { "id": "screen_3", "name": "...", "type": "DASHBOARD", "purpose": "...", "visualDescription": "...", "primaryColor": "#hex", "accentColor": "#hex" }
  ],
  "themeToUse": {
    "bg": "#hex",
    "primary": "#hex",
    "accent": "#hex",
    "colorPalette": "one-line description",
    "typographyVibe": "bold/clean/elegant/playful"
  }
}

Domain color palettes (use EXACT hex values):
- FINTECH/SAAS: bg=#08090C, primary=#6366F1, accent=#8B5CF6
- ANALYTICS: bg=#0A0D14, primary=#22D3EE, accent=#38BDF8
- ECOMMERCE: bg=#0A0A08, primary=#FBBF24, accent=#F59E0B
- SOCIAL/COMMUNITY: bg=#0C0014, primary=#A855F7, accent=#EC4899
- PRODUCTIVITY: bg=#08090C, primary=#10B981, accent=#34D399
- DEFAULT: bg=#0A0A0F, primary=#8B5CF6, accent=#A78BFA`;


const DESIGNER_SYSTEM = `You are a Principal Product Designer at a Tier-1 company (think Stripe, Robinhood, Linear). You produce AWARD-WINNING mobile UI for iPhone 390x844px. Your output renders in a live iframe with Tailwind CSS v4 CDN and Lucide SVG icons already loaded.

OUTPUT FORMAT: A single raw HTML <div> — NO markdown fences, NO explanation, NO <!DOCTYPE>.
ALWAYS use inline style="..." on every element. Tailwind classes are BONUS.

═══════════════════════════════════════
RULE #1 — FOLLOW THE PROMPT LITERALLY
═══════════════════════════════════════
- App name → use it in the brand badge (never write "Gen Z Finance Hub" for a headphones app)
- Product type → headphones shows headphones, NOT credit cards
- Audience/tone cues → "luxury" = premium serif; "Gen Z" = bold grotesque; "professional" = clean sans
- Domain content → ONLY finance apps show bank balances/credit cards
VIOLATING THIS = HARD FAILURE.

═══════════════════════════════════════
RULE #2 — 2026 DESIGN DNA (ALL SCREENS)
═══════════════════════════════════════

A) ROOT CONTAINER — always exactly this:
<div style="width:390px;height:844px;background:BG_COLOR;color:#fff;position:relative;overflow:hidden;font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;">

B) LAYERED BACKGROUND — add BOTH:
  1. Dot-grid texture overlay:
  <div style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px);background-size:24px 24px;pointer-events:none;z-index:0;"></div>
  2. Primary glow orb (top-right):
  <div style="position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(PRIMARY_R,PRIMARY_G,PRIMARY_B,0.18) 0%,transparent 65%);top:-100px;right:-100px;pointer-events:none;filter:blur(40px);z-index:0;"></div>
  3. Accent glow orb (bottom-left):
  <div style="position:absolute;width:280px;height:280px;background:radial-gradient(circle,rgba(ACCENT_R,ACCENT_G,ACCENT_B,0.12) 0%,transparent 65%);bottom:60px;left:-80px;pointer-events:none;filter:blur(30px);z-index:0;"></div>

C) STATUS BAR — always first child after bg layers:
<div style="height:44px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;position:relative;z-index:1;">
  <span style="font-size:15px;font-weight:700;">9:41</span>
  <div style="display:flex;gap:6px;align-items:center;">
    <svg width="17" height="12" viewBox="0 0 17 12" fill="white"><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="white" stroke-width="1.5"><path d="M8 2.5C10.5 2.5 12.7 3.5 14.3 5.1"/><path d="M1.7 5.1C3.3 3.5 5.5 2.5 8 2.5"/><path d="M3.7 7.1C4.9 5.9 6.4 5.2 8 5.2C9.6 5.2 11.1 5.9 12.3 7.1"/><circle cx="8" cy="9.5" r="1.5" fill="white"/></svg>
    <div style="background:white;border-radius:3px;width:25px;height:12px;position:relative;"><div style="background:BG_COLOR;border-radius:2px;width:18px;height:8px;position:absolute;top:2px;left:2px;"></div></div>
  </div>
</div>

D) 3D GLASSMORPHIC CARDS — hero cards MUST use:
  style="background:rgba(255,255,255,0.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;transform:perspective(1000px) rotateX(4deg) rotateY(-2deg);box-shadow:0 25px 60px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.12);"
  + add holographic inner layer:
  <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 60%);border-radius:inherit;pointer-events:none;"></div>

E) NEON CTA BUTTONS — gradient + glow (use #DFFF00 as accent for POSITIVE actions):
  style="background:linear-gradient(135deg,PRIMARY_COLOR 0%,ACCENT_COLOR 100%);border:none;border-radius:16px;padding:18px;color:#000;font-weight:900;font-size:16px;width:100%;letter-spacing:0.5px;box-shadow:0 0 40px -8px PRIMARY_COLOR,0 8px 24px rgba(0,0,0,0.4);"

F) GLASSMORPHIC INPUT FIELDS:
  style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px 18px;color:white;font-size:15px;outline:none;box-sizing:border-box;backdrop-filter:blur(12px);"

G) SECTION HEADERS — uppercase tracking:
  style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:0.4;margin-bottom:12px;"

H) BOTTOM NAV (dashboard screens only):
  style="height:80px;background:rgba(0,0,0,0.6);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-around;padding-bottom:16px;flex-shrink:0;"
  Active tab: color=PRIMARY_COLOR with a 4px glowing dot above icon

═══════════════════════════════════════
SCREEN-TYPE TEMPLATES
═══════════════════════════════════════

── ONBOARDING (no bottom nav) ──
 Content fills from status bar to bottom edge.
 1. Brand pill (top, centered):
    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:99px;padding:6px 16px;font-size:12px;font-weight:600;letter-spacing:0.5px;backdrop-filter:blur(10px);">⚡ [EXACT APP NAME]</div>
 2. HERO SLOGAN — 72px, weight:900, line-height:0.95, letter-spacing:-4px, ALL CAPS:
    Must be DOMAIN-RELEVANT ("LUXURY SOUND" for headphones, "MONEY MOVES" for finance, etc.)
 3. HERO 3D CARD — domain-specific visual (glass card with 3D tilt):
    - Finance/fintech → credit card: chip + •••• •••• •••• 4291 + ALEX MORGAN + VISA
    - Ecommerce/product → product showcase: relevant emoji + product name + price + rating
    - Fitness → glowing SVG activity ring + big calorie/step number
    - Food → food emoji + dish name + "30 min" delivery badge
    - Travel → destination card with city name + price per night
    - Social → avatar circle + username + follower count badge
 4. Tagline (14px, opacity:0.45), then CTA button (domain-relevant text)
 5. "I already have an account" link (13px, opacity:0.35, centered)

── LOGIN (no bottom nav) ──
 1. Back arrow (←) + bold header (32px, 900) + subtext (domain-appropriate, opacity:0.45)
 2. ACTUAL <input> HTML elements — NOT divs:
    <input type="email" placeholder="Email or @handle" style="...glassmorphic...">
    Password field with 👁 eye icon positioned absolutely inside wrapper
 3. "Forgot Password?" right-aligned in PRIMARY_COLOR (13px)
 4. Gradient CTA button: "Sign In →" with neon glow shadow
 5. OR divider → Google + Apple buttons side by side (glassmorphic)
 6. Biometric row: fingerprint icon + "Unlock with Touch ID"

── DASHBOARD (with bottom nav, 4 tabs) ──
 ALL content MUST match the app domain:
 - Finance → balance, transactions, spending chart
 - Ecommerce → recent orders, product recommendations, cart
 - Fitness → steps, calories, workout chart
 - Food → order status, popular dishes, recent orders
 - Travel → upcoming trips, savings progress
 - Social → feed metrics, notifications, follower growth

 1. Header: greeting ("Good morning, Alex 👋") + bell icon
 2. Hero metric card (glassmorphic 3D tilt):
    - Caption: domain metric label (UPPERCASE, opacity:0.45)
    - Big number: 44px, weight:800 — domain-appropriate (balance/steps/orders)
    - Pill badge: positive metric in #DFFF00 text on dark pill
    - 3 mini stats in a row
 3. "Performance" section + time selector tabs
    Inline SVG chart (NO external images):
    <svg viewBox="0 0 350 100" style="width:100%;height:100px;" preserveAspectRatio="none">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="PRIMARY" stop-opacity="0.4"/><stop offset="100%" stop-color="PRIMARY" stop-opacity="0"/></linearGradient></defs>
      <path d="M0,80 C40,70 80,60 120,42 S190,18 240,24 S310,6 350,4" fill="none" stroke="PRIMARY" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M0,80 C40,70 80,60 120,42 S190,18 240,24 S310,6 350,4 L350,100 L0,100 Z" fill="url(#cg)"/>
      <circle cx="350" cy="4" r="4" fill="PRIMARY"/>
    </svg>
 4. Breakdown section: 4 progress bar rows — DOMAIN-APPROPRIATE categories
    Each row: colored dot + label + bar (bg:rgba(255,255,255,0.08)) + filled portion (PRIMARY) + amount
 5. Recent activity: 2-3 rows — DOMAIN-RELEVANT items only
 6. Bottom nav: 4 domain-appropriate tabs

═══════════════════════════════════════
GLOBAL RULES (NON-NEGOTIABLE)
═══════════════════════════════════════
- Status bar: ALWAYS present with SVG icons (never text placeholders)
- NO <img> tags anywhere — use gradient divs, inline SVGs, or emoji
- NO lorem ipsum — use realistic domain-appropriate data
- All inline styles are required; Tailwind classes are bonus
- Content must flow and fit within 844px height
- Fonts: Inter for body, system-ui fallback
- Every card has glassmorphism + 3D shadow; every button glows
- Background is ALWAYS the dark BG_COLOR hex (never transparent or white)
`;

// ---------------------------------------------------------------------------
// Web Designer System Prompt
// ---------------------------------------------------------------------------
const WEB_DESIGNER_SYSTEM = `You are a Principal Web Product Designer at a Tier-1 SaaS company (think Linear, Vercel, Stripe, Notion). You create AWARD-WINNING desktop web UI at 1440×900px. Your output renders in a live iframe.

OUTPUT FORMAT: A single raw HTML <div> — NO markdown fences, NO explanation, NO <!DOCTYPE>.
ALWAYS use inline style="..." on every element.

═══════════════════════════════════════
ROOT CONTAINER — always exactly this:
═══════════════════════════════════════
<div style="width:1440px;height:900px;background:BG_COLOR;color:#fff;position:relative;overflow:hidden;font-family:'Inter',system-ui,sans-serif;display:flex;flex-direction:column;">

═══════════════════════════════════════
2026 WEB DESIGN DNA
═══════════════════════════════════════

A) LAYERED BACKGROUND:
  1. Subtle dot-grid:
  <div style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;z-index:0;"></div>
  2. Primary glow top-right:
  <div style="position:absolute;width:700px;height:700px;background:radial-gradient(circle,rgba(PRIMARY_HEX_RGB,0.12) 0%,transparent 65%);top:-200px;right:-100px;pointer-events:none;filter:blur(80px);z-index:0;"></div>
  3. Accent glow bottom-left:
  <div style="position:absolute;width:500px;height:500px;background:radial-gradient(circle,rgba(ACCENT_HEX_RGB,0.08) 0%,transparent 65%);bottom:-100px;left:-100px;pointer-events:none;filter:blur(60px);z-index:0;"></div>

B) TOP NAVBAR (all pages except AUTH):
  <div style="height:60px;padding:0 32px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.4);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0;position:relative;z-index:10;">
    Left: Logo mark (colored square/circle) + app name bold
    Center: Nav links (5 items, active one highlighted in PRIMARY_COLOR)
    Right: Avatar circle + notification bell + CTA button
  </div>

C) LEFT SIDEBAR (DASHBOARD, SETTINGS, ANALYTICS pages):
  <div style="width:240px;background:rgba(255,255,255,0.02);border-right:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;padding:24px 16px;gap:4px;flex-shrink:0;">
    - Logo row at top
    - Nav items: icon + label, active item has PRIMARY_COLOR background pill
    - Bottom: user avatar + name + logout
  </div>

D) GLASSMORPHIC CARDS:
  style="background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.3);"

E) KPI METRIC CARDS (4-column row):
  Each card: icon circle (PRIMARY_COLOR bg) + label (12px, opacity:0.5) + big number (32px, bold) + trend badge (green/red pill)

F) BUTTONS:
  Primary: style="background:linear-gradient(135deg,PRIMARY 0%,ACCENT 100%);border:none;border-radius:10px;padding:10px 20px;color:#fff;font-weight:700;font-size:14px;box-shadow:0 0 24px -4px PRIMARY;"
  Ghost: style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 20px;color:rgba(255,255,255,0.8);font-weight:600;font-size:14px;"

G) DATA TABLE:
  <div style="border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;">
    Header row: bg rgba(255,255,255,0.04), uppercase 11px, opacity:0.4
    Data rows: alternating subtle bg, border-bottom rgba(255,255,255,0.04)
    Status badges: colored pills (green=success, yellow=pending, red=failed)
  </div>

H) INLINE SVG CHART (wide format):
  <svg viewBox="0 0 900 160" style="width:100%;height:160px;" preserveAspectRatio="none">
    Grid lines: 4-5 horizontal dashed lines, opacity:0.1
    Area chart with gradient fill from PRIMARY to transparent
    Data points with hover circles at key values
  </svg>

═══════════════════════════════════════
PAGE-TYPE TEMPLATES
═══════════════════════════════════════

── LANDING ──
  Full-width layout, NO sidebar:
  1. Glassmorphic top navbar (logo + 5 nav links + CTA)
  2. Hero section (centered text, ~400px tall):
     - Announcement pill badge ("✨ Now in Beta")
     - Giant headline: 72px weight:900 letter-spacing:-3px multi-line
     - Subheadline: 20px, opacity:0.55, max-width:560px
     - Two CTA buttons: Primary gradient + Ghost secondary
     - Social proof row: avatars strip + "10k+ teams trust us"
  3. Feature row: 3 glassmorphic feature cards with icon, title, description
  4. Stats bar: 3-4 large number stats (e.g., "99.9% uptime", "4.9★ rating")

── AUTH ──
  Two-column layout (NO sidebar, NO top nav):
  Left column (w:720px): large gradient background, brand logo, bold tagline, 3 benefit bullets
  Right column (w:720px): centered white/glass card with:
    - APP LOGO + name centered
    - "Welcome back" heading (28px bold)
    - Email + Password glassmorphic inputs
    - "Forgot password?" aligned right in PRIMARY_COLOR
    - Primary gradient sign-in button full width
    - OR divider + Google/GitHub buttons side by side
    - Sign-up link at bottom

── DASHBOARD ──
  Sidebar (240px) + main content:
  Main content split:
    Top row: 4 KPI cards (total users / revenue / growth / churn)
    Middle: Area chart (60% width) + activity feed (40% width)
    Bottom: Data table with recent entries + status badges

── ANALYTICS ──
  Sidebar (240px) + main content:
  Top: Time range filter tabs + export button
  Row 1: 4 KPI stat cards
  Row 2: Large area chart full width with date labels
  Row 3: Two side-by-side charts (bar + donut)
  Row 4: Data table

── SETTINGS ──
  Sidebar (240px) + settings panels:
  Settings sections: Profile, Notifications, Billing, Security
  Each section: heading + divider + form rows (label + input/toggle side by side)
  Toggle switches: rounded pill, PRIMARY_COLOR when active

── EXPLORE ──
  Top: search bar full width + filter chips row
  Left filter sidebar (200px): category checkboxes, price range, rating filter
  Main: 3-column card grid (title, description, meta, action button)
  Bottom: pagination dots

═══════════════════════════════════════
GLOBAL RULES (NON-NEGOTIABLE)
═══════════════════════════════════════
- NO <img> tags — use gradient divs, inline SVGs, emoji, or colored placeholder divs
- NO lorem ipsum — use realistic domain-appropriate data
- All dimensions MUST fit the 1440×900px canvas
- Fonts: Inter for body, system-ui fallback
- Every card uses glassmorphism; every CTA button glows with PRIMARY_COLOR shadow
- Background is ALWAYS the dark BG_COLOR hex
- Left sidebar items must have icon (inline SVG or emoji) + text label
- Data in tables and charts must be DOMAIN-APPROPRIATE (never generic "Data 1", "Data 2")
`;


// ---------------------------------------------------------------------------
// Main Action
// ---------------------------------------------------------------------------

export const runDesignAgent = action({
  args: {
    projectId: v.id("projects"),
    userPrompt: v.string(),
    designType: v.optional(v.union(v.literal("mobile"), v.literal("website"))),
  },
  handler: async (ctx, args) => {
    const jobId: Id<"generationJobs"> = await ctx.runMutation(
      api.generationJobs.create,
      { projectId: args.projectId }
    );

    try {
      console.log("[DesignAgent] Starting with Groq:", GROQ_MODEL);

      // -----------------------------------------------------------------------
      // STEP 1: Architect
      // -----------------------------------------------------------------------
      console.log("[DesignAgent] Step 1: Architect calling AI...");

      const isWebMode = args.designType === "website";
      const architectSystemPrompt = isWebMode ? WEB_ARCHITECT_SYSTEM : ARCHITECT_SYSTEM;
      const designerSystemPrompt = isWebMode ? WEB_DESIGNER_SYSTEM : DESIGNER_SYSTEM;
      const canvasWidth = isWebMode ? "1440px" : "390px";
      const canvasHeight = isWebMode ? "900px" : "844px";

      const architectRaw = await callAI(
        architectSystemPrompt,
        `Design request: "${args.userPrompt}"\nDesign mode: ${isWebMode ? "Desktop Web (1440×900px SaaS)" : "Mobile App (iPhone 390×844px)"}\n\nReturn ONLY the JSON plan. No explanation.`,
        0.5
      );

      console.log("[DesignAgent] Architect response (first 400):", architectRaw.slice(0, 400));

      let analysisObj: AnalysisResult;
      try {
        analysisObj = JSON.parse(extractJSON(architectRaw)) as AnalysisResult;
      } catch (e) {
        throw new Error(`Architect JSON parse failed: ${e}. Raw: ${architectRaw.slice(0, 300)}`);
      }

      if (!analysisObj.screens?.length) {
        throw new Error("Architect returned 0 screens");
      }

      console.log(`[DesignAgent] Architect planned ${analysisObj.screens.length} screens`);

      await ctx.runMutation(api.generationJobs.update, {
        id: jobId,
        analysis: JSON.stringify(analysisObj),
        theme: JSON.stringify(analysisObj.themeToUse),
        totalScreens: analysisObj.screens.length,
        status: "designing",
      });

      // Create frame placeholders
      const frameIds: string[] = [];
      for (let i = 0; i < analysisObj.screens.length; i++) {
        const s = analysisObj.screens[i];
        const fid = await ctx.runMutation(api.frames.create, {
          projectId: args.projectId,
          screenId: s.id,
          name: s.name,
          purpose: s.purpose,
          order: i,
        });
        frameIds.push(fid);
      }

      // -----------------------------------------------------------------------
      // STEP 2: Designer — one screen at a time
      // -----------------------------------------------------------------------
      let completedCount = 0;

      for (let i = 0; i < analysisObj.screens.length; i++) {
        const screen = analysisObj.screens[i];
        const frameId = frameIds[i];

        console.log(`[DesignAgent] Designing screen ${i + 1}/${analysisObj.screens.length}: "${screen.name}"`);

        await ctx.runMutation(api.frames.setStatus, {
          id: frameId as any,
          status: "generating",
        });

        try {
          const theme = analysisObj.themeToUse as any;
          const primaryColor: string = (screen as any).primaryColor || theme.primary || "#8B5CF6";
          const accentColor: string = (screen as any).accentColor || theme.accent || "#EC4899";
          const bgColor: string = theme.bg || "#0A0A0F";

          const screenType: string = (screen as any).type || "DASHBOARD";

          const designerPrompt = `Build the "${screen.name}" ${isWebMode ? "web page" : "screen"} for a ${args.userPrompt} ${isWebMode ? "web app" : "app"}.

SCREEN TYPE: ${screenType}
SCREEN PURPOSE: ${screen.purpose}
VISUAL DESCRIPTION: ${screen.visualDescription.slice(0, 300)}

CANVAS: ${canvasWidth} × ${canvasHeight}${isWebMode ? " desktop web — use full-width layouts, sidebar nav, multi-column grids" : " iPhone mobile — use vertical stack, bottom nav, single-column"}

COLORS — replace every placeholder in your output with these EXACT values:
- BG (outer background): ${bgColor}
- PRIMARY: ${primaryColor}
- ACCENT: ${accentColor}
- PRIMARY_HEX_RGB: ${primaryColor.replace("#", "").match(/.{2}/g)?.map((h: string) => parseInt(h, 16)).join(",") || "139,92,246"}
- ACCENT_HEX_RGB: ${accentColor.replace("#", "").match(/.{2}/g)?.map((h: string) => parseInt(h, 16)).join(",") || "167,139,250"}

INSTRUCTIONS:
Follow the ${screenType} template from your system prompt EXACTLY.
- Outer div background must be: ${bgColor}, width:${canvasWidth}, height:${canvasHeight}
- All gradient elements use: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)
- Glow orbs use rgba versions of ${primaryColor} and ${accentColor}
${!isWebMode && screenType === "ONBOARDING" ? `- Giant hero text: 72px font-weight:900 all caps — use a 2-word slogan RELEVANT to "${args.userPrompt}"
- CTA button text must match domain: "Shop Now →" / "Start Stacking →" / "Order Now →" / "Explore →"
- NO bottom nav bar` : ""}
${!isWebMode && screenType === "LOGIN" ? `- Real <input> HTML elements (not divs) for email and password
- Social buttons: Google and Apple side by side
- NO bottom nav bar` : ""}
${!isWebMode && (screenType === "DASHBOARD" || screenType === "STATS") ? `- Inline SVG line chart with gradient fill, stroke color ${primaryColor}
- Bottom nav with 4 items, Home tab active` : ""}
${isWebMode && screenType === "LANDING" ? `- Full-width layout, glassmorphic nav, large hero section (72px headline), 3 feature cards, stats bar
- Use the gradient button style with PRIMARY_COLOR glow shadow
- NO sidebar` : ""}
${isWebMode && screenType === "AUTH" ? `- Two-column layout: left side brand/gradient, right side centered login card
- Real <input> elements for email + password
- Google + GitHub auth buttons side by side` : ""}
${isWebMode && (screenType === "DASHBOARD" || screenType === "ANALYTICS") ? `- Left sidebar (240px wide) with icon nav items
- 4-column KPI card row at top
- Wide area chart SVG (viewBox 900x160)
- Data table with status badges` : ""}
${isWebMode && screenType === "SETTINGS" ? `- Left sidebar (240px wide), settings panels on the right
- Form rows with labels + glassmorphic inputs and toggle switches` : ""}
${isWebMode && screenType === "EXPLORE" ? `- Filter sidebar left (200px), main card grid right (3 columns)
- Search bar at top, filter chips row, pagination dots at bottom` : ""}

Output ONLY the raw HTML div. Start with <div — no markdown, no code fences, no explanation.`;

          const htmlRaw = await callAI(designerSystemPrompt, designerPrompt, 0.7);

          const cleanHtml = htmlRaw
            .replace(/```html/gi, "")
            .replace(/```/g, "")
            .trim();

          console.log(`[DesignAgent] Screen "${screen.name}" HTML length: ${cleanHtml.length}`);

          await ctx.runMutation(api.frames.updateContent, {
            id: frameId as any,
            htmlContent: cleanHtml,
            status: "done",
          });

          completedCount++;

          await ctx.runMutation(api.generationJobs.update, {
            id: jobId,
            completedScreens: completedCount,
          });

        } catch (screenError) {
          console.error(`[DesignAgent] Screen "${screen.name}" failed:`, screenError);
          await ctx.runMutation(api.frames.updateContent, {
            id: frameId as any,
            htmlContent: `<div style="width:${canvasWidth};height:${canvasHeight};background:#0A0A0F;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:14px;padding:32px;text-align:center;">Generation failed for "${screen.name}". Please retry.</div>`,
            status: "error",
          });
        }
      }

      // -----------------------------------------------------------------------
      // Finalize
      // -----------------------------------------------------------------------
      await ctx.runMutation(api.generationJobs.update, {
        id: jobId,
        status: completedCount > 0 ? "done" : "error",
        completedAt: Date.now(),
        error: completedCount === 0 ? "All screens failed" : undefined,
      });

      console.log(`[DesignAgent] Done: ${completedCount}/${analysisObj.screens.length} screens`);

      return {
        success: true,
        jobId: jobId as string,
        screensGenerated: completedCount,
        totalScreens: analysisObj.screens.length,
      };

    } catch (error) {
      console.error("[DesignAgent] Pipeline error:", error);
      await ctx.runMutation(api.generationJobs.update, {
        id: jobId,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        completedAt: Date.now(),
      });
      throw error;
    }
  },
});

// ---------------------------------------------------------------------------
// Regenerate a single frame
// ---------------------------------------------------------------------------
export const regenerateSingleFrame = action({
  args: {
    frameId: v.id("frames"),
    userPrompt: v.string(),
    primaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    bgColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Mark as generating
    await ctx.runMutation(api.frames.setStatus, {
      id: args.frameId,
      status: "generating",
    });

    try {
      // Fetch the frame to get its name + purpose
      const frame = await ctx.runQuery(api.frames.getById, { id: args.frameId });
      if (!frame) throw new Error("Frame not found");

      const primaryColor = args.primaryColor || "#8B5CF6";
      const accentColor = args.accentColor || "#A78BFA";
      const bgColor = args.bgColor || "#0A0A0F";

      // Detect screen type from frame name/purpose
      const nameLower = (frame.name + " " + frame.purpose).toLowerCase();
      let screenType = "DASHBOARD";
      if (nameLower.includes("onboarding") || nameLower.includes("welcome") || nameLower.includes("splash") || nameLower.includes("intro")) screenType = "ONBOARDING";
      else if (nameLower.includes("login") || nameLower.includes("sign in") || nameLower.includes("signin") || nameLower.includes("log in")) screenType = "LOGIN";
      else if (nameLower.includes("stat") || nameLower.includes("analytics") || nameLower.includes("chart")) screenType = "STATS";
      else if (nameLower.includes("profile") || nameLower.includes("account") || nameLower.includes("settings")) screenType = "PROFILE";
      else if (nameLower.includes("explore") || nameLower.includes("search") || nameLower.includes("discover")) screenType = "EXPLORE";

      const designerPrompt = `Build the "${frame.name}" screen for a ${args.userPrompt} app.

SCREEN TYPE: ${screenType}
SCREEN PURPOSE: ${frame.purpose}

COLORS — replace every placeholder in your output with these EXACT values:
- BG (outer background): ${bgColor}
- PRIMARY: ${primaryColor}
- ACCENT: ${accentColor}

INSTRUCTIONS:
Follow the ${screenType} template from your system prompt EXACTLY.
- Outer div background must be: ${bgColor}
- All gradient elements use: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)
${screenType === "ONBOARDING" ? `- Giant hero text: 72px font-weight:900 all caps — use a 2-word slogan RELEVANT to "${args.userPrompt}"
- Brand badge: use the actual app/product name from the prompt
- Hero visual: pick the RIGHT type for the domain (product showcase for ecommerce, credit card for finance, etc.)
- CTA button text must match domain
- NO bottom nav bar` : ""}
${screenType === "LOGIN" ? `- Real <input> HTML elements (not divs) for email and password
- Social buttons: Google and Apple side by side
- NO bottom nav bar` : ""}
${screenType === "DASHBOARD" || screenType === "STATS" ? `- Inline SVG line chart with gradient fill
- Breakdown section with 4 progress bar rows — domain-appropriate categories
- Recent activity list with domain-relevant items
- Bottom nav with 4 items, Home tab active` : ""}

Output ONLY the raw HTML div. Start with <div — no markdown, no code fences, no explanation.`;

      const htmlRaw = await callAI(DESIGNER_SYSTEM, designerPrompt, 0.7);
      const cleanHtml = htmlRaw
        .replace(/```html/gi, "")
        .replace(/```/g, "")
        .trim();

      await ctx.runMutation(api.frames.updateContent, {
        id: args.frameId,
        htmlContent: cleanHtml,
        status: "done",
      });

      return { success: true };
    } catch (error) {
      console.error("[DesignAgent] Regenerate single frame error:", error);
      await ctx.runMutation(api.frames.setStatus, {
        id: args.frameId,
        status: "error",
      });
      throw error;
    }
  },
});

// ---------------------------------------------------------------------------
// Generate from Inspiration Board (wireframes + reference images)
// ---------------------------------------------------------------------------
export const generateFromInspirationBoard = action({
  args: {
    projectId: v.id("projects"),
    designMode: v.union(v.literal("mobile"), v.literal("web")),
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const jobId: Id<"generationJobs"> = await ctx.runMutation(
      api.generationJobs.create,
      {
        projectId: args.projectId,
        designMode: args.designMode
      }
    );

    try {
      console.log("[DesignAgent] Starting Inspiration Board generation...");

      // Fetch wireframes and reference images
      const wireframes = await ctx.runQuery(api.moodBoards.getByType, {
        projectId: args.projectId,
        imageType: "wireframe"
      });
      const references = await ctx.runQuery(api.moodBoards.getByType, {
        projectId: args.projectId,
        imageType: "reference"
      });

      if (wireframes.length === 0) {
        throw new Error("No wireframe sketches found. Please upload wireframes first.");
      }

      console.log(`[DesignAgent] Found ${wireframes.length} wireframes, ${references.length} references`);

      // Step 1: Analyze wireframes with Groq Vision
      console.log("[DesignAgent] Step 1: Analyzing wireframes...");

      const groqKey = (process.env.GROQ_API_KEY || process.env.groq || "").trim();
      if (!groqKey) throw new Error("No Groq API key configured for vision");

      const groq = new Groq({ apiKey: groqKey });

      const layoutAnalysisPrompt = `Analyze these wireframe sketches and extract the layout structure.

Design Mode: ${args.designMode}
${args.userPrompt ? `User Intent: ${args.userPrompt}` : ""}

Identify:
1. Number of screens/sections
2. Layout grid structure
3. UI components (buttons, inputs, cards, navigation)
4. Visual hierarchy and spacing
5. Content sections

Return ONLY a JSON object with this structure:
{
  "screens": [
    {
      "id": "screen_1",
      "name": "Screen Name",
      "type": "ONBOARDING|LOGIN|DASHBOARD|PROFILE|STATS|EXPLORE",
      "purpose": "What this screen does",
      "layout": {
        "header": { "height": "64px", "elements": ["logo", "nav"] },
        "content": { "type": "grid|flex|stack", "sections": [...] },
        "footer": { "elements": [...] }
      },
      "components": [
        { "type": "button|input|card|image|text", "position": "top|center|bottom", "label": "..." }
      ]
    }
  ],
  "themeToUse": {
    "colorPalette": "description of colors from reference images",
    "typographyVibe": "modern/minimal/bold/playful",
    "primary": "#hex",
    "accent": "#hex",
    "bg": "#hex"
  }
}

No markdown, no explanation, just the JSON.`;

      const messageContent: any[] = [
        { type: "text", text: layoutAnalysisPrompt }
      ];

      // Convert wireframe images to base64 for Groq Vision
      for (const wf of wireframes) {
        const response = await fetch(wf.url!);
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let b = 0; b < bytes.byteLength; b++) {
          binary += String.fromCharCode(bytes[b]);
        }
        const base64 = btoa(binary);
        const contentType = response.headers.get("content-type") || "image/png";

        messageContent.push({
          type: "image_url",
          image_url: { url: `data:${contentType};base64,${base64}` }
        });
      }

      const layoutResult = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "user", content: messageContent }
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });

      const layoutRaw = layoutResult.choices[0]?.message?.content || "";
      const layoutJson = extractJSON(layoutRaw);
      const layoutData = JSON.parse(layoutJson);

      console.log(`[DesignAgent] Layout analysis complete: ${layoutData.screens?.length || 0} screens detected`);

      await ctx.runMutation(api.generationJobs.update, {
        id: jobId,
        analysis: JSON.stringify(layoutData),
        theme: JSON.stringify(layoutData.themeToUse),
        totalScreens: layoutData.screens?.length || 3,
        status: "designing",
      });

      // Step 2: Create frames
      const frameIds: string[] = [];
      for (let i = 0; i < (layoutData.screens?.length || 3); i++) {
        const screen = layoutData.screens?.[i] || {
          id: `screen_${i + 1}`,
          name: `Screen ${i + 1}`,
          purpose: "Generated from wireframe",
          type: "DASHBOARD"
        };
        const fid = await ctx.runMutation(api.frames.create, {
          projectId: args.projectId,
          screenId: screen.id,
          name: screen.name,
          purpose: screen.purpose,
          order: i,
        });
        frameIds.push(fid);
      }

      // Step 3: Generate designs for each screen
      let completedCount = 0;
      const theme = layoutData.themeToUse || {};
      const primaryColor = theme.primary || "#8B5CF6";
      const accentColor = theme.accent || "#A78BFA";
      const bgColor = theme.bg || "#0A0A0F";

      for (let i = 0; i < (layoutData.screens?.length || 3); i++) {
        const screen = layoutData.screens?.[i] || {
          id: `screen_${i + 1}`,
          name: `Screen ${i + 1}`,
          type: "DASHBOARD",
          purpose: "Main screen",
          layout: {},
          components: []
        };
        const frameId = frameIds[i];

        console.log(`[DesignAgent] Designing screen ${i + 1}: "${screen.name}"`);

        await ctx.runMutation(api.frames.setStatus, {
          id: frameId as any,
          status: "generating",
        });

        try {
          // Build the designer prompt based on wireframe analysis
          const designerPrompt = `Build the "${screen.name}" screen for a ${args.userPrompt || "web app"}.

DESIGN MODE: ${args.designMode}
SCREEN TYPE: ${screen.type}
SCREEN PURPOSE: ${screen.purpose}

LAYOUT ANALYSIS FROM WIREFRAME:
${JSON.stringify(screen.layout, null, 2)}

COMPONENTS TO INCLUDE:
${JSON.stringify(screen.components, null, 2)}

COLORS:
- BG: ${bgColor}
- PRIMARY: ${primaryColor}
- ACCENT: ${accentColor}

${args.designMode === "mobile" ? `
Dimensions: 390×844px (iPhone)
Rules:
- Use mobile-specific patterns (bottom nav, large touch targets)
- Status bar with time and icons
- Rounded corners on cards
- Vertical scrolling content
` : `
Dimensions: 1440×900px (Desktop Web)
Rules:
- Use web-specific patterns (top nav, sidebars, grid layouts)
- Browser chrome frame
- Horizontal spacing with max-width containers
- Multi-column layouts where appropriate
`}

${references.length > 0 ? `
REFERENCE IMAGES PROVIDED:
Use the visual style, colors, and aesthetic from the reference images.
Match the design language, typography, and component styling.
` : ""}

Generate a complete, high-fidelity HTML design. Start with <div — no markdown, no explanation.`;

          // Use appropriate system prompt based on design mode
          const systemPrompt = args.designMode === "mobile"
            ? DESIGNER_SYSTEM
            : WEB_DESIGNER_SYSTEM;

          const htmlRaw = await callAI(systemPrompt, designerPrompt, 0.7);

          const cleanHtml = htmlRaw
            .replace(/```html/gi, "")
            .replace(/```/g, "")
            .trim();

          await ctx.runMutation(api.frames.updateContent, {
            id: frameId as any,
            htmlContent: cleanHtml,
            status: "done",
          });

          completedCount++;

          await ctx.runMutation(api.generationJobs.update, {
            id: jobId,
            completedScreens: completedCount,
          });

        } catch (screenError) {
          console.error(`[DesignAgent] Screen "${screen.name}" failed:`, screenError);
          await ctx.runMutation(api.frames.updateContent, {
            id: frameId as any,
            htmlContent: `<div style="width:${args.designMode === "mobile" ? "390px" : "1440px"};height:${args.designMode === "mobile" ? "844px" : "900px"};background:#0A0A0F;display:flex;align-items:center;justify-content:center;color:#ef4444;padding:32px;text-align:center;">Generation failed for "${screen.name}". Please retry.</div>`,
            status: "error",
          });
        }
      }

      // Finalize
      await ctx.runMutation(api.generationJobs.update, {
        id: jobId,
        status: completedCount > 0 ? "done" : "error",
        completedAt: Date.now(),
        error: completedCount === 0 ? "All screens failed" : undefined,
      });

      console.log(`[DesignAgent] Inspiration Board generation complete: ${completedCount}/${layoutData.screens?.length || 3} screens`);

      return {
        success: true,
        jobId: jobId as string,
        screensGenerated: completedCount,
        totalScreens: layoutData.screens?.length || 3,
      };

    } catch (error) {
      console.error("[DesignAgent] Inspiration Board generation error:", error);
      await ctx.runMutation(api.generationJobs.update, {
        id: jobId,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        completedAt: Date.now(),
      });
      throw error;
    }
  },
});

export const listModels = action({
  args: {},
  handler: async (ctx) => {
    const cerebrasKey = (process.env.CEREBRAS_API_KEY || process.env.CEREBRAS || "").trim();
    if (!cerebrasKey) return ["NO_CEREBRAS_KEY"];
    const res = await fetch("https://api.cerebras.ai/v1/models", {
      headers: { "Authorization": `Bearer ${cerebrasKey}` }
    });
    if (!res.ok) return [`Error: ${res.status} ${await res.text()}`];
    const data = await res.json() as any;
    return data.data.map((m: any) => m.id);
  }
});

// ---------------------------------------------------------------------------
// Chat-based frame editing
// ---------------------------------------------------------------------------
export const chatEditFrame = action({
  args: {
    projectId: v.id("projects"),
    frameId: v.id("frames"),
    userMessage: v.string(),
    conversationHistory: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`[DesignAgent] Chat editing frame ${args.frameId}: "${args.userMessage}"`);

      // Fetch the current frame
      const frame = await ctx.runQuery(api.frames.getById, { id: args.frameId });
      if (!frame) throw new Error("Frame not found");

      // Save user message to chat history
      await ctx.runMutation(api.chatMessages.send, {
        projectId: args.projectId,
        role: "user",
        content: args.userMessage,
        frameId: args.frameId,
      });

      // Mark frame as generating
      await ctx.runMutation(api.frames.setStatus, {
        id: args.frameId,
        status: "generating",
      });

      // Prepare the edit prompt
      const editSystemPrompt = `You are a UI/UX Designer specializing in iterative design improvements.

Your task: Modify the provided HTML design based on the user's instruction.

RULES:
1. Keep the same overall structure and dimensions
2. Apply ONLY the requested changes
3. Maintain visual consistency
4. Keep all existing content unless explicitly told to remove it
5. Use the same color scheme and styling approach
6. Output ONLY the modified HTML, no explanation

The user is giving you incremental feedback. Make targeted changes while preserving what works.`;

      const editUserPrompt = `CURRENT DESIGN (HTML):
${frame.htmlContent}

USER REQUEST: "${args.userMessage}"

${args.conversationHistory.length > 0 ? `
CONVERSATION HISTORY:
${args.conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n")}
` : ""}

Modify the design according to the user's request. Output only the modified HTML div. Start with <div — no markdown, no explanation.`;

      // Call AI to edit
      const htmlRaw = await callAI(editSystemPrompt, editUserPrompt, 0.7);

      const cleanHtml = htmlRaw
        .replace(/```html/gi, "")
        .replace(/```/g, "")
        .trim();

      // Update frame with new content
      await ctx.runMutation(api.frames.updateContent, {
        id: args.frameId,
        htmlContent: cleanHtml,
        status: "done",
      });

      // Generate assistant response
      const assistantSystemPrompt = `You are a helpful UI/UX design assistant. Acknowledge the user's change request and briefly describe what you modified.

Keep responses concise (1-2 sentences) and friendly. Focus on confirming the changes made.`;

      const assistantPrompt = `User requested: "${args.userMessage}"

You have just modified an HTML design. Write a brief acknowledgment (1-2 sentences) confirming what you changed.`;

      const assistantResponse = await callAI(assistantSystemPrompt, assistantPrompt, 0.7);

      // Save assistant response
      await ctx.runMutation(api.chatMessages.send, {
        projectId: args.projectId,
        role: "assistant",
        content: assistantResponse.trim(),
        frameId: args.frameId,
      });

      console.log(`[DesignAgent] Frame ${args.frameId} edited successfully`);

      return {
        success: true,
        assistantResponse: assistantResponse.trim(),
      };

    } catch (error) {
      console.error("[DesignAgent] Chat edit error:", error);

      // Reset frame status
      await ctx.runMutation(api.frames.setStatus, {
        id: args.frameId,
        status: "error",
      });

      // Save error message
      await ctx.runMutation(api.chatMessages.send, {
        projectId: args.projectId,
        role: "assistant",
        content: `Sorry, I couldn't make that change. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        frameId: args.frameId,
      });

      throw error;
    }
  },
});
