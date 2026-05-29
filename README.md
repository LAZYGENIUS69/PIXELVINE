<p align="center">
  <img src="https://img.shields.io/badge/PIXELVINE-Deep%20Design%20Engineering%20Agent-8B5CF6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTEyIDMtMS45MTIgNS44MTNhMiAyIDAgMCAxLTEuMjc1IDEuMjc1TDMgMTJsNS44MTMgMS45MTJhMiAyIDAgMCAxIDEuMjc1IDEuMjc1TDEyIDIxbDEuOTEyLTUuODEzYTIgMiAwIDAgMSAxLjI3NS0xLjI3NUwyMSAxMmwtNS44MTMtMS45MTJhMiAyIDAgMCAxLTEuMjc1LTEuMjc1TDEyIDN6Ii8+PC9zdmc+" alt="PixelVine" />
</p>

<h1 align="center">PIXELVINE</h1>

<p align="center">
  <strong>AI-powered design engineering agent that generates, critiques, and self-corrects production-grade UI systems.</strong>
</p>

<p align="center">
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Convex-1.31-FF6B35" alt="Convex" />
  <img src="https://img.shields.io/badge/Tailwind-4.x-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 🎯 Why This Project

Design-to-code tools exist. But most stop at "draw a box, get a div."

**PIXELVINE** takes a fundamentally different approach — it implements a **multi-agent AI pipeline** where an Architect plans the screen system, a Designer renders each screen to pixel-perfect fidelity, and a Critic audits the output against WCAG and UX heuristics. The entire loop runs on a custom **infinity canvas engine** with real-time Convex persistence.

> **From a single text prompt to 3 production-ready screens in under 30 seconds.**

---

## 📸 Screenshots

<!-- Replace these with actual screenshots when available -->
> Screenshots coming soon. Run the project locally to see it in action!

```
npm install && npm run dev
```

<!-- Uncomment when you have screenshots:
<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" width="45%" />
  <img src="docs/screenshots/canvas.png" alt="Canvas Editor" width="45%" />
</p>
<p align="center">
  <img src="docs/screenshots/design-agent.png" alt="AI Design Agent" width="45%" />
  <img src="docs/screenshots/screens.png" alt="Generated Screens" width="45%" />
</p>
-->

---

## 🌐 Live Demo

