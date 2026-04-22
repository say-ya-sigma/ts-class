---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# B-6: Integration
## Hono RPC × フルスタック統合 — 型をフロントエンドと共有する

---

## この授業のゴール（講義全体の集大成）

**HonoのRPC機能でエンドツーエンドの型安全性を実現し、全体をデプロイできる**

- 型安全なAPIクライアントの実現
- Hono RPCによるエンドツーエンド型安全性
- モノレポでの型共有
- フルスタックデプロイフロー
- 講義全体のまとめ

---

## 「型安全なAPI」の問題

### バックエンドで型を定義しても、フロントエンドには伝わらない

```typescript
// backend/src/index.ts
const app = new Hono();

app.get('/api/users', (c) => {
  return c.json({
    id: 1,
    name: 'Alice',
    email: 'alice@example.com'
  });
});
```

```typescript
// frontend/src/api.ts
// ❌ フロントエンドでは型が分からない
const response = await fetch('/api/users');
const user = await response.json();

user.namee; // タイプミス！でもコンパイルエラーにならない
user.emial; // またタイプミス！
```

### OpenAPI / tRPCなどの解決策の歴史

| 解決策 | 方法 | メリット | デメリット |
|--------|------|----------|------------|
| **手動定義** | 両方で型を書く | シンプル | 重複、同期が大変 |
| **OpenAPI** | JSONスキーマ生成 | 言語非依存 | コード生成が必要 |
| **tRPC** | TypeScript型共有 | 型安全 | サーバー/クライアント両方tRPC必須 |
| **GraphQL** | スキーマ定義 | 柔軟 | 学習コスト高い |
| **Hono RPC** | TypeScript型そのまま | シンプル・軽量 | 両方TS必須 |

---

## HonoのRPCとは

### AppTypeをexportするだけでフロントに型が伝わる

```typescript
// backend/src/index.ts
import { Hono } from 'hono';

const app = new Hono()
  .get('/users', (c) => {
    return c.json({ users: [] });
  })
  .post('/users', (c) => {
    return c.json({ id: 1 }, 201);
  });

// この型をexportするだけ！
export type AppType = typeof app;
```

```typescript
// frontend/src/api.ts
import { hc } from 'hono/client';
import type { AppType } from '../../backend/src/index';

const client = hc<AppType>('http://localhost:8787');

// ✅ 型が完全に補完される！
const response = await client.users.$get();
const data = await response.json();
// data.users が型推論される
```

### コード生成なし / スキーマファイルなし

```
従来の方法（OpenAPI）
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  バックエンド  │────►│  openapi.json │────►│ コード生成    │
│  （型定義）    │     │  （スキーマ）  │     │  （クライアント）│
└──────────────┘     └──────────────┘     └──────────────┘

Hono RPC
┌──────────────┐
│  バックエンド  │───── 型を直接export ─────► フロントエンドでimport
│  （AppType）   │                           （型共有）
└──────────────┘
```

---

## AppTypeのexport

### const routes = app.get(...).post(...) の型を取る

```typescript
// backend/src/routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

// ルートを定義して型を取得
const routes = new Hono()
  .get('/users', async (c) => {
    const users = await db.select().from(users);
    return c.json({ users });
  })
  .get('/users/:id', async (c) => {
    const id = c.req.param('id');
    const user = await getUserById(id);
    if (!user) return c.json({ error: 'Not found' }, 404);
    return c.json({ user });
  })
  .post('/users', 
    zValidator('json', userSchema.omit({ id: true })),
    async (c) => {
      const data = c.req.valid('json');
      const user = await createUser(data);
      return c.json({ user }, 201);
    }
  );

// この型をexport！
export type AppRoutes = typeof routes;
export default routes;
```

---

## export type AppType = typeof routes

```typescript
// backend/src/index.ts
import { Hono } from 'hono';
import routes from './routes';
import { cors } from 'hono/cors';

// アプリを構築
const app = new Hono();

// ミドルウェア
app.use('*', cors());

// ルートをマウント
app.route('/api', routes);

// ✅ この型をexportする
export type AppType = typeof app;

export default app;
```

