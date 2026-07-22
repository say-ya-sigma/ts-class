---
marp: true
theme: ./../themes/modern.css
paginate: true
---

<!-- _class: title -->

# P-2: Object型の応用
## 実際のAPIでオブジェクト操作を型安全に

---

## ゴール

**実際のAPIデータで型安全なオブジェクト操作を学ぶ**

```bash
npm run object
```

---

## pick<T,K>

特定キーを抽出

```typescript
const summary = pick(user, ['id', 'name', 'email']);
```

```json
{"id":1,"name":"Leanne Graham","email":"..."}
```

---

## omit<T,K>

特定キーを除外

```typescript
const without = omit(user, ['company', 'address']);
```

```json
{"id":1,"name":"Leanne Graham","username":"Bret"}
```

---

## merge<T,U>

オブジェクトのマージ

```typescript
const merged = merge({id:1,name:'A'},{score:95});
```

```json
{"id":1,"name":"A","score":95}
```

---

## keysToCamelCase<T>

snake_case → camelCase

```typescript
const camel = keysToCamelCase({user_id:1,first_name:'John'});
```

```json
{"userId":1,"firstName":"John"}
```

---

## associateUserWithPosts

オブジェクトの関連付け

```typescript
const usersWithPosts = associateUserWithPosts(users, posts);
```

```json
[{"id":1,"name":"...","postCount":10},...]
```

---

## まとめ

| 関数 | 戻り値 |
|------|--------|
| pick | Pick<T,K> |
| omit | Omit<T,K> |
| merge | T & U |
| keysToCamelCase | CamelCase<T> |
| associateUserWithPosts | UserWithPosts[] |

---

**次**: `npm run union`
