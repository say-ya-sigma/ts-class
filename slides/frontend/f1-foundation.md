---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# F-1: Foundation

## Next.js App Router / Project Structure

---

# 1. この授業で作るもの

## 完成イメージ

**フルスタックTODOアプリケーション**

- Frontend: Next.js + TypeScript
- Backend: Hono on Cloudflare Workers
- Database: D1 (SQLite)
- Auth: Clerk
- Styling: Tailwind CSS

---

## 機能要件

- ✅ ユーザー認証（Clerk統合）
- ✅ TODOのCRUD操作
- ✅ リアルタイム更新
- ✅ レスポンシブUI
- ✅ エッジデプロイメント

---

# 2. TypeScriptの立ち位置

## JavaScriptに型をつけるとは

**TypeScript = JavaScript + 型システム**

```typescript
// JavaScript（ランタイムエラーの可能性）
function add(a, b) {
  return a + b;
}
add("1", "2"); // "12" 😱

// TypeScript（コンパイル時に検出）
function add(a: number, b: number): number {
  return a + b;
}
add("1", "2"); // ❌ コンパイルエラー！
```

---

## コンパイル時 vs ランタイム

| 段階 | 検出されるエラー | TypeScriptの役割 |
|------|-----------------|-----------------|
| **コンパイル時** | 型エラー、構文エラー | ✅ 検出・防止 |
| **ランタイム** | APIエラー、論理エラー | ❌ 検出不可 |

```typescript
// コンパイルは通るがランタイムで失敗する例
const user = await fetchUser(); // APIが404を返す可能性
console.log(user.name); // ランタイムエラー！
```

**型は開発時の安全性を高める**

---

# 3. なぜNext.js App Routerか

## Pages Router vs App Router

| 機能 | Pages Router | App Router |
|------|--------------|------------|
| **レンダリング** | CSR / SSR / SSG | RSC + Streaming |
| **データ取得** | `getStaticProps`等 | Server Components |
| **レイアウト** | `_app.tsx`のみ | 複数レベル対応 |
| **ローディング** | 手動実装 | `loading.tsx` |
| **エラー処理** | 手動実装 | `error.tsx` |

---

## サーバーとクライアントの境界

**App Routerの核心：Server Componentsをデフォルトに**

```
┌─────────────────────────────────────┐
│  Server Component (デフォルト)       │
│  - データベース直接アクセス可能       │
│  - バンドルサイズ0                   │
├─────────────────────────────────────┤
│  Client Component ('use client')    │
│  - useState, useEffect              │
│  - ブラウザAPI                       │
└─────────────────────────────────────┘
```

**自動的に最適な境界を選択**

---

# 4. App Routerのファイル規約

## 特殊ファイル

```
app/
├── page.tsx          # ルートのUI
├── layout.tsx        # 共有レイアウト
├── loading.tsx       # ローディングUI
├── error.tsx         # エラーUI
├── not-found.tsx     # 404ページ
├── route.tsx         # APIルート
└── template.tsx      # 再マウント用レイアウト
```

---

## page.tsx と layout.tsx

```typescript
// app/page.tsx
export default function HomePage() {
  return <h1>Hello, App Router!</h1>;
}

// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <header>My App</header>
        {children}
        <footer>© 2024</footer>
      </body>
    </html>
  );
}
```

---

## loading.tsx と error.tsx

```typescript
// app/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}

// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**ファイルを置くだけで自動的に機能する**

---

# 5. Server Component と Client Component

## デフォルトがServerである意味

**従来の問題点：**
- 全てのコンポーネントがクライアントに送信される
- 大量のJavaScriptバンドル
- 不要なハイドレーション

**App Routerの解決策：**
```typescript
// Server Component（デフォルト）
// → サーバーでのみ実行、JSを送信しない
async function ServerComponent() {
  const data = await fetchData(); // 直接DBアクセス可能
  return <div>{data}</div>;
}
```

---

## 'use client' の意味

```typescript
// Client Componentに明示的に宣言
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

**必要な時だけ'use client'を使う**
- インタラクティブ機能が必要な時
- useState, useEffectを使う時
- ブラウザAPIを使う時

---

# 6. ルーティングの仕組み

## フォルダ = ルート

```
app/
├── page.tsx              # /
├── about/
│   └── page.tsx          # /about
├── blog/
│   └── page.tsx          # /blog
└── contact/
    └── page.tsx          # /contact
```

**ファイルシステムベースの直感的なルーティング**

---

## 動的ルート [id]

```typescript
// app/blog/[id]/page.tsx
interface Props {
  params: Promise<{ id: string }>;
}

export default async function BlogPost({ params }: Props) {
  const { id } = await params;
  const post = await fetchPost(id);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

**URLパラメータを型安全に取得**

---

## ルートグループ (group)

```
app/
├── (marketing)/          # URLに含まれないグループ
│   ├── page.tsx          # /
│   ├── about/
│   │   └── page.tsx      # /about
│   └── layout.tsx        # マーケティング用レイアウト
└── (shop)/
    ├── products/
    │   └── page.tsx      # /products
    └── layout.tsx        # ショップ用レイアウト
```

**共通レイアウトをグループ化して適用**

---

# 7. プロジェクト作成ハンズオン

## create-next-app

```bash
# 新規プロジェクト作成
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir=false

# 対話式で選択
npx create-next-app@latest my-app
```

**推奨オプション：**
- ✓ TypeScript
- ✓ ESLint
- ✓ Tailwind CSS
- ✓ `src/` directory: No
- ✓ App Router
- ✓ Turbopack

---

## 動作確認

```bash
cd my-app
npm run dev
```

**確認ポイント：**
1. http://localhost:3000 が開くか
2. `app/page.tsx` を編集してホットリロードされるか
3. `app/layout.tsx` の構造を確認

---

## Vercelデプロイ

```bash
# Vercel CLIでデプロイ
npm i -g vercel
vercel

# またはGit連携
# GitHubにpush → VercelでImport
```

**手順：**
1. GitHubリポジトリ作成
2. `git push`
3. Vercel DashboardでImport
4. 自動デプロイ完了！

---

# 8. まとめ

## 今日学んだこと

✅ **TypeScript**: コンパイル時の型安全性
✅ **App Router**: Server Componentsをデフォルトに
✅ **ファイル規約**: page.tsx, layout.tsx, loading.tsx, error.tsx
✅ **ルーティング**: フォルダ構造 = URL構造
✅ **プロジェクト作成**: create-next-app → Vercelデプロイ

---

## 次回予告

# F-2: Design Philosophy

**コンポーネント設計 / アトミックデザイン批判**

- アトミックデザインの落とし穴
- 実践的なコンポーネント分割
- Compound Componentsパターン

**課題：** 作成したプロジェクトに簡単なページを追加してみよう
