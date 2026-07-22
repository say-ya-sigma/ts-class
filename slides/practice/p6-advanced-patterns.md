---
marp: true
theme: ./../themes/modern.css
paginate: true
---

<!-- _class: title -->

# P-6: 高度な型操作
## Partial, infer, テンプレートリテラル型, 再帰型

---

## ゴール

**実際のAPIデータで高度な型操作を学ぶ**

```bash
npm run advanced
```

---

## Nullable, Optional

```typescript
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
```

```typescript
const nullableValues: Nullable<number>[] = [1, null, 2, null, 3];
const compacted = compact(nullableValues);
```

```json
[1,2,3]
```

---

## Partial, Pick, Omit

```typescript
type PartialUser = Partial<User>;
type RequiredFields = Pick<User, 'id' | 'name'>;
type UserWithoutCompany = Omit<User, 'company'>;
```

```json
// Partial<User>
{"name":"Partial User"}

// Pick<User, "id" | "name">
{"id":1,"name":"Leanne Graham"}
```

---

## Record, infer

```typescript
const userById: Record<number, User> = {};
```

```typescript
type ElementType<T> = T extends (infer U)[] ? U : never;
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

---

## CamelCase<S>

テンプレートリテラル型

```typescript
type CamelCase<S> = S extends `${infer P}_${infer Q}` ? `${P}${Capitalize<CamelCase<Q>>}` : S;
```

```typescript
const camel = keysToCamelCase({user_id:1,first_name:'John'});
```

```json
{"userId":1,"firstName":"John"}
```

---

## JSONValue

再帰型

```typescript
type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject { [key: string]: JSONValue; }
interface JSONArray extends Array<JSONValue> {}
```

---

## まとめ

| 型 | 用途 |
|-----|------|
| Nullable<T> | null許容 |
| Partial<T> | すべてOptional |
| Pick<T,K> | 特定キー抽出 |
| Record<K,T> | オブジェクト型付け |
| infer | 型推論 |
| CamelCase<S> | 文字列変換 |
| JSONValue | 入れ子オブジェクト |

---

**次**: `npm run all`
