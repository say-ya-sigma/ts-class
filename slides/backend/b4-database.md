---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# B-4: Database
## Drizzle ORM × Cloudflare D1 — 型安全なDB操作

---

## この授業のゴール

**DrizzleでD1のスキーマを定義し、型安全なCRUDを実装できる**

- Cloudflare D1の理解（SQLiteベースのエッジDB）
- Drizzle ORMの基本と型安全性
- スキーマ定義とマイグレーション
- 実践的なCRUDとJOIN
- ローカル開発フロー

---

## Cloudflare D1とは

**SQLiteベース / エッジで動くリレーショナルDB**

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                  │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Worker    │◄──►│     D1      │    │   Worker    │     │
│  │  (Tokyo)    │    │  (Replica)  │    │  (London)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                            │                                │
│                            ▼                                │
│                     ┌─────────────┐                         │
│                     │   Primary   │                         │
│                     │  (SQLite)   │                         │
│                     └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

**特徴**

| 項目 | 説明 |
|------|------|
| SQLiteベース | 軽量・高速・信頼性高い |
| エッジ分散 | グローバルにレプリカ配置 |
| 低レイテンシ | ユーザーに近い場所でクエリ実行 |
| トランザクション | ACID特性をサポート |

---

## Bindingとして環境から受け取る

**D1は `c.env.DB` としてアクセス**

```typescript
// wrangler.toml でバインディング設定
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "xxxxx-xxxxx-xxxxx"

// Honoでアクセス
app.get('/users', async (c) => {
  // c.env.DB でD1インスタンスにアクセス
  const db = c.env.DB;
  
  const result = await db.prepare('SELECT * FROM users').all();
  return c.json(result.results);
});
```

---

## なぜDrizzleか

### 型安全なクエリビルダー

```typescript
// ❌ 生SQL（タイプミスでランタイムエラー）
const result = await db.prepare('SELET * FROM users').all(); // エラー！

// ✅ Drizzle（コンパイル時にエラー検出）
const result = await db.select().from(users); // タイプミスなし！
```

### SQLに近い書き心地（SQLを隠蔽しない）

```typescript
// DrizzleのクエリはSQLと1:1対応
const result = await db
  .select({
    id: users.id,
    name: users.name,
    postCount: count(posts.id)
  })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId))
  .where(eq(users.active, true))
  .groupBy(users.id)
  .orderBy(desc(users.createdAt))
  .limit(10);

// 生成されるSQL:
// SELECT users.id, users.name, COUNT(posts.id)
// FROM users
// LEFT JOIN posts ON users.id = posts.user_id
// WHERE users.active = 1
// GROUP BY users.id
// ORDER BY users.created_at DESC
// LIMIT 10
```

### エッジ環境に対応

- Cloudflare Workers/Deno/Bun/Node.js全対応
- 軽量（バンドルサイズが小さい）
- SQLライクなAPIで学習コスト低い

---

## スキーマ定義

### sqliteTable / text / integer / primaryKey

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// テーブル定義
export const users = sqliteTable('users', {
  // 主キー
  id: integer('id').primaryKey({ autoIncrement: true }),
  
  // 文字列
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  bio: text('bio'),  // nullable
  
  // 数値
  age: integer('age'),
  score: real('score').default(0),  // 浮動小数点
  
  // Boolean（SQLiteはintegerで表現）
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  
  // タイムスタンプ
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
});
```

---

## TypeScriptの型とDBカラムの対応

| SQLite型 | Drizzle関数 | TypeScript型 |
|----------|-------------|--------------|
| INTEGER | `integer()` | `number` |
| INTEGER (bool) | `integer({ mode: 'boolean' })` | `boolean` |
| INTEGER (timestamp) | `integer({ mode: 'timestamp' })` | `Date` |
| REAL | `real()` | `number` |
| TEXT | `text()` | `string` |
| BLOB | `blob()` | `Buffer` |

```typescript
// 型の自動生成
type User = typeof users.$inferSelect;    // SELECT結果の型
type NewUser = typeof users.$inferInsert; // INSERT用の型

// 実際の型
// type User = {
//   id: number;
//   name: string;
//   email: string;
//   bio: string | null;
//   age: number | null;
//   score: number;
//   isActive: boolean;
//   createdAt: Date;
//   updatedAt: Date | null;
// }
```

---

## drizzle-kit の役割

**CLIツール：スキーマ管理・マイグレーション**

### generate（マイグレーションファイル生成）

```bash
# スキーマ変更を検出してSQLファイル生成
npx drizzle-kit generate

