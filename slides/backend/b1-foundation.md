---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# B-1: Foundation
## Edge Execution & Hono Framework

---

## この授業のゴール

**フロントエンドからバックエンドまで、TypeScript一本でフルスタック開発**

- エッジコンピューティングの理解
- Cloudflare Workers + Hono の実践
- 型安全なAPI開発
- フロントエンドとの連携

---

## 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        クライアント                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  React App  │  │  Hono RPC   │  │  JWT認証 (Clerk)    │  │
│  │  (Browser)  │  │  Client     │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
└─────────┼────────────────┼───────────────────────────────────┘
          │                │
          │ HTTP Request   │
          ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ 東京    │  │ シンガポール│  │ フランクフルト│  │ サンフランシスコ│    │
│  │   🗼    │  │    🦁    │  │    🏰    │  │    🌉    │         │
│  │ Worker  │  │ Worker  │  │ Worker  │  │ Worker  │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    データ層                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  D1 (SQLite)│  │  KV Storage │  │  External APIs      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 「エッジ実行」とは何か

**従来のサーバー構成（東京に1台）**

```
東京サーバー ◄──────────── 世界中のユーザー
     │
     └─ 物理的距離 = レイテンシ

ニューヨークのユーザー: 200ms+
ブラジルのユーザー: 300ms+
オーストラリアのユーザー: 250ms+
```

**CDNエッジ（世界中に分散）**

```
        東京        シンガポール      フランクフルト
         🗼            🦁              🏰
         │            │               │
    ┌────┴────┐  ┌────┴────┐    ┌────┴────┐
    │  Worker │  │  Worker │    │  Worker │
    │  10ms   │  │   5ms   │    │   8ms   │
    └────┬────┘  └────┬────┘    └────┬────┘
         │            │               │
    近いユーザー    近いユーザー     近いユーザー
```

---

## レイテンシの違いを図で説明

**従来の集中型サーバー**

```
User (NY) ──200ms──► Tokyo Server ──200ms──► User (NY)
                              Total: 400ms

User (Sydney) ──250ms──► Tokyo Server ──250ms──► User (Sydney)
                              Total: 500ms
```

**エッジコンピューティング**

```
User (NY) ──10ms──► NY Edge ──10ms──► User (NY)
                              Total: 20ms

User (Sydney) ──5ms──► Sydney Edge ──5ms──► User (Sydney)
                              Total: 10ms
```

💡 **エッジ実行 = ユーザーの物理的距離を短縮**

---

## Cloudflare Workersの仕組み

### V8 Isolate とは

```
┌────────────────────────────────────────────────────────────┐
│  Node.js プロセス                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  プロセス起動                                          │  │
│  │  ├── モジュール読み込み (数百ms)                       │  │
│  │  ├── メモリ確保                                        │  │
│  │  └── コード実行                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                           │
│  コールドスタート: 数百ms〜数秒                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  V8 Isolate                                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │Isolate 1│  │Isolate 2│  │Isolate 3│  ... 軽量サンドボックス │
│  │  0ms起動 │  │  0ms起動 │  │  0ms起動 │                        │
│  └─────────┘  └─────────┘  └─────────┘                    │
│                                                           │
│  既存のV8プロセス内で隔離実行                               │
│  コールドスタート: 0ms (事実上)                             │
└────────────────────────────────────────────────────────────┘
```

**根本的な違い**
| Node.js | V8 Isolate |
|---------|-----------|
| プロセス単位で起動 | スレッド単位で隔離 |
| コールドスタート数百ms | コールドスタートほぼ0ms |
| メモリ消費大 | メモリ消費極小 |
| ステートフル | ステートレス |

---

## 起動が速い理由

**コールドスタートほぼゼロ**

```javascript
// Node.js: 毎回プロセス起動
const server = http.createServer(); // 500ms+
server.listen(3000);

// Cloudflare Workers: Isolateは既に暖まっている
export default {
  async fetch(request) {
    return new Response('Hello!'); // 0ms起動
  }
};
```

**なぜ速い？**
1. V8エンジンは常に動作中
2. コードは事前コンパイル済み
3. プロセス起動のオーバーヘッドなし
4. リクエスト単位でIsolateを割り当て

---

## エッジ実行の制約

### 使えないNode.js API