```typescript
// backend/src/index.ts（別パターン）
// 複数のルートを統合する場合
import { Hono } from 'hono';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';

const app = new Hono()
  .route('/users', userRoutes)
  .route('/posts', postRoutes);

// 全ルートを含む型
export type AppType = typeof app;

export default app;
```

---

## hcクライアントの使い方

### hc<AppType>('https://api.example.com')

```typescript
// frontend/src/lib/hono.ts
import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';

// クライアントを作成
export const api = hc<AppType>(import.meta.env.VITE_API_URL);

// 使用例
async function getUsers() {
  const response = await api.api.users.$get();
  
  if (response.ok) {
    const data = await response.json();
    // data: { users: User[] }
    return data.users;
  }
  
  throw new Error('Failed to fetch users');
}
```

### client.users.$get() / client.users[':id'].$get()

```typescript
// GET /api/users
const listResponse = await api.api.users.$get();

// GET /api/users/123（パラメータ付き）
const detailResponse = await api.api.users[':id'].$get({
  param: { id: '123' }
});

// POST /api/users（ボディ付き）
const createResponse = await api.api.users.$post({
  json: {
    name: 'Alice',
    email: 'alice@example.com'
  }
});

// Query Parameters
const searchResponse = await api.api.users.$get({
  query: { page: '1', limit: '10' }
});
```

---

## 認証ヘッダーをhcに渡す

### hcのオプションでヘッダーを設定

```typescript
// frontend/src/lib/hono.ts
import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';
import { getToken } from './auth'; // Clerkからトークン取得

// 認証トークンを動的に設定
export const createApiClient = async () => {
  const token = await getToken();
  
  return hc<AppType>(import.meta.env.VITE_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// 使用例
async function getMyProfile() {
  const api = await createApiClient();
  const response = await api.api.profile.$get();
  return response.json();
}
```

### TanStack Queryと組み合わせる

```typescript
// frontend/src/hooks/useUsers.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { createApiClient } from '../lib/hono';

// 認証付きAPIクライアント
const fetchUsers = async () => {
  const api = await createApiClient();
  const response = await api.api.users.$get();
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data.users;
};

// Query
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });
}

// Mutation
const createUser = async (userData: CreateUserInput) => {
  const api = await createApiClient();
  const response = await api.api.users.$post({
    json: userData
  });
  if (!response.ok) throw new Error('Failed to create');
  return response.json();
};

export function useCreateUser() {
  return useMutation({
    mutationFn: createUser
  });
}
```

---

## モノレポ構成でのtype共有

### packagesディレクトリでAPIの型を共有

```
my-app/
├── apps/
│   ├── web/                 # フロントエンド（Vite + React）
│   │   └── src/
│   └── api/                 # バックエンド（Cloudflare Workers）
│       └── src/
├── packages/
│   ├── database/            # Drizzleスキーマ共有
│   │   └── src/schema.ts
│   ├── types/               # 共有型（オプション）
│   └── api-types/           # Hono RPC型共有
│       └── src/index.ts
├── turbo.json
└── package.json
```

### API型の共有パッケージ

```typescript
// packages/api-types/src/index.ts
import { Hono } from 'hono';

// バックエンドから型を再エクスポート
export type { AppType } from '../../apps/api/src/index';

// またはバックエンドを依存関係に追加
// "dependencies": { "@my-app/api": "workspace:*" }
```

```json
// packages/api-types/package.json
{
  "name": "@my-app/api-types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@my-app/api": "workspace:*"
  }
}
```

```typescript
// apps/web/src/lib/api.ts
import { hc } from 'hono/client';
import type { AppType } from '@my-app/api-types';

export const api = hc<AppType>(import.meta.env.VITE_API_URL);
```

---

## turborepoの簡単な説明（触れる程度）

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {}
  }
}
```

```bash
# 全パッケージのビルド
npx turbo build

# 全パッケージの開発サーバー起動
npx turbo dev

