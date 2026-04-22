---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# B-5: Authentication
## JWTとClerk連携

---

## この授業のゴール

**JWTの仕組みを理解し、ClerkのトークンをHonoで検証できる**

- JWTの構造と仕組み
- 対称暗号 vs 非対称暗号
- RS256とJWKSによる公開鍵検証
- Clerk JWTの検証実装
- フロントエンド連携とWebhook

---

## 復習：フロントエンドでClerkを使った（F-6）

### Clerkが「何かをやっている」の正体を今日明かす

```
フロントエンド（F-6で実装）
  - <SignIn />
    ↓
  - Clerk SDKが認証フロー管理
    ↓
  - const token = await getToken()
    JWT取得！
    ↓ Bearer <JWT>
バックエンド（今日のテーマ）
  - JWT検証
    ├─ Header: アルゴリズム情報
    ├─ Payload: userId, email, 有効期限
    └─ Signature: 改ざん検知用署名
```

**今日学ぶこと**
- JWTの中身を見てみる
- 署名を検証して改ざんを防ぐ
- Clerkの公開鍵で検証する

---

## JWTとは何か

### Header.Payload.Signature の3パーツ構造

```javascript
// JWT = Header + Payload + Signature（.で連結）
const jwt = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature';

const [header, payload, signature] = jwt.split('.');

// Header（アルゴリズム情報）
console.log(atob(header));
// { "alg": "RS256", "typ": "JWT" }

// Payload（クレーム）
console.log(atob(payload));
// {
//   "sub": "user_123",      // ユーザーID
//   "email": "user@example.com",
//   "iat": 1516239022,      // 発行時刻
//   "exp": 1516242622       // 有効期限
// }

// Signature（署名）- 改ざん検知用
// ヘッダーとペイロードを秘密鍵で署名
```

---

## base64urlとは / 中身は誰でも見られる

```javascript
// base64url = Base64エンコードのURL安全版
// + → -
// / → _
// = （パディング）削除

// デコードしてみると...
const jwt = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';

const decoded = JSON.parse(atob(jwt));
console.log(decoded);
// {
//   "sub": "1234567890",
//   "name": "John Doe",
//   "iat": 1516239022
// }

// 重要：JWTの中身は誰でも見られる！
// → 機密情報を入れてはいけない
// → 署名があるから改ざんだけは防げる
```

**JWTのセキュリティ原則**

| 特徴 | 説明 |
|------|------|
| 読める | Base64URLデコードで誰でも見られる |
| 検証できる | 署名で改ざんを検知 |
| 信頼できる | 信頼できる発行者の署名があれば信頼できる |

---

## 「署名」があるから改ざんを検知できる

**JWT生成（Clerkが行う）**

```
Header + Payload
      ↓
┌─────────────────┐
│  HMAC-SHA256    │  秘密鍵でハッシュ化
│  または RSA     │
└─────────────────┘
      ↓
Signature（署名）
      ↓ Bearer <JWT>
```

**JWT検証（Cloudflare Workersが行う）**

```
Header + Payload + Signature
      │
      ├── Header + Payload ──→ 同じアルゴリズムで計算
      │                           ↓
      │                      計算した署名
      │                           │
      └── Signature ──────────────┼── 比較
                                  │
                              一致？
                           Yes: 信頼できる
                           No:  改ざん検知！
```

---

## 対称暗号 vs 非対称暗号

### HS256（共有秘密鍵）

```
HS256 = HMAC + SHA-256

署名: HMACSHA256(base64url(header) + "." +
                base64url(payload),
                secret)

  ┌─────────────┐          ┌─────────────┐
  │   Clerk     │◄────────►│   Worker    │
  │  (秘密鍵)   │  同じ鍵   │  (秘密鍵)   │
  └─────────────┘          └─────────────┘

  シンプル・高速
  秘密鍵を共有する必要あり（セキュリティリスク）
```

### RS256（公開鍵/秘密鍵）

