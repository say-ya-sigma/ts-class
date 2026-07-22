---
marp: true
theme: ./../themes/modern.css
paginate: true
---

<!-- _class: title -->

# P-7: .d.ts + まとめ
## 型定義ファイルと7パターンの総復習

---

## ゴール

**型定義ファイル（.d.ts）の活用と総復習**

```bash
npm run all
```

---

## .d.tsとは

**実装を含まず、型情報のみを記述**

```typescript
// types/api.d.ts
// 実装なし！型定義のみ
```

---

## namespace

外部APIの型定義

```typescript
declare namespace JsonPlaceholderAPI {
  interface User { id: number; name: string; }
  interface Post { userId: number; id: number; title: string; }
  type Resource = User | Post;
}
```

---

## declare global

グローバル型の拡張

```typescript
declare global {
  interface Window {
    myApp: { version: string; apiUrl: string; };
  }
}
```

---

## 関数オーバーロード

```typescript
declare function fetchResource(type: 'users', id: number): Promise<User>;
declare function fetchResource(type: 'posts', id: number): Promise<Post>;
```

---

## マッピング型

```typescript
declare type Partial<T> = { [P in keyof T]?: T[P]; };
declare type Pick<T, K> = { [P in K]: T[P]; };
declare type Record<K, T> = { [P in K]: T; };
```

---

## 条件付き型

```typescript
declare type ElementType<T> = T extends (infer U)[] ? U : never;
declare type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

---

## テンプレートリテラル型

```typescript
declare type EventName<T extends string> = `on${Capitalize<T>}`;
declare type APIEndpoint = `/api/${string}`;
```

---

## 再帰型

```typescript
declare type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject { [key: string]: JSONValue; }
interface JSONArray extends Array<JSONValue> {}
```

---

## 7パターンのコマンド

```bash
npm run array      # pluck, sortBy, paginate, groupBy, unique, flatten
npm run object     # pick, omit, merge, keysToCamelCase, associate
npm run union      # Result<T,E>, ApiResource, classifyResources
npm run generics   # fetchData<T>, fetchResource<T>, ApiRepository<T>
npm run guard      # isUser, isPost, isComment, isAlbum
npm run advanced   # Partial<T>, Pick<T,K>, infer, CamelCase<S>
npm run all        # すべてのパターンをまとめてJSON出力
```

---

## 総まとめ

| # | パターン | キーワード |
|---|----------|------------|
| 1 | Array | pluck, sortBy, paginate, groupBy, unique, flatten |
| 2 | Object | pick, omit, merge, keysToCamelCase, associate |
| 3 | Union | Result<T,E>, ApiResource, classifyResources |
| 4 | Generics | fetchData<T>, fetchResource<T>, ApiRepository<T> |
| 5 | Guard | isUser, isPost, isComment, isAlbum |
| 6 | Advanced | Partial<T>, Pick<T,K>, infer, CamelCase<S> |
| 7 | .d.ts | namespace, declare global, declare function |

---

**実行して確認しよう！**