# 出力：drizzle/0001_create_users_table.sql
```

### push（D1に直接適用・開発時）

```bash
# スキーマをD1に直接プッシュ（開発用）
npx drizzle-kit push

# 注意：本番ではmigrateを使用
```

### migrate（本番マイグレーション）

```bash
# 生成されたマイグレーションを実行
npx wrangler d1 migrations apply my-database
```

### studio（GUIでDBを確認）

```bash
# Drizzle Studio起動（ブラウザでDB閲覧・編集）
npx drizzle-kit studio

# Local: http://localhost:4983
```

---

## wrangler.tomlへのD1バインディング設定

```toml
# wrangler.toml

name = "my-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1データベースのバインディング
[[d1_databases]]
binding = "DB"                    # コード内での参照名
database_name = "my-database"     # D1の名前
database_id = "xxxxx-xxxx-xxxx-xxxx-xxxxx"  # D1のID

# 環境変数
[vars]
ENVIRONMENT = "production"

# 開発環境用の設定（オプション）
[env.dev]
vars = { ENVIRONMENT = "development" }
```

**Bindingsの型定義**

```typescript
// src/types.ts
export interface Bindings {
  DB: D1Database;  // wrangler.tomlのbinding名と一致
  ENVIRONMENT: string;
}
```

---

## Hono内でのDrizzleの初期化

### drizzle(c.env.DB) のパターン

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// 初期化関数
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// src/index.ts
import { Hono } from 'hono';
import { createDb } from './db';
import { users } from './db/schema';

const app = new Hono<{ Bindings: Bindings }>();

// ミドルウェアでDBを初期化
app.use(async (c, next) => {
  c.set('db', createDb(c.env.DB));
  await next();
});

// ルートハンドラー
app.get('/users', async (c) => {
  const db = c.get('db');
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});
```

---

## 型安全なCRUDクエリ

### select / insert / update / delete

```typescript
import { eq, and, or, desc, count } from 'drizzle-orm';

// CREATE
const newUser = await db
  .insert(users)
  .values({
    name: 'Alice',
    email: 'alice@example.com',
    age: 30
  })
  .returning();  // 挿入したデータを返す

// READ
const allUsers = await db.select().from(users);

const user = await db
  .select()
  .from(users)
  .where(eq(users.id, 1))
  .get();  // 1件取得

// UPDATE
const updated = await db
  .update(users)
  .set({ name: 'Alice Updated' })
  .where(eq(users.id, 1))
  .returning();

// DELETE
const deleted = await db
  .delete(users)
  .where(eq(users.id, 1))
  .returning();
```

---

## where / eq / and / or

```typescript
import { eq, and, or, gt, lt, like, inArray, isNull } from 'drizzle-orm';

// 単一条件
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'alice@example.com'));

// AND条件
const activeAdults = await db
  .select()
  .from(users)
  .where(and(
    eq(users.isActive, true),
    gt(users.age, 18)
  ));

// OR条件
const searchResult = await db
  .select()
  .from(users)
  .where(or(
    like(users.name, '%Alice%'),
    like(users.email, '%@example.com')
  ));

// 複雑な条件
const result = await db
  .select()
  .from(users)
  .where(and(
    or(
      eq(users.role, 'admin'),
      eq(users.role, 'moderator')
    ),
    gt(users.createdAt, new Date('2024-01-01')),
    isNull(users.deletedAt)
  ));
```

---

## リレーションとJOIN

### innerJoin / with（Eager Loading）

```typescript
// スキーマ定義（リレーション）
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// リレーション定義
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts)
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id]
  })
}));
```

### JOINクエリ

```typescript
// INNER JOIN
const usersWithPosts = await db
  .select({
    userId: users.id,
    userName: users.name,
    postTitle: posts.title
  })
  .from(users)
  .innerJoin(posts, eq(users.id, posts.userId));

// LEFT JOIN
const allUsersWithPosts = await db
  .select({
    user: users,
    post: posts
  })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId));

// 集計
const userPostCounts = await db
  .select({
    userId: users.id,
    name: users.name,
    postCount: count(posts.id)
  })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId))
  .groupBy(users.id);
```

---

## トランザクション

### db.transaction() の使い方

