---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# T-6: 実践TypeScript
## モジュール・型定義・F/Bへの橋渡し

---

## この授業のゴール（Tシリーズの総括）

**実際のプロジェクトで「TSらしいコード」を書くための最終仕上げ**

- ESModulesの実践的な使い方
- 型定義ファイル（.d.ts）
- @typesエコシステム
- TypeScriptの高度な型（紹介）
- 「TSらしいコード」とは何か
- F/Bシリーズで使うTSパターンの予告

---

## named export（推奨）

```typescript
// ✅ named export
export function add(a: number, b: number): number {
  return a + b;
}
export const PI = 3.14;
// インポート側
import { add, PI } from './math';
import { add as sum } from './math'; // リネームも可能
```

---

## default export（避ける）

```typescript
// ⚠️ default export
export default function add(a: number, b: number): number {
  return a + b;
}
// インポート側
import add from './math';      // 名前は自由
import sum from './math';      // 同じものなのに名前が違う！
import calculate from './math'; // 何をインポートしてるか分からない
```

---

## default exportを避ける理由

```typescript
// ❌ 補完が効きにくい、リファクタリングも困難
import process from './file1';
import doSomething from './file1'; // 同じものを違う名前で呼ぶ
```

- リネームが自由で名前の一貫性が失われる
- IDEの補完・リファクタリングが効きにくい
- グレプ検索が困難

---

## 基本的なre-export

```typescript
// components/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
// 使用側
import { Button, Card, Input } from './components';
```

---

## バレル（barrel）パターン

```typescript
// utils/index.ts
export * from './date';
export * from './string';
export { default as formatCurrency } from './currency';
// 使用側
import { formatDate, formatCurrency } from './utils';
```

---

## import type の例

```typescript
// ✅ import type（推奨）
import type { User } from './types';
function processUser(user: User) {
  // User型のみ使用、値は使わない
}
// コンパイル後（JS）
// import文が消える
function processUser(user) { }
```

---

## 通常のimportとの違い

```typescript
// ❌ 通常のimport（問題あり）
import { User } from './types';
// コンパイル後: import { User } from './types';
// 不要なインポートが残る
```

**メリット:** バンドルサイズ削減、循環参照防止、意図が明確

---

## 型定義ファイル

```typescript
// math.d.ts（型定義ファイル）
export function add(a: number, b: number): number;
export function subtract(a: number, b: number): number;
export const PI: number;
// 実装はない！型情報だけ
```

---

## 実装ファイルとの関係

```javascript
// math.js（実装ファイル）
export function add(a, b) { return a + b; }
export const PI = 3.14;
```

---

## .d.ts の役割

```
   compile-time             runtime
   ┌─────────────┐      ┌─────────────┐
   │   .d.ts     │ ---> │     .js     │
   │  type info  │      │    code     │
   └─────────────┘      └─────────────┘
```

---

## DefinitelyTyped

```bash
npm install -D @types/react
npm install -D @types/node
npm install -D @types/lodash
npm install -D @types/jest
```

---

## DefinitelyTypedの構造

```text
DefinitelyTyped
├── @types/react
├── @types/node
├── @types/lodash
├── @types/express
└── ... (8000+ パッケージ)
```

---

## 型定義がないライブラリの対処 1

```typescript
// declare module で簡易的に型を定義
declare module 'legacy-library' {
  export function process(data: any): any;
  export const version: string;
}
```

---

## 型定義がないライブラリの対処 2

```typescript
// my-app/types/legacy-library.d.ts
declare module 'legacy-library' {
  export interface Config { apiKey: string; timeout?: number; }
  export function initialize(config: Config): void;
  export function fetchData<T>(url: string): Promise<T>;
}
```

---

## import type を使うべき理由

```typescript
// ✅ 推奨: import type
import type { User } from './types';
import { createUser } from './utils';
// esbuild: import typeは完全に削除される
// import { createUser } from './utils'; のみ残る
```

---

## 通常のimportの問題

```typescript
// ❌ 避けるべき: 通常のimport
import { User, createUser } from './types';
// esbuild: Userも含まれてしまう（tree shaking次第）
```

---

## verbatimModuleSyntax オプション

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
    // import type を強制する
  }
}
```

---

## verbatimModuleSyntax の効果

```typescript
// ❌ エラー: 'User' is a type and must be imported using a type-only import
import { User } from './types';

// ✅ OK
import type { User } from './types';
```

---

## Conditional Types 基本形

```typescript
//「型の三項演算子」

