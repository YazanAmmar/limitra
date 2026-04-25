## Contributing

Limitra is a behavior-critical extension designed for strict enforcement.
We highly welcome contributions, provided they deeply respect the established architecture, the anti-bypass guarantees, and the core project philosophy.

### Before You Start

- For **new features**, please open an issue first.
- This avoids wasted work on ideas that may not align with the project direction.

## Core Principles

### 1. Respect the Architecture

The project is intentionally structured:

- `core/` - pure logic (no Chrome APIs)
- `ui/` - rendering only
- `storage/` - persistence & security
- `platforms/` - site-specific logic

**Do not mix responsibilities across layers.**

### 2. Enforcement is Non-Negotiable

Limitra exists to enforce limits - not suggest them.

Your contribution must NOT:

- weaken blocking behavior
- introduce bypass paths
- delay enforcement logic

Sensitive areas (Core Enforcement):

- **Orchestration Logic**: The modules linking tracking events to blocking actions.
- **Security & Anti-Bypass**: Any logic defending against tampering or storage resets.
- **Overlay Persistence**: Mechanisms ensuring the block screen cannot be removed via DOM manipulation.

Changes to these systems require rigorous testing and extra care during review.

### 3. UX Consistency

The UI is part of the product identity.

- Do NOT introduce arbitrary design changes
- Do NOT change colors, layout, or interaction patterns

Allowed:

- using existing variables from `styles.css`
- following existing UI patterns

If you believe a UX change is valuable - open an issue first.

### 4. Refactoring Rules

Refactors are welcome **only if they improve the codebase without changing behavior**.

Good refactors:

- splitting large files
- improving readability
- removing duplication

Bad refactors:

- mixing concerns
- silent logic changes
- unnecessary rewrites

### 5. Tests Are Required

All PRs must include tests when applicable.

Requirements:

- existing tests must pass
- new logic must be covered

Run:

```bash
npm test
```

### 6. Code Quality Checks

Before submitting a PR, you must pass:

```bash
npm run check
npm run format
```

This includes:

- linting
- formatting
- type checking

PRs that fail checks will not be reviewed.

## Pull Request Guidelines

- Keep PRs focused and minimal
- Use clear commit messages
- Avoid unrelated changes
- Link related issues when applicable

## What We Encourage

- meaningful features (with prior discussion)
- performance improvements
- stability improvements
- better anti-bypass mechanisms
- clean, maintainable code

## What We Avoid

- cosmetic-only changes
- unnecessary dependencies
- breaking core behavior
- UX redesigns without approval

## Final Note

Limitra is built to solve a real problem:
**ending endless scrolling through strict enforcement.**

Every contribution should move the project closer to that goal - not away from it.
