---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# F-6: Authentication (Frontend)

## Clerk Integration / Middleware

---

## Clerk の設定

```typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();
```

---

## JWT の使用

- トークンベース認証
- LocalStorage ではなく Cookie
- Secure / HttpOnly

---

## ※ JWT の正体は B-5 で明かす

→ Next: B-1 Foundation