type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">;  // true
type B = IsString<123>;      // false
type C = IsString<string>;   // true
```

---

## NonNullable

```typescript
// NonNullableの実装
type MyNonNullable<T> = T extends null | undefined ? never : T;

type A = MyNonNullable<string | null>;  // string
type B = MyNonNullable<string>;         // string
```

---

## Parameters

```typescript
// Parametersの実装
type MyParameters<T extends (...args: any) => any> = 
  T extends (...args: infer P) => any ? P : never;

function greet(name: string, age: number) { }
type Params = MyParameters<typeof greet>;  // [string, number]
```

---

## Template Literal Types 基本形

```typescript
// 文字列リテラルを型として扱う
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<"click">;  // "onClick"
type HoverEvent = EventName<"hover">;  // "onHover"
```

---

## Reactイベントハンドラー型

```typescript
// Reactのイベントハンドラー型
type ReactEventHandlers = {
  onClick: () => void;
  onHover: () => void;
  onFocus: () => void;
  // ...
};
```

---

## CSSプロパティ型

```typescript
// CSSプロパティ型
type CSSProperty = `${string}px` | `${string}em` | `${string}%`;
const width1: CSSProperty = "100px"; // ✅
const width2: CSSProperty = "50%";   // ✅
const width3: CSSProperty = 100;   // ❌
```

---

## anyを使わない

```typescript
// ❌ anyの乱用
function process(data: any): any {
  return data.value;
}
```

---

## 具体的な型を使う

```typescript
// ✅ 具体的な型を使う
interface Data { value: string; }
function process(data: Data): string {
  return data.value;
}
```

---

## unknown + Type Narrowing

```typescript
// ✅ unknown + Type Narrowing
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

---

## 型推論に任せる

```typescript
// ❌ 過剰な型注釈
const name: string = "Alice";
const user: User = { name: "Alice", age: 30 };

// ✅ 型推論に任せる
const name = "Alice";
const user = { name: "Alice", age: 30 };
```

---

## 明示的に書く必要がある場面

```typescript
// ✅ 明示的に書く必要がある場面
function greet(name: string): string { }
let value: string | null = null;
```

---

## 型は設計図

```typescript
// 型を書く = 設計をする
interface User {
  id: string;                 // IDはstring
  name: string;               // 名前はstring
  email: string;              // メールはstring
  role: "admin" | "user";    // ロールは決まった値のみ
  createdAt: Date;           // 作成日はDate型
}
```

---

## この型が実装を導く

```typescript
// この型が実装を導く
function createUser(data: Omit<User, "id" | "createdAt">): User {
  // 実装
}
```

---

## コンパイルエラーを友達にする

```typescript
// ❌ エラーを無視
// @ts-ignore
user.nmae;  // タイプミスに気づかない

// ✅ エラーを解決する
user.name;  // ✅
```

**「赤い波線は味方」**: コンパイルエラーはバグの早期発見。無視するより修正する。

---

## Frontendパターン 1: Interface Segregation

```typescript
// 小さく分割
interface UserDisplayProps { name: string; avatar: string; }
interface UserActionsProps { onEdit: () => void; onDelete: () => void; }
```

---

## Frontendパターン 2: Discriminated Union

```typescript
// 状態管理
type AsyncState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
```

---

## Frontendパターン 3: Generic Component

```typescript
// 再利用
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
}
```

---

## Backendパターン 1: Branded Types

```typescript
// 型安全なID
type UserId = string & { __brand: "UserId" };
type PostId = string & { __brand: "PostId" };
function getUser(id: UserId) { }
getUser("user-123" as UserId); // ✅
getUser("post-123" as PostId); // ❌ エラー
```

---

## Backendパターン 2: 関数型パターン

```typescript
// 関数型パターン
const validateInput = (input: unknown): ValidationResult<Input> => { }
const transformData = (input: Input): TransformedData => { }
const saveToDB = (data: TransformedData): Promise<void> => { }
```

---

## Backendパターン 3: Zod infer

```typescript
// スキーマから型を生成
const UserSchema = z.object({ name: z.string() });
type User = z.infer<typeof UserSchema>;
```

---

## as でキャストしすぎる

```typescript
// ❌ as の乱用
const user = data as User;  // 型安全が破壊される
```

---

## Type Guardを使う

