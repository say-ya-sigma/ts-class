---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# B-3: Validation
## Zod, Runtime Safety & Schema-Driven Development

---

## この授業のゴール

**スキーマ駆動開発で型安全なバリデーションを実現する**

- TypeScriptの型の限界を理解
- Zodによるランタイム検証
- スキーマから型を自動生成（DRY原則）
- drizzle-zodでのDB統合
- 実践的なエラーハンドリング

---

## 「型安全なコード」の限界

### TypeScriptの型はコンパイル時だけ

```typescript
// コンパイル時は安全
interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User) {
  console.log(`Hello, ${user.name}!`);
}

// ✅ コンパイルOK
const validUser: User = { id: 1, name: "Alice", email: "alice@example.com" };
greetUser(validUser);
```

### 実行時に外から来るデータは型安全ではない

```typescript
// APIからのレスポンス（実際はany）
const response = await fetch('/api/user');
const user = await response.json();  // any型！

// 型アサーションは信頼できない
const typedUser = user as User;  // 強制的に型付け

// 実際のデータが壊れていた場合
greetUser(typedUser);  // ランタイムエラー！user.nameがundefined
```

**問題の本質**

```
コンパイル時: TypeScriptが型チェック
      │
      ▼
デプロイ: JavaScriptになる（型情報消失）
      │
      ▼
実行時: 外部データが入ってくる（型チェックなし！）
      │
      ▼
ランタイムエラー 💥
```

---

## Zodとは

**ランタイム検証 + 型推論の統合**

```typescript
import { z } from 'zod';

// スキーマを定義
const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email()
});

// ランタイム検証
const result = UserSchema.safeParse(unknownData);

if (result.success) {
  // result.data は型安全！
  console.log(result.data.name);  // string型として補完される
}
```

**Zodの3つの強み**

| 特徴 | 説明 |
|------|------|
| ランタイム検証 | 実際のデータを検証 |
| 型推論 | スキーマからTypeScript型を自動生成 |
| 宣言的 | 読みやすいスキーマ定義 |

---

## z.infer<>による型の自動生成

**スキーマを一度書けば型も自動で手に入る（DRY原則）**

```typescript
import { z } from 'zod';

// 1. スキーマを定義（これが唯一の情報源）
const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  age: z.number().min(0).max(150).optional(),
  role: z.enum(['admin', 'user', 'guest'])
});

// 2. 型を自動生成（手動で書かない！）
type User = z.infer<typeof UserSchema>;
// 自動的に以下と同じ型になる：
// type User = {
//   id: number;
//   name: string;
//   email: string;
//   age?: number | undefined;
//   role: 'admin' | 'user' | 'guest';
// }

// 3. スキーマ変更時はここだけ修正
type CreateUserInput = z.infer<typeof CreateUserSchema>;
type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
```

**DRY原則の実現**

```
❌ 従来の方法（重複あり）
┌──────────────────────────────────────────┐
│ interface User {                         │
│   id: number;                            │
│   name: string;                          │
│   email: string;                         │
│ }                                        │
│                                          │
│ const validateUser = (data: unknown) => {│
│   // 同じ構造を再度書く                    │
│   if (typeof data.id !== 'number') ...   │
│   if (typeof data.name !== 'string') ... │
│ }                                        │
└──────────────────────────────────────────┘

✅ Zodの方法（スキーマが唯一の情報源）
┌──────────────────────────────────────────┐
│ const UserSchema = z.object({ ... });    │
│                                          │
│ type User = z.infer<typeof UserSchema>;  │
│ // 型は自動生成                            │
└──────────────────────────────────────────┘
```

---

## 基本的なスキーマ定義

### z.object / z.string / z.number / z.enum / z.array

```typescript
import { z } from 'zod';

// 文字列
const nameSchema = z.string();
const emailSchema = z.string().email();           // メール形式
const passwordSchema = z.string().min(8).max(100); // 長さ制限
const urlSchema = z.string().url();                // URL形式

// 数値
const ageSchema = z.number().int().min(0).max(150);
const priceSchema = z.number().positive();

// Enum（列挙型）
const roleSchema = z.enum(['admin', 'user', 'guest']);

// 配列
const tagsSchema = z.array(z.string());
const usersSchema = z.array(userSchema);

// オブジェクト（入れ子も可能）
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{3}-\d{4}$/)  // 正規表現
});

const userSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional(),        // オプショナル
  role: roleSchema.default('user'),  // デフォルト値
  address: addressSchema.nullable(), // null許容
  tags: tagsSchema,
  createdAt: z.date().default(() => new Date())
});
```

---

## safeParse vs parse

### 例外を投げるか / Result型で返すか

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(0)
});

// ❌ parse: 失敗時に例外を投げる
app.post('/users', async (c) => {
  try {
    const body = await c.req.json();
    const user = UserSchema.parse(body);  // 失敗時にZodErrorを投げる
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    throw error;
  }
});