```javascript
// ❌ 使えない
import fs from 'fs';           // ファイルシステムなし
import net from 'net';         // TCPソケット不可
import { exec } from 'child_process'; // プロセス実行不可
process.env.HOME;              // process オブジェクト制限あり

// ✅ 代わりに使える
import { KVNamespace } from '@cloudflare/workers-types';  // KVストレージ
import { D1Database } from '@cloudflare/workers-types';   // SQLite
fetch();  // 標準のFetch API（制限付き）
```

**制約の本質**
- ステートレス実行（リクエスト間で状態を保持しない）
- サンドボックス化（セキュリティのため）
- 短時間実行（CPU時間に制限あり）

---

## 制約がある「から」関数型が向いている

**なぜ関数型プログラミングがエッジに最適？**

```typescript
// ✅ 純粋関数 = ステートレス
const calculateTotal = (items: Item[]): number => 
  items.reduce((sum, item) => sum + item.price, 0);
// 同じ入力 → 同じ出力（キャッシュしやすい）

// ❌ ステートフル（問題）
let globalCounter = 0; // リクエスト間で共有できない！
const increment = () => ++globalCounter;

// ✅ 不変性 = 安全
const newState = { ...oldState, count: oldState.count + 1 };
// 副作用なし、予測可能

// ✅ 副作用の分離
const handler = async (request: Request, env: Env) => {
  // 入力（request）から
  const body = await request.json();
  
  // 純粋な変換
  const result = validateAndTransform(body);
  
  // 出力（副作用を明示）
  await env.DB.insert(result);
  
  return Response.json(result);
};
```

**制約を強みに変える設計**

| 制約 | 関数型アプローチ | 効果 |
|------|----------------|------|
| ステートレス | 純粋関数 | テスト容易、予測可能 |
| 不変環境 | 不変データ構造 | バグ防止 |
| 短時間実行 | 副作用の分離 | エラーハンドリング明確 |

---

## wrangler.toml の役割

```toml
# wrangler.toml - Cloudflare Workersの設定ファイル

# プロジェクト名（Workersの識別子）
name = "my-hono-api"

# エントリーポイント
main = "src/index.ts"

# 互換性日付（新しい機能・バグ修正が適用される基準日）
compatibility_date = "2024-01-01"

# 環境変数
[vars]
API_VERSION = "v1"
DEBUG = "false"

# シークレット（wrangler secret put で設定）
# [env.production.vars]
# DATABASE_URL = "..."

# Bindings（外部リソースとの接続）
[[d1_databases]]
binding = "DB"                    # コード内での参照名
database_name = "production-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

[[kv_namespaces]]
binding = "CACHE"
id = "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
```

---

## wrangler.toml: Bindings設定

**Bindings = Workersと外部リソースの接続**

```toml
# D1 Database（SQLite）
[[d1_databases]]
binding = "DB"  # TypeScriptでは c.env.DB でアクセス
database_name = "my-database"
database_id = "xxxxx"

# KV Storage（Key-Value）
[[kv_namespaces]]
binding = "CACHE"
id = "yyyyy"

# R2 Storage（オブジェクトストレージ）
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "my-bucket"
```

**TypeScriptでの型定義**

```typescript
// src/types.ts
export interface Bindings {
  DB: D1Database;        // D1 binding
  CACHE: KVNamespace;    // KV binding
  STORAGE: R2Bucket;     // R2 binding
  API_KEY: string;       // 環境変数
}
```

---

## ローカル開発環境

### wrangler dev

```bash
# 開発サーバー起動
npx wrangler dev

# ホットリロード対応（ファイル変更で自動再起動）
# Local: http://localhost:8787
```

**動作の違い**

| モード | 説明 | 用途 |
|--------|------|------|
| `wrangler dev` | Miniflare使用、ローカル実行 | 通常開発 |
| `wrangler dev --remote` | 実際のエッジで実行 | 本番近い検証 |

### Miniflareの仕組み

```
┌─────────────────────────────────────────────┐
│           wrangler dev                      │
│  ┌───────────────────────────────────────┐  │
│  │         Miniflare                     │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  V8 Isolate シミュレーター       │  │  │
│  │  │  • Workersランタイムの再現       │  │  │
│  │  │  • Bindings（D1/KV）のモック     │  │  │
│  │  │  • ローカルSQLiteデータベース    │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Honoとは

**ultra-fast / Web Standards準拠 / multi-runtime**

```typescript
// Hono = 炎（日本語）🔥
// 軽量で高速、Web標準に完全準拠

import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('Hello Hono!'));