```typescript
// ✅ Type Guardを使う
function isUser(data: unknown): data is User {
  return typeof data === "object" && data !== null &&
    "name" in data && typeof (data as User).name === "string";
}
if (isUser(data)) { console.log(data.name); } // ここではdataはUser型
```

---

## ! (Non-null assertion) の乱用

```typescript
// ❌ ! の乱用
const element = document.getElementById("app")!;
// nullの可能性を無視
```

---

## 安全な方法

```typescript
// ✅ 安全な方法
const element = document.getElementById("app");
if (element) { element.innerHTML = "Hello"; }

// ✅ またはOptional Chaining
const text = document.getElementById("app")?.innerHTML ?? "Default";
```

---

## object型とRecord型の混同

```typescript
// ❌ object型（非推奨）
function process(data: object) {
  console.log(data.value); // ❌ エラー
}
```

---

## Record型

```typescript
// ✅ Record型
function process(data: Record<string, unknown>) {
  console.log(data.value); // ✅ OK
}
```

---

## インターフェース

```typescript
// ✅ インターフェース
interface Data { value: string; }
function process(data: Data) {
  console.log(data.value); // ✅ OK
}
```

---

## enumを使ってしまう

```typescript
// ❌ enum（非推奨）
enum Status {
  Active = "active",
  Inactive = "inactive"
}
```

---

## const assertion（推奨）

```typescript
// ✅ const assertion（推奨）
const Status = {
  Active: "active",
  Inactive: "inactive"
} as const;
type Status = typeof Status[keyof typeof Status];
// "active" | "inactive"
```

---

## const assertion を推奨する理由

- enumはTS独自の構文（JSにはない）
- 型安全性が低い（双方向マッピング）
- const assertionの方が軽量

---

## クイズ1: この型は何型？

```typescript
type A = string | number;
type B = A extends string ? true : false;
```

---

## クイズ1: 答え

```typescript
// B は false
// A = string | number は string のサブタイプではない
```

---

## クイズ2: このコードはエラーになるか？

```typescript
interface User {
  name: string;
  age?: number;
}
const user: Required<User> = {
  name: "Alice"
};
```

---

## クイズ2: 答え

```typescript
// ❌ エラー
// Required<User> は age も必須になる
```

---

## クイズ3: 型を完成させて

```typescript
// T のキー K の値の型を取得する型を作れ
type GetValue<T, K extends keyof T> = ???;

interface User { name: string; age: number; }
type NameType = GetValue<User, "name">; // string
type AgeType = GetValue<User, "age">;   // number
```

---

## クイズ3: 答え

```typescript
type GetValue<T, K extends keyof T> = T[K];
```

---

## Tシリーズ総まとめ

### 6回の授業で学んだこと

| 回 | テーマ | キーポイント |
|---|--------|-------------|
| T-1 | なぜTypeScriptか | JSの歴史、AltJS戦争、TSの勝利 |
| T-2 | 開発環境 | Node.js、npm、TSC、バンドラー |
| T-3 | 型の基礎 | プリミティブ、any/unknown/never、配列・オブジェクト |
| T-4 | ユニオン型・Type Narrowing | 型の絞り込み、Discriminated Union |
| T-5 | Generics・Utility Types | 型パラメータ、型変換ツール |
| T-6 | 実践TypeScript | モジュール、型定義、実践的パターン |

---

## TypeScriptの本質

- 型は設計図
- 型推論と明示的な型注釈のバランス
- コンパイルエラーを味方にする

---

## これから始まるシリーズ

```
Tシリーズ（基礎）
    ↓
Pシリーズ（Practice）: Array, Object, Union, Generics, Guard, Advanced, .d.ts
    ↓
Fシリーズ（Frontend）: Next.js, React, TanStack, Clerk
Bシリーズ（Backend）:  Hono, Drizzle, D1, Zod
    ↓
       フルスタック開発
```

---

## Tシリーズで学んだ知識が基盤に

- **型安全性** → F/B両方で活用
- **Generics** → Reactコンポーネント、APIクライアント
- **Discriminated Union** → 状態管理、APIレスポンス
- **Utility Types** → Props変換、DBスキーマ変換

**次はP-1（Array型の応用）から始まります！**

---

## 参考リンク

- [TypeScript Handbook - Modules](https://www.typescriptlang.org/docs/handbook/modules.html)
- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [DefinitelyTyped](https://definitelytyped.org/)
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [TypeScript ES Modules](https://www.typescriptlang.org/docs/handbook/esm-node.html)