```
RS256 = RSA + SHA-256

  ┌─────────────┐
  │   Clerk     │──秘密鍵で署名──→ JWT
  │  (秘密鍵)   │
  └─────────────┘

  ┌─────────────┐
  │   Worker    │◄──公開鍵で検証── JWT
  │  (公開鍵)   │
  └─────────────┘

  秘密鍵を共有しない（安全）
  公開鍵は誰でも取得可能
```

---

## なぜClerkはRS256（非対称暗号）を使うか

### Clerkが秘密鍵で署名 / CF WorkersがJWKSで公開鍵を取得

```
Clerkの仕組み

┌─────────────────┐
│  秘密鍵（非公開） │  ユーザー認証 + JWT署名
│  （RS256用）     │
└────────┬────────┘
         ↓ JWT (id_token)
┌─────────────────┐
│   フロントエンド  │  getToken()で取得
└────────┬────────┘
         ↓ Bearer <token>
┌─────────────────┐
│  Cloudflare      │
│  Workers        │  ← 公開鍵で検証（秘密鍵不要！）
└─────────────────┘
         ↓ HTTPS
┌───────────────────────────────────┐
│  JWKSエンドポイント                │
│  https://clerk.xxx.com/.well-known/ │
│  jwks.json                        │
└───────────────────────────────────┘
```

**RS256を使う理由**
- 秘密鍵を誰にも渡さない（Clerkだけが持つ）
- 誰でも公開鍵を使って検証できる
- 鍵ローテーションが容易（JWKSに複数公開鍵）

---

## JWKS（JSON Web Key Set）とは

### 公開鍵の配布エンドポイント

```javascript
// https://clerk.your-app.com/.well-known/jwks.json
{
  "keys": [
    {
      "kty": "RSA",          // 鍵タイプ
      "kid": "key-2024-01",  // 鍵ID
      "use": "sig",          // 用途（署名）
      "alg": "RS256",        // アルゴリズム
      "n": "xGOr-H7...",     // 公開鍵（モジュラス）
      "e": "AQAB"            // 公開指数
    },
    {
      "kty": "RSA",
      "kid": "key-2023-12",  // 過去の鍵（ローテーション用）
      "use": "sig",
      "alg": "RS256",
      "n": "yHPq-I8...",
      "e": "AQAB"
    }
  ]
}
```

**JWKSの使い方**

```javascript
// JWTヘッダーからkidを取得
const header = JSON.parse(atob(jwt.split('.')[0]));
// { "alg": "RS256", "kid": "key-2024-01", "typ": "JWT" }

// JWKSから対応する公開鍵を取得
const jwks = await fetch('https://clerk.xxx.com/.well-known/jwks.json');
const { keys } = await jwks.json();
const publicKey = keys.find(k => k.kid === header.kid);

// 公開鍵で署名を検証
```

---

## joseライブラリ

### createRemoteJWKSet / jwtVerify

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

// JWKSの取得（キャッシュ付き）
const JWKS = createRemoteJWKSet(
  new URL('https://clerk.xxx.com/.well-known/jwks.json')
);

// JWT検証
async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: 'https://clerk.xxx.com',  // 発行者検証
    audience: 'your-api-id'            // 対象検証（オプション）
  });
  
  return payload;
  // {
  //   sub: "user_123",           // ユーザーID
  //   email: "user@example.com",
  //   email_verified: true,
  //   iat: 1516239022,           // 発行時刻
  //   exp: 1516242622            // 有効期限
  // }
}
```

**joseの特徴**

| 特徴 | 説明 |
|------|------|
| Web標準 | Web Crypto API使用 |
| エッジ対応 | Node.js crypto不要 |
| 軽量 | バンドルサイズ小さい |
| 型安全 | TypeScriptサポート |

---

## HonoでのClerk JWT検証ミドルウェア実装

### Authorizationヘッダーからトークン取得

```typescript
// src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HTTPException } from 'hono/http-exception';

interface Bindings {
  CLERK_JWKS_URL: string;
  CLERK_ISSUER: string;
}

interface Variables {
  userId: string;
  userEmail: string;
}

// JWKSクライアント（グローバルにキャッシュ）
let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(url: string) {
  if (!jwksClient) {
    jwksClient = createRemoteJWKSet(new URL(url));
  }
  return jwksClient;
}

