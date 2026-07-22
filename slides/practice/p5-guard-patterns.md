---
marp: true
theme: ./../themes/modern.css
paginate: true
---

<!-- _class: title -->

# P-5: 型ガード関数
## Union型を絞り込む型安全な手法

---

## ゴール

**実際のAPIデータで型ガード関数を学ぶ**

```bash
npm run guard
```

---

## 型ガード関数

```typescript
function isUser(r: ApiResource): r is User {
  return 'username' in r && 'company' in r;
}
function isPost(r: ApiResource): r is Post {
  return 'userId' in r && 'title' in r && !('email' in r);
}
```

---

## 型ガードの結果

```typescript
const maybeUser: ApiResource = users[0];
if (isUser(maybeUser)) {
  console.log(maybeUser.username); // OK
}
```

```json
{"isUser":true,"username":"Bret","email":"..."}
```

---

## 配列フィルタリング

```typescript
const onlyUsers = mixed.filter(isUser);
const onlyPosts = mixed.filter(isPost);
```

```json
// isUser
[{"id":1,"name":"Leanne Graham","username":"Bret"},...]

// isPost
[{"id":1,"title":"..."},...]
```

---

## カスタム型ガード

```typescript
function hasEmail<T>(r: T): r is T & {email: string} {
  return typeof (r as any).email === 'string';
}
const emailHolders = mixed.filter(hasEmail);
```

---

## まとめ

| 型ガード | 判定 |
|----------|------|
| isUser | username + company |
| isPost | userId + title + body |
| isComment | postId + email |
| isAlbum | userId + title |

---

**次**: `npm run advanced`