> Deployment coming soon. Star the repo to get notified!
<!-- Replace with your Vercel URL when deployed -->
<!-- **[→ Try PIXELVINE Live](https://pixelvine.vercel.app)** -->

---

## ✨ Key Features

| Feature | Description |
|:---|:---|
| **Dual-Mode Design Agent** | Architect → Designer pipeline generates mobile (390×844) or desktop web (1440×900) screens |
| **3-Tier LLM Fallback** | Groq → Cerebras → Gemini automatic failover with rate-limit detection |
| **Infinity Canvas** | Custom 2D canvas engine with pan, zoom, shapes, rotation, resize, frames, and multi-layer rendering |
| **Inspiration Board** | Groq Vision (LLaMA 4 Scout) analyzes wireframe sketches to generate matching designs |
| **Iterative Chat Editing** | Chat with the AI to refine individual frames — no regeneration needed |
| **AI Style Guide** | Gemini 2.5 Flash extracts 18-color palettes + 6-level typography from moodboard images |
| **UX Critique Agent** | Automated WCAG accessibility and cognitive load auditing |
| **Real-time Sync** | Redux → Convex middleware with debounced optimistic persistence |
| **Multi-format Export** | PNG screenshots via `html-to-image` and raw HTML code downloads |
| **Keyboard Shortcuts** | Full shortcut system for all tools, undo/redo, and generation |

---

## 🏗 Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                      │
│            (App Router, React 19, TypeScript)             │
├───────────┬──────────────┬──────────────┬────────────────┤
│ Dashboard │ Canvas Editor│ Design Canvas│  Style Guide   │
│ (Projects)│ (Wireframes) │ (AI Screens) │  (Moodboard)   │
├───────────┴──────┬───────┴──────┬───────┴────────────────┤
│  Redux Toolkit   │   Convex     │   Custom Hooks         │
│  + syncMiddleware│   React SDK  │   (Canvas, Agent, etc) │
├──────────────────┴──────────────┴────────────────────────┤
│                   CONVEX BACKEND                          │
│         (Real-time DB, Serverless Actions)                │
├────────────┬───────────────┬─────────────────────────────┤
│ designAgent│    ai.ts      │     inspiration.ts          │
│ (Groq +    │ (Gemini 2.5   │  (Multi-style variations)  │
│  Cerebras) │  Flash)       │                             │
├────────────┴───────────────┴─────────────────────────────┤
│                 EXTERNAL AI PROVIDERS                     │
│   Groq (LLaMA 3.3 70B) │ Cerebras (GPT-OSS 120B)       │
│   Google Gemini 2.5     │ Replicate (Flux.1 Pro)        │
└─────────────────────────────────────────────────────────┘
```

### AI Pipeline

The design agent implements a **dual-step Architect → Designer** pattern:

1. **Architect** — Receives user prompt, outputs a structured JSON plan with screen types, purposes, and domain-specific colors
2. **Designer** — Iterates through each screen, generating pixel-perfect HTML + inline CSS with glassmorphism, 3D transforms, and SVG charts
3. **Fallback** — Automatic 3-tier failover: Groq → Cerebras → Gemini with rate-limit detection

### Canvas Engine

The infinity canvas (`hooks/use-infinity-canvas.ts`, ~1400 lines) is a custom-built 2D rendering engine:

- **Dual-layer rendering** — Static layer (shapes) + Active layer (selection, drag preview)
- **DOMMatrix transforms** — Pan/zoom with LERP interpolation at 60fps
- **8 shape types** — Rect, Circle, Frame, Text, Image, Arrow, Line, Path
- **Frame grouping** — Child shapes auto-parent; moving a frame moves all children
- **Flicker-free dragging** — Separate drag offset refs prevent static/active layer desync

### State Management

```
Redux dispatch → syncMiddleware →
  if (isDragging) → skip (throttled)
  else → debounce 200ms → Convex mutation
```

Three Redux slices (Canvas, StyleGuide, Generation) with a custom middleware that bridges local state to Convex's real-time database.

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|:---|:---|
| Next.js 16 (App Router) | Framework, SSR, API routes |
| React 19 | UI with Server Components |
| TypeScript 5 | End-to-end type safety |
| Tailwind CSS 4 | Utility-first styling |
| Redux Toolkit | Normalized state with Entity Adapter |
| Framer Motion | Animations and transitions |
| Radix UI | Accessible component primitives |
| @dnd-kit | Drag-and-drop project reordering |

### Backend
| Technology | Purpose |
|:---|:---|
| Convex | Real-time database + serverless actions |
| @convex-dev/auth | Google OAuth authentication |

### AI Providers
| Provider | Model | Use Case |
|:---|:---|:---|
| Groq | LLaMA 3.3 70B | Primary design generation |
| Groq Vision | LLaMA 4 Scout 17B | Wireframe image analysis |
| Cerebras | GPT-OSS 120B | High-capacity fallback |
| Google Gemini | 2.5 Flash | Style guide, critique, HiFi code gen |
| Replicate | Flux.1 Pro | Prompt → rendered image |

---

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout + providers + SEO
│   ├── page.tsx                  # Dashboard redirect
│   ├── Auth/                     # Sign-in / Sign-up
│   ├── dashboard/                # Project management
│   ├── project/[projectId]/      # Editor (Canvas + Screens + Style Guide)
│   └── api/                      # API routes (design-agent, generate, etc.)
│
├── components/                   # Shared components
│   ├── AIPreview.tsx             # Sandboxed iframe renderer
│   ├── DesignCanvas.tsx          # Multi-frame design viewer
│   ├── navbar.tsx                # Glassmorphic floating navbar
│   └── ui/                       # shadcn/ui primitives
│
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema (8 tables)
│   ├── designAgent.ts            # AI orchestrator (1200 lines)
│   ├── ai.ts                     # Gemini-based actions
│   └── ...                       # Projects, frames, chat, inspiration
│
├── hooks/                        # Custom hooks
│   ├── use-infinity-canvas.ts    # Canvas engine (1438 lines)
│   ├── useDesignAgent.ts         # Agent orchestration
│   └── ...                       # Keyboard, paste, debounce, auth
│
├── store/                        # Redux Toolkit
│   ├── slices/                   # canvas, styleGuide, generation
│   └── middleware/               # Convex sync middleware
│
└── src/features/                 # Feature modules
    ├── editor/                   # Editor components + style guide
    ├── dashboard/                # Dashboard + sortable cards
    └── auth/                     # Auth components
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (or pnpm)
- A [Convex](https://convex.dev) account (free tier)
- At least one AI API key (Groq is free and recommended)

### Quick Start

```bash
# 1. Clone
git clone https://github.com/your-username/pixelvine.git
cd pixelvine

# 2. Install
npm install

# 3. Configure
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Start Convex backend
npx convex dev

# 5. Start frontend (new terminal)
npm run dev
```

The app runs in **mock auth mode** by default — no OAuth setup required for development.

Open [http://localhost:3000](http://localhost:3000) to see it running.

### Environment Variables

See [`.env.example`](.env.example) for the full list. At minimum you need:

| Variable | Required | Description |
|:---|:---:|:---|
| `CONVEX_DEPLOYMENT` | ✅ | Your Convex deployment name |
| `NEXT_PUBLIC_CONVEX_URL` | ✅ | Convex cloud URL |
| `GROQ_API_KEY` | ✅* | Primary AI provider |
| `GOOGLE_API_KEY` | ⬜ | Style guide + critique features |
| `CEREBRAS_API_KEY` | ⬜ | Fallback AI provider |
| `REPLICATE_API_TOKEN` | ⬜ | Image generation |

*At least one AI provider key is required.

---

## 📜 Available Scripts

| Command | Description |
|:---|:---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx convex dev` | Start Convex dev backend |
| `npx convex deploy` | Deploy Convex to production |

---

## 🗄 Database Schema

8 Convex tables power the backend:

| Table | Purpose |
|:---|:---|
| `users` | Profiles, credits, subscription status |
| `projects` | Canvas data, viewport state, AI analysis |
| `frames` | Generated screen HTML + metadata |
| `generationJobs` | AI pipeline job tracking |
| `chatMessages` | Iterative design chat history |
| `moodBoards` | Uploaded reference/wireframe images |
| `inspirationVariations` | Multi-style design variations |
| `subscriptions` | Billing integration |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork → Clone → Branch → Code → PR
git checkout -b feat/your-feature
git commit -m "feat: your feature description"
git push origin feat/your-feature
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with ♥ by <strong>PIXELVINE Labs</strong></sub>
</p>