export const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  // 1. Authorizationヘッダーからトークン取得
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid Authorization header' });
  }
  
  const token = authHeader.slice(7); // "Bearer "を除去
  
  try {
    // 2. JWT検証
    const { payload } = await jwtVerify(token, getJWKS(c.env.CLERK_JWKS_URL), {
      issuer: c.env.CLERK_ISSUER
    });
    
    // 3. 必要な情報をコンテキストに保存
    c.set('userId', payload.sub as string);
    c.set('userEmail', payload.email as string);
    
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid token' });
  }
  
  await next();
});
```

---

## ミドルウェアの使い方

```typescript
// src/index.ts
import { Hono } from 'hono';
import { authMiddleware } from './middleware/auth';

const app = new Hono<{ 
  Bindings: Bindings;
  Variables: Variables;
}>();

// 認証不要のエンドポイント
app.get('/public', (c) => c.json({ message: 'Public endpoint' }));

// 認証が必要なエンドポイント
app.use('/api/*', authMiddleware);

app.get('/api/profile', async (c) => {
  // ミドルウェアで検証済みのユーザー情報
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');
  
  // userIdは型安全！（string型として保証されている）
  const user = await db.select().from(users).where(eq(users.clerkId, userId));
  
  return c.json({
    userId,
    userEmail,
    profile: user[0]
  });
});

// 特定のルートだけ認証
app.post('/api/posts', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const post = await db.insert(posts).values({
    ...body,
    userId
  }).returning();
  
  return c.json(post, 201);
});
```

---

## フロントエンドからのAPI呼び出し

### getToken() でClerkトークン取得

```typescript
// フロントエンド（React）
import { useAuth } from '@clerk/clerk-react';