```typescript
// トランザクション内で複数の操作を原子化
await db.transaction(async (tx) => {
  // 1. ユーザーを作成
  const [user] = await tx
    .insert(users)
    .values({ name: 'Alice', email: 'alice@example.com' })
    .returning();
  
  // 2. 初期投稿を作成
  await tx
    .insert(posts)
    .values({
      title: 'Hello World',
      content: 'My first post',
      userId: user.id
    });
  
  // 3. 統計を更新
  await tx
    .update(userStats)
    .set({ postCount: sql`${userStats.postCount} + 1` })
    .where(eq(userStats.userId, user.id));
  
  // どこかでエラーが起きれば全てロールバック
});

// 戻り値を取得
const result = await db.transaction(async (tx) => {
  const user = await tx.insert(users).values({...}).returning();
  const posts = await tx.insert(posts).values({...}).returning();
  
  return { user, posts };  // トランザクション結果を返す
});
```

---

## ローカル開発でのD1シミュレーション

### wrangler d1 execute / --local フラグ

```bash
# ローカルD1データベース作成
npx wrangler d1 create my-database-local

# マイグレーションをローカルDBに適用
npx wrangler d1 migrations apply my-database-local --local

# SQLファイルを直接実行（ローカル）
npx wrangler d1 execute my-database-local --local --file=./seed.sql

# インタラクティブにクエリ実行
npx wrangler d1 execute my-database-local --local --command="SELECT * FROM users"

# 開発サーバー起動（ローカルD1使用）
npx wrangler dev --local
```

### 開発ワークフロー

```
1. スキーマ編集
   ↓
2. drizzle-kit generate（マイグレーション生成）
   ↓
3. wrangler d1 migrations apply --local（ローカル適用）
   ↓
4. wrangler dev --local（開発サーバー起動）
   ↓
5. テスト → 問題なければ本番適用
```

---

## ハンズオン：usersテーブルのCRUD APIを完成させる

### ステップ1: スキーマ定義

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts)
}));

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date())
});

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id]
  })
}));
```

---

### ステップ2: DB初期化

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type DB = ReturnType<typeof createDb>;

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
```

### ステップ3: CRUDエンドポイント

```typescript
// src/index.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { createDb } from './db';
import { users, posts } from './db/schema';

interface Bindings {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>();

// DBミドルウェア
app.use(async (c, next) => {
  c.set('db', createDb(c.env.DB));
  await next();
});

// Validationスキーマ
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional()
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  age: z.number().min(0).max(150).optional(),
  isActive: z.boolean().optional()
});

// CREATE
app.post('/users', zValidator('json', createUserSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');
  
  const [user] = await db.insert(users).values(data).returning();
  return c.json(user, 201);
});

// READ (List)
app.get('/users', async (c) => {
  const db = c.get('db');
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  return c.json(allUsers);
});

// READ (Single with posts)
app.get('/users/:id', zValidator('param', z.object({ id: z.string() })), async (c) => {
  const db = c.get('db');
  const { id } = c.req.valid('param');
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, parseInt(id)),
    with: { posts: true }
  });
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json(user);
});

// UPDATE
app.put('/users/:id', 
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', updateUserSchema),
  async (c) => {
    const db = c.get('db');
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(updated);
  }
);

// DELETE
app.delete('/users/:id', zValidator('param', z.object({ id: z.string() })), async (c) => {
  const db = c.get('db');
  const { id } = c.req.valid('param');
  
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, parseInt(id)))
    .returning();
  
  if (!deleted) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ message: 'User deleted' });
});

export default app;
```

---

## まとめ・次回予告

### 今日学んだこと

1. ✅ Cloudflare D1 = SQLiteベースのエッジ分散DB
2. ✅ `c.env.DB` バインディングでアクセス
3. ✅ Drizzle = 型安全 + SQLライク + エッジ対応
4. ✅ `sqliteTable` でスキーマ定義
5. ✅ drizzle-kit: generate/push/migrate/studio
6. ✅ wrangler.tomlでD1バインディング設定
7. ✅ `drizzle(c.env.DB)` で初期化
8. ✅ CRUD: select/insert/update/delete
9. ✅ where/eq/and/orで条件指定
10. ✅ innerJoin/leftJoin/withでリレーション
11. ✅ `db.transaction()` でトランザクション
12. ✅ `--local` フラグでローカル開発

### 次回予告: B-5 Authentication

**「JWT / JWKS / RS256 / Clerk Verification」**

- JWTの仕組みと検証
- RS256公開鍵暗号方式
- JWKSによる鍵のローテーション
- Clerkとの統合

**次回もお楽しみに！**

---

## 参考リンク

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [drizzle-kit CLI](https://orm.drizzle.team/kit-docs/overview)
- [SQLite Data Types](https://www.sqlite.org/datatype3.html)