// ✅ safeParse: Result型で返す（推奨）
app.post('/users', async (c) => {
  const body = await c.req.json();
  const result = UserSchema.safeParse(body);
  
  if (!result.success) {
    // result.error に詳細なエラー情報
    return c.json({ 
      error: 'Validation failed',
      details: result.error.flatten() 
    }, 400);
  }
  
  // result.success === true のときだけ result.data にアクセス
  const user = result.data;  // 型安全！
  // ...
});
```

---

## エラーハンドリングと型の絞り込み

### result.success で分岐 / Type Narrowing

```typescript
const result = UserSchema.safeParse(unknownData);

// Type Narrowing（型の絞り込み）
if (result.success) {
  // TypeScriptはここで result.data が有効だと分かる
  const user: User = result.data;
  console.log(user.name);  // 補完が効く！
} else {
  // TypeScriptはここで result.error が有効だと分かる
  const error: ZodError = result.error;
  
  // エラーの詳細
  console.log(error.issues);
  // [
  //   { path: ['name'], message: 'Required', code: 'invalid_type' },
  //   { path: ['email'], message: 'Invalid email', code: 'invalid_string' }
  // ]
}

// 関数として切り出し
function handleValidation<T>(
  result: SafeParseReturnType<unknown, T>
): { success: true; data: T } | { success: false; errors: string[] } {
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
  };
}
```

---

## zValidatorミドルウェア（Hono統合）

### @hono/zod-validator / c.req.valid('json')

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

// スキーマ定義
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional()
});

// zValidatorミドルウェアを使用
app.post(
  '/users',
  zValidator('json', createUserSchema),  // バリデーション
  async (c) => {
    // ✅ バリデーション済みデータが型安全に取り出せる
    const data = c.req.valid('json');
    
    // data の型は { name: string; email: string; age?: number }
    // TypeScriptの補完が完璧に効く
    console.log(data.name);   // string
    console.log(data.email);  // string
    console.log(data.age);    // number | undefined
    
    // DBに保存
    const user = await db.insert(users).values(data).returning();
    
    return c.json(user, 201);
  }
);

// バリデーションエラーは自動的に400レスポンス
// { "success": false, "error": { ... } }
```

---

## バリデーション済みデータの型安全性

```typescript
// 複数のバリデーション
app.post(
  '/users/:id/posts',
  zValidator('param', z.object({ id: z.string() })),      // URLパラメータ
  zValidator('json', createPostSchema),                    // リクエストボディ
  zValidator('query', z.object({ page: z.string().optional() })), // クエリ
  async (c) => {
    // すべて型安全にアクセス
    const { id } = c.req.valid('param');      // string
    const body = c.req.valid('json');         // CreatePostInput型
    const { page } = c.req.valid('query');    // { page?: string }
    
    // ここでは型が保証されている！
    const userId = parseInt(id);
    const post = await createPost(userId, body);
    
    return c.json(post);
  }
);
```

---

## 複雑なスキーマ

### z.union / z.discriminatedUnion / z.transform

```typescript
import { z } from 'zod';

// Union（いずれかの型）
const stringOrNumber = z.union([z.string(), z.number()]);

// Discriminated Union（判別可能なUnion）
const shapeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('circle'), radius: z.number() }),
  z.object({ type: z.literal('rectangle'), width: z.number(), height: z.number() }),
  z.object({ type: z.literal('triangle'), base: z.number(), height: z.number() })
]);

// Transform（変換しながら検証）
const numberFromString = z.string().transform((val) => {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) {
    throw new Error('Not a number');
  }
  return parsed;
});

const dateFromString = z.string().transform((val) => new Date(val));

// Refine（カスタム検証）
const passwordSchema = z.string().refine(
  (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
  { message: 'Password must contain uppercase, lowercase, and number' }
);

// Preprocess（前処理 + 検証）
const booleanFromString = z.preprocess(
  (val) => (val === 'true' ? true : val === 'false' ? false : val),
  z.boolean()
);

// 実用的な例
const apiResponseSchema = z.object({
  data: z.unknown(),
  meta: z.object({
    page: z.number(),
    total: z.number()
  })
}).transform((val) => ({
  ...val,
  hasMore: val.meta.page * 10 < val.meta.total
}));
```

---

## drizzle-zodによるスキーマの自動生成

### DBスキーマ → Zodスキーマ → 型 の3段自動生成

