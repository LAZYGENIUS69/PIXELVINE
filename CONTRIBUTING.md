# Contributing to PIXELVINE

Thank you for your interest in contributing to PIXELVINE! This guide will help you get started.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/pixelvine.git
   cd pixelvine
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Fill in your API keys
   ```
5. **Start the dev server**:
   ```bash
   npx convex dev    # Terminal 1 — Convex backend
   npm run dev        # Terminal 2 — Next.js frontend
   ```

## 📝 Development Workflow

### Branch Naming
- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation updates
- `refactor/description` — Code refactoring

### Commit Messages
We follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add moodboard image upload
fix: resolve canvas flicker on drag
docs: update API documentation
refactor: extract AI client into separate module
```

### Pull Requests
1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure the app builds without errors: `npm run build`
4. Run the linter: `npm run lint`
5. Open a PR with a clear description of changes

## 🏗 Project Structure

```
├── app/          → Next.js App Router (pages + API routes)
├── components/   → Shared React components
├── convex/       → Convex backend (schema, mutations, actions)
├── hooks/        → Custom React hooks
├── store/        → Redux Toolkit (slices + middleware)
├── src/features/ → Feature-based modules (editor, dashboard, auth)
├── lib/          → Utility functions
└── theme/        → Theme configuration
```

## 🎯 Areas for Contribution

- **AI Pipeline**: Improve prompt engineering or add new LLM providers
- **Canvas Engine**: Performance optimizations or new shape types
- **UI/UX**: Component improvements or new features
- **Documentation**: README updates, code comments, guides
- **Testing**: Unit tests, integration tests, E2E tests
- **Accessibility**: WCAG compliance improvements

## ⚠️ Important Guidelines

- **Do NOT commit** `.env.local` or any API keys
- **Do NOT** break existing functionality
- **Keep PRs focused** — one feature/fix per PR
- **Test locally** before submitting
- **Follow existing code patterns** and naming conventions

## 📋 Code Style

- TypeScript strict mode enabled
- Functional components with hooks
- Redux Toolkit for state management
- Convex for backend operations
- Tailwind CSS for styling

## 🐛 Reporting Issues

When reporting bugs, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and OS information
5. Console errors (if any)

## 💬 Questions?

Open a [Discussion](https://github.com/your-username/pixelvine/discussions) for questions or ideas.

---

Thank you for helping make PIXELVINE better! 🎨
