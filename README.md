# TypeScript Fullstack Architecture Slides

Marp presentation slides for fullstack TypeScript architecture.

## Series Structure

```
Tシリーズ（基礎）→ Pシリーズ（実践）→ F/Bシリーズ（フレームワーク）
```

- **Tシリーズ**: TypeScript基礎（6回）
- **Pシリーズ**: 実践パターン（7回）- Array, Object, Union, Generics, Guard, Advanced, .d.ts
- **Fシリーズ**: Frontend（Next.js, React, TanStack, Clerk）
- **Bシリーズ**: Backend（Hono, Drizzle, D1, Zod）

## Folder Structure

- slides/
  - typescript/
    - t1-why-typescript.md
    - t2-dev-environment.md
    - t3-type-basics.md
    - t4-union-types.md
    - t5-generics.md
    - t6-practical-typescript.md
  - practice/
    - p1-array-patterns.md
    - p2-object-patterns.md
    - p3-union-patterns.md
    - p4-generics-patterns.md
    - p5-guard-patterns.md
    - p6-advanced-patterns.md
    - p7-dts-and-summary.md
  - frontend/
    - f1-foundation.md
    - f2-design-philosophy.md
    - f3-typescript.md
    - f4-styling.md
    - f5-data-fetching.md
    - f6-authentication.md
  - backend/
    - b1-foundation.md
    - b2-type-system.md
    - b3-validation.md
    - b4-database.md
    - b5-authentication.md
    - b6-integration.md
  - shared/
    - toc.md
  - assets/
    - images/
    - diagrams/

## Commands

### Build All Slides

```bash
npm run build
```

### Build Frontend Only

```bash
npm run build:frontend
```

### Build Backend Only

```bash
npm run build:backend
```

### Export All as PDF

```bash
npm run build:pdf
```

### Preview Mode (Watch)

```bash
npm run preview
```

Open http://localhost:8080 to view slides.

### Clean Build Files

```bash
npm run clean
```
