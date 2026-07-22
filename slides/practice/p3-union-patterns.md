---
marp: true
theme: ./../themes/modern.css
paginate: true
---

<!-- _class: title -->

# P-3: Union型の応用
## 実際のAPIでUnion型を型安全に

---

## ゴール

**実際のAPIデータでUnion型の応用を学ぶ**

```bash
npm run union
```

---

## Result<T,E>

成功・失敗のUnion型

```typescript
type Result<T,E> = {success:true;data:T} | {success:false;error:E};
```

```json
{"success":true,"data":{"id":1,"name":"..."}}
```

---

## ApiResource

複数型のUnion型

```typescript
type ApiResource = User | Post | Comment | Album;
```

```json
[{"type":"User","id":1,"name":"..."}, {"type":"Post","id":1,"title":"..."}]
```

---

## classifyResources

型ガードで分類

```typescript
const classified = classifyResources(mixed);
```

```json
{"users":[...],"posts":[...],"comments":[...],"albums":[...]}
```

---

## WithUserId<T>

条件付き型

```typescript
type WithUserId<T> = T extends {userId:number} ? T : never;
```

```typescript
const userPosts = filterByUserId(posts, 1);
```

---

## まとめ

| 型 | 用途 |
|-----|------|
| Result<T,E> | 成功・失敗 |
| ApiResource | 異なる型の混在 |
| ResourceType | 文字列の制限 |
| classifyResources | Union型を分類 |
| WithUserId<T> | 条件付き型 |

---

**次**: `npm run generics`