# 特定のパッケージだけ
npx turbo dev --filter=api
npx turbo build --filter=web
```

**Turborepoのメリット**
- キャッシュによる高速ビルド
- 依存関係の自動解決
- 並列実行
- モノレポ最適化

---

## デプロイ全体フロー

### D1マイグレーション → CF Workersデプロイ → Vercelデプロイ

```bash
# 1. D1マイグレーション
npx wrangler d1 migrations apply my-database --production

# 2. Cloudflare Workersデプロイ
npx wrangler deploy

# 3. Vercelデプロイ（フロントエンド）
vercel --prod
```

### デプロイフロー図

```
開発環境                      本番環境
    │                            │
    ▼                            ▼
┌──────────┐               ┌──────────┐
│ ローカル  │               │ Cloudflare│
│ D1 SQLite │               │ D1        │
└────┬─────┘               └────┬─────┘
     │ マイグレーション          │
     └──────────────────────────►│
                                  │
┌──────────┐               ┌──────┴─────┐
│ ローカル  │               │ Workers    │
│ Workers  │──────────────►│ Production │
└──────────┘  wrangler      └──────┬─────┘
   deploy                           │
                                    │ API呼び出し
┌──────────┐               ┌──────┴─────┐
│ ローカル  │               │ Vercel     │
│ Vite     │──────────────►│ Production │
└──────────┘  vercel       └────────────┘
   deploy
```

---

## 環境変数の管理

### wrangler secret / Vercel env

```bash
# Cloudflare Workersシークレット設定
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put DATABASE_URL