function UserProfile() {
  const { getToken, userId } = useAuth();
  
  const fetchProfile = async () => {
    // Clerk JWTを取得
    const token = await getToken();
    
    // APIリクエスト
    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`  // ここにJWTを乗せる
      }
    });
    
    if (!response.ok) {
      throw new Error('Unauthorized');
    }
    
    const data = await response.json();
    return data;
  };
  
  // ...
}
```

### APIクライアントでの実装

```typescript
// lib/api.ts
import { useAuth } from '@clerk/clerk-react';

export function useApiClient() {
  const { getToken } = useAuth();
  
  return {
    async fetch(url: string, options: RequestInit = {}) {
      const token = await getToken();
      
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  };
}

// 使用例
const api = useApiClient();
const response = await api.fetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify({ title: 'Hello', content: 'World' })
});
```

---

## ユーザー情報をD1に同期する（Webhook）

### Clerkのuser.created WebhookをHonoで受け取る

```typescript
// src/webhooks/clerk.ts
import { Hono } from 'hono';
import { verifyWebhook } from '@clerk/clerk-sdk-node';
import { users } from '../db/schema';

const webhookApp = new Hono();

webhookApp.post('/clerk', async (c) => {
  // 1. Webhook署名を検証（セキュリティ）
  const payload = await c.req.json();
  const headers = c.req.header();
  
  // ClerkのWebhook検証
  const evt = await verifyWebhook(payload, headers);
  
  // 2. イベントタイプで分岐
  switch (evt.type) {
    case 'user.created': {
      const { id, email_addresses, first_name, last_name } = evt.data;
      
      // D1にユーザー情報を保存
      await db.insert(users).values({
        clerkId: id,
        email: email_addresses[0]?.email_address,
        firstName: first_name,
        lastName: last_name,
        createdAt: new Date()
      });
      
      console.log(`User created: ${id}`);
      break;
    }
    
    case 'user.updated': {
      const { id, first_name, last_name } = evt.data;
      
      await db
        .update(users)
        .set({
          firstName: first_name,
          lastName: last_name,
          updatedAt: new Date()
        })
        .where(eq(users.clerkId, id));
      
      console.log(`User updated: ${id}`);
      break;
    }
    
    case 'user.deleted': {
      const { id } = evt.data;
      
      await db
        .delete(users)
        .where(eq(users.clerkId, id));
      
      console.log(`User deleted: ${id}`);
      break;
    }
  }
  
  return c.json({ success: true });
});

export default webhookApp;
```

---

## Webhookの設定

### Clerkダッシュボード

```
Clerk Dashboard → Webhooks → Add Endpoint

Endpoint URL: https://your-api.workers.dev/webhooks/clerk
Events:
  ☑️ user.created
  ☑️ user.updated
  ☑️ user.deleted

Signing Secret: 
（Webhook検証に使用）
```

### wrangler.toml

```toml
[vars]
CLERK_JWKS_URL = "https://clerk.your-app.com/.well-known/jwks.json"
CLERK_ISSUER = "https://clerk.your-app.com"

# Webhook署名検証用（シークレット）
[[secrets]]
CLERK_WEBHOOK_SECRET = "whsec_..."
```

---

## ハンズオン：認証付きAPIエンドポイントを実装する

### ステップ1: 環境変数設定

```bash
# .dev.vars（ローカル開発用）
CLERK_JWKS_URL=https://clerk.your-app.com/.well-known/jwks.json
CLERK_ISSUER=https://clerk.your-app.com
```

```toml
# wrangler.toml
[vars]
CLERK_JWKS_URL = "https://clerk.your-app.com/.well-known/jwks.json"
CLERK_ISSUER = "https://clerk.your-app.com"
```

### ステップ2: 認証ミドルウェア

```typescript
// src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HTTPException } from 'hono/http-exception';

let jwks: ReturnType<typeof createRemoteJWKSet>;

export const authMiddleware = createMiddleware<{
  Bindings: { CLERK_JWKS_URL: string; CLERK_ISSUER: string };
  Variables: { userId: string };
}>(async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    throw new HTTPException(401);
  }
  
  const token = auth.slice(7);
  
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(c.env.CLERK_JWKS_URL));
  }
  
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: c.env.CLERK_ISSUER
    });
    c.set('userId', payload.sub as string);
  } catch {
    throw new HTTPException(401);
  }
  
  await next();
});
```

### ステップ3: 保護されたエンドポイント

```typescript
// src/index.ts
import { Hono } from 'hono';
import { authMiddleware } from './middleware/auth';
import { posts } from './db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// 認証が必要なエンドポイント
app.use('/api/*', authMiddleware);

// 自分の投稿一覧
app.get('/api/my-posts', async (c) => {
  const userId = c.get('userId');
  
  const myPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt));
  
  return c.json(myPosts);
});

// 新規投稿（認証必須）
app.post('/api/posts', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  const [post] = await db
    .insert(posts)
    .values({
      ...body,
      userId
    })
    .returning();
  
  return c.json(post, 201);
});

export default app;
```

---

## まとめ・次回予告

### 今日学んだこと

1. ClerkがJWTを発行 → フロントエンドで取得
2. JWT = Header.Payload.Signature（3パーツ構造）
3. Base64URLでエンコード（中身は誰でも見られる）
4. 署名で改ざんを検知
5. HS256（対称）vs RS256（非対称）
6. RS256: Clerkが秘密鍵で署名、誰でも公開鍵で検証
7. JWKS: 公開鍵の配布エンドポイント
8. joseライブラリ: createRemoteJWKSet / jwtVerify
9. Honoミドルウェア: Authorization → JWT検証 → c.set()
10. フロントエンド: getToken() → Bearerヘッダー
11. Webhook: user.created → D1同期

### 次回予告: B-6 Integration

**「Hono RPC / Type Sharing / Deployment」**

- Hono RPCで型共有
- フロントエンドとバックエンドの型統一
- Cloudflare Workersデプロイ
- CI/CDパイプライン

**次回もお楽しみに！**

---

## 参考リンク

- [Clerk Documentation](https://clerk.com/docs)
- [JWT.io](https://jwt.io/) - JWTデバッガー
- [jose Library](https://github.com/panva/jose)
- [RFC 7517 - JWK](https://tools.ietf.org/html/rfc7517)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