export default app;
```

**特徴**

| 特徴 | 説明 |
|------|------|
| Ultra-fast | 最速のWebフレームワークの一つ |
| Web Standards | Request/Response API準拠 |
| Multi-runtime | Cloudflare, Deno, Bun, Node.js対応 |
| TypeScript | 型安全性の完全サポート |
| Middleware | Expressライクなミドルウェア |

---

## Honoのルーティング基本

```typescript
import { Hono } from 'hono';

const app = new Hono();

// HTTPメソッド
app.get('/users', (c) => {
  return c.json({ users: [] });
});

app.post('/users', async (c) => {
  const body = await c.req.json();
  return c.json({ created: body }, 201);
});

app.put('/users/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  return c.json({ updated: id, data: body });
});

app.delete('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ deleted: id });
});

// レスポンスヘルパー
app.get('/text', (c) => c.text('Plain text'));
app.get('/html', (c) => c.html('<h1>HTML</h1>'));
app.get('/json', (c) => c.json({ key: 'value' }));

export default app;
```

---

## Honoのコンテキスト型

**Bindings型 / Variables型**

```typescript
// src/types.ts
import { Context, Env } from 'hono';

// Bindings: wrangler.toml で定義された環境変数・Bindings
interface Bindings {
  DB: D1Database;
  API_KEY: string;
}

// Variables: ミドルウェア間で共有するデータ
interface Variables {
  user: { id: string; email: string };
  requestId: string;
}

// カスタムContext型
interface CustomEnv extends Env {
  Bindings: Bindings;
  Variables: Variables;
}

// アプリケーション作成時にジェネリクスで渡す
const app = new Hono<CustomEnv>();

// 型安全にアクセス
app.get('/', async (c) => {
  const db = c.env.DB;           // D1Database型
  const apiKey = c.env.API_KEY;  // string型
  const user = c.get('user');    // { id: string; email: string }型
  
  return c.json({ success: true });
});
```

---

## ミドルウェアの仕組み

```typescript
import { Hono, MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

// 方法1: createMiddleware（推奨）
const authMiddleware = createMiddleware<CustomEnv>(async (c, next) => {
  // await next() の前 = リクエスト処理前
  console.log('Before handler');
  
  // 認証チェック
  const token = c.req.header('Authorization');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // コンテキストにデータを設定
  c.set('user', { id: '123', email: 'user@example.com' });
  
  // 次のミドルウェア/ハンドラーへ
  await next();
  
  // await next() の後 = レスポンス送信後
  console.log('After handler');
});

// 方法2: 関数として定義
const loggingMiddleware: MiddlewareHandler<CustomEnv> = async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${c.req.method} ${c.req.url} - ${duration}ms`);
};

// ミドルウェア適用
app.use('*', loggingMiddleware);      // 全ルート
app.use('/api/*', authMiddleware);    // /api/以下のみ

app.get('/api/profile', (c) => {
  const user = c.get('user');  // ミドルウェアでセットしたデータ
  return c.json({ user });
});
```

---

## ハンズオン：最初のAPIをデプロイする

### ステップ1: プロジェクト作成

```bash
# Honoプロジェクト作成
npm create hono@latest my-api
cd my-api
# 「cloudflare-workers」を選択

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

### ステップ2: エンドポイント実装

```typescript
// src/index.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('Hello World!'));

app.get('/api/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString() 
}));

export default app;
```

### ステップ3: デプロイ

```bash
# 本番デプロイ
npx wrangler deploy

# URLが表示されたら成功！
# https://my-api.your-subdomain.workers.dev
```

---

## まとめ・次回予告

### 今日学んだこと

1. ✅ エッジ実行 = 世界中に分散した軽量実行環境
2. ✅ Cloudflare Workers = V8 Isolateでコールドスタートゼロ
3. ✅ 制約（ステートレス）は関数型プログラミングに最適
4. ✅ wrangler.toml で設定・Bindingsで外部リソース接続
5. ✅ Hono = 軽量・高速・型安全なWebフレームワーク
6. ✅ ミドルウェアで横断的関心事を分離

### 次回予告: B-2 Type System

**「JS Number Types / Functional × TypeScript」**

- JavaScriptの数値型の落とし穴
- BigIntの実践的な使い方
- 関数型プログラミングのTypeScriptでの表現
- Option型・Result型によるエラーハンドリング

**次回もお楽しみに！**

---

## 参考リンク

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Documentation](https://hono.dev/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [V8 Isolates Explained](https://developers.cloudflare.com/workers/learning/how-workers-works/)