# wrangler.toml（非シークレット）
[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"
```

```bash
# Vercel環境変数設定
vercel env add VITE_API_URL
vercel env add VITE_CLERK_PUBLISHABLE_KEY

# または .env.local
VITE_API_URL=https://api.your-app.workers.dev
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### 環境変数対応表

| 変数 | 場所 | 用途 |
|------|------|------|
| CLERK_SECRET_KEY | wrangler secret | バックエンド認証 |
| CLERK_JWKS_URL | wrangler.toml | JWT検証 |
| D1_DATABASE_ID | wrangler.toml | D1接続 |
| VITE_API_URL | Vercel env | フロントエンドAPI URL |
| VITE_CLERK_PUBLISHABLE_KEY | Vercel env | フロントエンド認証 |

---

## CORS設定

### Honoのcorsミドルウェア / 許可するoriginの設定

```typescript
// backend/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// シンプルなCORS設定
app.use('*', cors());

// または詳細設定
app.use('*', cors({
  origin: [
    'http://localhost:5173',                    // 開発環境
    'https://my-app.vercel.app',               // 本番環境
    'https://my-app-git-main.vercel.app'       // プレビュー環境
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400  // 24時間
}));
```

### 環境別CORS設定

```typescript
// backend/src/middleware/cors.ts
import { cors } from 'hono/cors';

export function createCORS(env: Env) {
  const allowedOrigins = env.ENVIRONMENT === 'production'
    ? ['https://my-app.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'];
  
  return cors({
    origin: allowedOrigins,
    credentials: true
  });
}
```

---

## 総合演習：フルスタックアプリを完成させる

### ステップ1: バックエンド実装

```typescript
// apps/api/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import { db } from './db';
import { posts } from './db/schema';
import { eq, desc } from 'drizzle-orm';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://my-app.vercel.app']
}));

// 公開エンドポイント
app.get('/api/posts', async (c) => {
  const allPosts = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(20);
  
  return c.json({ posts: allPosts });
});

// 認証が必要なエンドポイント
app.use('/api/my/*', authMiddleware);

app.get('/api/my/posts', async (c) => {
  const userId = c.get('userId');
  
  const myPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt));
  
  return c.json({ posts: myPosts });
});

app.post('/api/my/posts', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const [post] = await db
    .insert(posts)
    .values({
      ...body,
      userId
    })
    .returning();
  
  return c.json({ post }, 201);
});

export type AppType = typeof app;
export default app;
```

### ステップ2: フロントエンド実装

```typescript
// apps/web/src/lib/api.ts
import { hc } from 'hono/client';
import type { AppType } from '@my-app/api';
import { getToken } from './auth';

export const createApiClient = async () => {
  const token = await getToken();
  
  return hc<AppType>(import.meta.env.VITE_API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
};

// React Query hooks
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const api = await createApiClient();
      const res = await api.api.posts.$get();
      return (await res.json()).posts;
    }
  });
}

export function useMyPosts() {
  return useQuery({
    queryKey: ['my-posts'],
    queryFn: async () => {
      const api = await createApiClient();
      const res = await api.api.my.posts.$get();
      return (await res.json()).posts;
    }
  });
}

export function useCreatePost() {
  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const api = await createApiClient();
      const res = await api.api.my.posts.$post({ json: data });
      return (await res.json()).post;
    }
  });
}
```

---

## 講義全体のまとめ

### 今日から使える / いつか深掘りするべき マトリクス

| 技術 | 優先度 | 理由 |
|------|--------|------|
| **Hono** | 今日から | 軽量・型安全・エッジ対応 |
| **Drizzle ORM** | 今日から | SQLライク・型安全・軽量 |
| **Zod** | 今日から | ランタイム検証＋型推論 |
| **Cloudflare Workers** | 今日から | エッジ実行・コールドスタートゼロ |
| **D1** | 今日から | SQLite・エッジ分散・低コスト |
| **Clerk** | 今日から | 認証の複雑さを隠蔽 |
| **Hono RPC** | 今日から | 型共有が劇的に簡単 |
| **JWT/JWKS** | いつか | 仕組みを理解すれば十分 |
| **BigInt** | 今日から | ID処理で必須 |
| **関数型** | いつか | 設計思想として重要 |

---

## 学習ロードマップ

```
今すぐ使える
├── Hono + TypeScript
├── Drizzle ORM + D1
├── Zodバリデーション
├── Clerk認証
└── Hono RPC型共有

次のステップ
├── 関数型プログラミングの深化
├── テスト戦略（Vitest）
├── CI/CDパイプライン
├── パフォーマンス最適化
└── セキュリティベストプラクティス

将来的に
├── マイクロサービス構成
├── リアルタイム通信（WebSocket）
├── キャッシュ戦略（KV/CDN）
└── 大規模アーキテクチャ
```

---

## 参考リソース集

### 公式ドキュメント

- [Hono](https://hono.dev/) - Webフレームワーク
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - エッジコンピューティング
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - エッジデータベース
- [Zod](https://zod.dev/) - TypeScriptスキーマ検証
- [Clerk](https://clerk.com/) - 認証プラットフォーム

### 記事・チュートリアル

- [Hono RPC Documentation](https://hono.dev/docs/guides/rpc)
- [Full Stack Type Safety with Hono](https://blog.hono.dev/full-stack-type-safety)
- [Cloudflare Workers Best Practices](https://developers.cloudflare.com/workers/learning/)

### コミュニティ

- [Hono Discord](https://discord.gg/hono)
- [Cloudflare Developers Discord](https://discord.gg/cloudflaredev)

---

## 修了おめでとう！

### この講義で学んだこと

1. ✅ エッジコンピューティングの基礎
2. ✅ TypeScriptによる型安全な開発
3. ✅ Hono + Drizzle + D1でのバックエンド構築
4. ✅ Zodによるスキーマ駆動開発
5. ✅ Clerkによる認証実装
6. ✅ JWT/JWKSによる認証検証
7. ✅ Hono RPCによるエンドツーエンド型安全
8. ✅ フルスタックデプロイ

**これであなたもフルスタックTypeScriptエンジニア！**

---

## 次のステップ

1. **個人プロジェクトを始める**
   - 小さなアプリを作ってみる
   - 実際の問題を解決する

2. **オープンソースに貢献**
   - Hono, Drizzleなど
   - ドキュメント改善から始めよう

3. **コミュニティに参加**
   - Discordで質問・回答
   - 技術ブログを書く

4. **継続的な学習**
   - 新しい技術のキャッチアップ
   - ベストプラクティスの探求

**Enjoy coding with TypeScript!**
