---
marp: true
theme: ./../themes/modern.css
paginate: true
---

<!-- _class: title -->

# P-4: Genericsの応用
## 実際のAPIでGenericsを型安全に

---

## ゴール

**実際のAPIデータでGenericsの応用を学ぶ**

```bash
npm run generics
```

---

## fetchData<T>

基本のGenerics関数

```typescript
const user = await fetchData<User>(url);
```

```json
{"id":1,"name":"Leanne Graham","username":"Bret"}
```

---

## fetchResource<T>

制約付きGenerics

```typescript
const user = await fetchResource<User>('users', 1);
```

```json
{"id":1,"name":"Leanne Graham"}
```

---

## fetchMultiple<T>

可変長引数 + Generics

```typescript
const users = await fetchMultiple<User>('users', 1, 2, 3);
```

```json
[{"id":1,"name":"..."},{"id":2,"name":"..."},{"id":3,"name":"..."}]
```

---

## fetchTypedResource<K>

キーから型を自動推論

```typescript
const user = await fetchTypedResource('users', 1); // User型
const post = await fetchTypedResource('posts', 1); // Post型
```

---

## ApiRepository<T>

型安全なリポジトリ

```typescript
class ApiRepository<T> {
  async findAll(): Promise<Result<T[]>>;
  async findById(id: number): Promise<Result<T>>;
}
```

---

## findAllWithTransform<R>

コールバック + Generics

```typescript
const summaries = await userRepo.findAllWithTransform((u) => ({id: u.id, name: u.name}));
```

```json
[{"id":1,"name":"Leanne Graham"},...]
```

---

## まとめ

| 関数 | Generics |
|------|----------|
| fetchData<T> | T |
| fetchResource<T> | T extends ApiResource |
| fetchMultiple<T> | T extends ApiResource |
| fetchTypedResource<K> | K extends ResourceType |
| ApiRepository<T> | T extends ApiResource |
| findAllWithTransform<R> | R |

---

**次**: `npm run guard`