```typescript
// schema.ts - Drizzleのスキーマ定義
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// validation.ts - drizzle-zodでZodスキーマ生成
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './schema';

// INSERT用スキーマ（自動生成）
export const insertUserSchema = createInsertSchema(users, {
  // カスタマイズ可能
  name: (schema) => schema.min(1, "Name is required"),
  email: (schema) => schema.email("Invalid email format"),
  age: (schema) => schema.min(0).max(150).optional()
});

// SELECT用スキーマ（自動生成）
export const selectUserSchema = createSelectSchema(users);

// 型も自動生成
type InsertUser = z.infer<typeof insertUserSchema>;
type SelectUser = z.infer<typeof selectUserSchema>;

// 使用例
app.post('/users', zValidator('json', insertUserSchema), async (c) => {
  const data = c.req.valid('json');  // InsertUser型
  
  const user = await db.insert(users).values(data).returning();
  return c.json(user);
});
```

---

## 3段階の自動生成フロー

```
┌──────────────────────────────────────────────────────────────┐
│  1. DBスキーマ（Drizzle）                                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  sqliteTable('users', {                              │    │
│  │    id: integer('id').primaryKey(),                   │    │
│  │    name: text('name').notNull(),                     │    │
│  │    email: text('email').notNull()                    │    │
│  │  })                                                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼ createInsertSchema()             │
│  2. Zodスキーマ（自動生成）                                    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  z.object({                                          │    │
│  │    id: z.number().optional(),                        │    │
│  │    name: z.string(),                                 │    │
│  │    email: z.string()                                 │    │
│  │  })                                                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼ z.infer<>                        │
│  3. TypeScript型（自動生成）                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  type InsertUser = {                                 │    │
│  │    id?: number;                                      │    │
│  │    name: string;                                     │    │
│  │    email: string;                                    │    │
│  │  }                                                   │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## ハンズオン：CRUDエンドポイントをZodで保護する

### ステップ1: スキーマ定義

```typescript
// src/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';

// Drizzleスキーマ
export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age'),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date())
});

// Zodスキーマ生成
export const insertUserSchema = createInsertSchema(users, {
  name: (s) => s.min(1, "Name is required").max(100),
  email: (s) => s.email("Invalid email format"),
  age: (s) => s.min(0).max(150).optional(),
  role: z.enum(['admin', 'user']).default('user')
}).omit({ id: true, createdAt: true });

export const updateUserSchema = createUpdateSchema(users, {
  name: (s) => s.min(1).max(100).optional(),
  email: (s) => s.email().optional(),
  age: (s) => s.min(0).max(150).optional()
}).partial();

export const selectUserSchema = createSelectSchema(users);

// 型定義
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
```

---

### ステップ2: CRUDエンドポイント

```typescript
// src/index.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { users, insertUserSchema, updateUserSchema } from './schema';
import { db } from './db';

const app = new Hono();

// CREATE
app.post('/users', zValidator('json', insertUserSchema), async (c) => {
  const data = c.req.valid('json');
  const user = await db.insert(users).values(data).returning();
  return c.json(user[0], 201);
});

// READ (List)
app.get('/users', async (c) => {
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});

// READ (Single)
app.get('/users/:id', zValidator('param', z.object({ id: z.string() })), async (c) => {
  const { id } = c.req.valid('param');
  const user = await db.select().from(users).where(eq(users.id, parseInt(id)));
  
  if (user.length === 0) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json(user[0]);
});

// UPDATE
app.put(
  '/users/:id',
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', updateUserSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    
    const updated = await db
      .update(users)
      .set(data)
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (updated.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(updated[0]);
  }
);

// DELETE
app.delete('/users/:id', zValidator('param', z.object({ id: z.string() })), async (c) => {
  const { id } = c.req.valid('param');
  
  const deleted = await db
    .delete(users)
    .where(eq(users.id, parseInt(id)))
    .returning();
  
  if (deleted.length === 0) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ message: 'User deleted' });
});

export default app;
```

---

## まとめ・次回予告

### 今日学んだこと

1. ✅ TypeScriptの型はコンパイル時だけ（ランタイムでは消失）
2. ✅ 外部データはランタイム検証が必須
3. ✅ Zod = ランタイム検証 + 型推論
4. ✅ `z.infer<>` でDRY原則を実現
5. ✅ 基本スキーマ: object, string, number, enum, array
6. ✅ `safeParse` でResult型による安全なエラーハンドリング
7. ✅ `zValidator` ミドルウェアでHonoと統合
8. ✅ バリデーション済みデータは `c.req.valid()` で型安全に取得
9. ✅ Union, Transform, Refine で複雑な検証
10. ✅ drizzle-zod でDBスキーマ → Zodスキーマ → 型 の自動生成

### 次回予告: B-4 Database

**「Drizzle ORM / D1 / Migrations」**

- Drizzle ORMの基本概念
- D1（CloudflareのSQLite）
- スキーママイグレーション
- リレーションとクエリビルダー

**次回もお楽しみに！**

---

## 参考リンク

- [Zod Documentation](https://zod.dev/)
- [drizzle-zod](https://orm.drizzle.team/docs/zod)
- [@hono/zod-validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator)
- [Schema Validation with Zod](https://zod.dev/?id=introduction)
