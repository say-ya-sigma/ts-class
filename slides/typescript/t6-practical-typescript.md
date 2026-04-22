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

## ESModulesの実践

### named export vs default export

```typescript
// ✅ named export（推奨）
export function add(a: number, b: number): number {
  return a + b;
}

export const PI = 3.14;

// インポート側
import { add, PI } from './math';
import { add as sum } from './math';  // リネームも可能
```

```typescript
// ⚠️ default export
export default function add(a: number, b: number): number {
  return a + b;
}

// インポート側
import add from './math';           // 名前は自由
import sum from './math';           // 同じものなのに名前が違う！
import calculate from './math';     // 何をインポートしてるか分からない
```

### 「default exportを避ける」という現代の流儀

```typescript
// ❌ default exportの問題
// file1.ts
export default function process() { }

// file2.ts
import process from './file1';  // 補完が効きにくい
import doSomething from './file1';  // 同じものを違う名前で呼ぶ

// リファクタリング時に検索しにくい
// 「process」で検索しても「doSomething」がヒットしない
```

**理由:**
- リネームが自由になって名前の一貫性が失われる
- IDEの補完・リファクタリングが効きにくい
- グレプ検索が困難

---

## re-export でindex.tsを作るパターン

```typescript
// components/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';

// 使用側
import { Button, Card, Input } from './components';
// 個別にimportしなくてOK
```

```typescript
// utils/index.ts
export * from './date';
export * from './string';
export { default as formatCurrency } from './currency';  // defaultもre-export可

// 使用側
import { formatDate, formatCurrency } from './utils';
```

---

## import type: 型だけインポートする

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

```typescript
// ❌ 通常のimport（問題あり）
import { User } from './types';
// 値としてもインポートしている扱い

// コンパイル後
import { User } from './types';
// 不要なインポートが残る
```

**メリット:**
- バンドルサイズ削減
- 循環参照の防止
- 意図が明確

---

## .d.ts ファイルとは

### 「型定義ファイル」: JSに型情報を付与する

```typescript
// math.d.ts（型定義ファイル）
export function add(a: number, b: number): number;
export function subtract(a: number, b: number): number;
export const PI: number;

// 実装はない！型情報だけ
```

```javascript
// math.js（実装ファイル）
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export const PI = 3.14;
```

### .d.ts はJSとして実行されない・型情報だけ

```
コンパイル時:
┌─────────────┐
│  .d.ts ファイル │ ← 型チェックに使用
│  （型情報のみ）  │
└─────────────┘
       │
       ▼
┌─────────────┐
│  .js ファイル  │ ← ランタイムで実行
│  （実装）      │
└─────────────┘
```

---

## @types エコシステム

### DefinitelyTyped: コミュニティが作る型定義の宝庫

```bash
# npm install -D @types/xxx
npm install -D @types/react
npm install -D @types/node
npm install -D @types/lodash
npm install -D @types/jest
```

```
DefinitelyTyped
├── @types/react
├── @types/node
├── @types/lodash
├── @types/express
└── ... (8000+ パッケージ)

https://github.com/DefinitelyTyped/DefinitelyTyped
```

### 「型定義がないライブラリ」どうするか

```typescript
// 型定義がないライブラリを使う場合

// 1. declare module で簡易的に型を定義
declare module 'legacy-library' {
  export function process(data: any): any;
  export const version: string;
}

// 2. 型定義ファイルを作成（types/legacy-library.d.ts）
// my-app/types/legacy-library.d.ts

declare module 'legacy-library' {
  export interface Config {
    apiKey: string;
    timeout?: number;
  }
  
  export function initialize(config: Config): void;
  export function fetchData<T>(url: string): Promise<T>;
}
```

---

## 型のみのimportとesbuildの相性

### import type を使うべき理由（esbuildでの除去）

```typescript
// ✅ 推奨: import type
import type { User } from './types';
import { createUser } from './utils';

// esbuildによるバンドル後:
// import typeは完全に削除される
// import { createUser } from './utils';
```

```typescript
// ❌ 避けるべき: 通常のimport
import { User, createUser } from './types';

// esbuildによるバンドル後:
// Userも含まれてしまう（tree shaking次第）
```

### verbatimModuleSyntax オプション

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
    // import type を強制する
  }
}
```

```typescript
// verbatimModuleSyntax: true の場合
import { User } from './types';
// ❌ エラー: 'User' is a type and must be imported using a type-only import

import type { User } from './types';
// ✅ OK
```

---

## Conditional Types（紹介だけ）

### T extends U ? X : Y の形式

```typescript
//「型の三項演算子」という直感

type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">;  // true
type B = IsString<123>;       // false
type C = IsString<string>;    // true
```

### 実務では稀だがライブラリコードで頻出

```typescript
// NonNullableの実装（実はConditional Type）
type MyNonNullable<T> = T extends null | undefined ? never : T;

type A = MyNonNullable<string | null>;  // string
type B = MyNonNullable<string>;         // string
```

```typescript
// Parametersの実装
type MyParameters<T extends (...args: any) => any> = 
  T extends (...args: infer P) => any ? P : never;

function greet(name: string, age: number) { }
type Params = MyParameters<typeof greet>;  // [string, number]
```

---

## Template Literal Types（紹介だけ）

### \`on${Capitalize<string>}\` のような型

```typescript
// 文字列リテラルを型として扱う
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<"click">;     // "onClick"
type HoverEvent = EventName<"hover">;     // "onHover"
```

### イベント名やCSSプロパティ名に使われる

```typescript
// Reactのイベントハンドラー型
type ReactEventHandlers = {
  onClick: () => void;
  onHover: () => void;
  onFocus: () => void;
  // ...
};

// CSSプロパティ型（実際のものより簡略化）
type CSSProperty = `${string}px` | `${string}em` | `${string}%`;
const width1: CSSProperty = "100px";  // ✅
const width2: CSSProperty = "50%";    // ✅
const width3: CSSProperty = 100;      // ❌
```

---

## 「TSらしいコード」とは何か（総括）

### anyを使わない

```typescript
// ❌ anyの乱用
function process(data: any): any {
  return data.value;
}

// ✅ 具体的な型を使う
interface Data {
  value: string;
}

function process(data: Data): string {
  return data.value;
}

// ✅ unknown + Type Narrowing
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

### 型推論に任せる / 必要なところだけ書く

```typescript
// ❌ 過剰な型注釈
const name: string = "Alice";
const user: User = { name: "Alice", age: 30 };

// ✅ 型推論に任せる
const name = "Alice";
const user = { name: "Alice", age: 30 };

// ✅ 明示的に書く必要がある場面
function greet(name: string): string { }
let value: string | null = null;
```

---

### 「型は設計図」: 型を書くことがそのまま設計になる

```typescript
// 型を書く = 設計をする
interface User {
  id: string;           // IDはstring
  name: string;         // 名前はstring
  email: string;        // メールはstring
  role: "admin" | "user";  // ロールは決まった値のみ
  createdAt: Date;      // 作成日はDate型
}

// この型が実装を導く
function createUser(data: Omit<User, "id" | "createdAt">): User {
  // 実装
}
```

### コンパイルエラーを友達にする

```typescript
// ❌ エラーを無視
// @ts-ignore
user.nmae;  // タイプミスに気づかない

// ✅ エラーを解決する
user.name;  // ✅
```

**「赤い波線は味方」**
- コンパイルエラーはバグの早期発見
- 無視するより修正する

---

## F/Bシリーズで使うTSパターンの予告

### Fで使う: Frontendパターン

```typescript
// 1. Interface Segregation（小さく分割）
interface UserDisplayProps {
  name: string;
  avatar: string;
}

interface UserActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

// 2. Discriminated Union（状態管理）
type AsyncState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

// 3. Generic Component（再利用）
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
}
```

### Bで使う: Backendパターン

```typescript
// 1. Branded Types（型安全なID）
type UserId = string & { __brand: "UserId" };
type PostId = string & { __brand: "PostId" };

function getUser(id: UserId) { }
getUser("user-123" as UserId);     // ✅
getUser("post-123" as PostId);     // ❌ エラー

// 2. 関数型パターン
const validateInput = (input: unknown): ValidationResult<Input> => { }
const transformData = (input: Input): TransformedData => { }
const saveToDB = (data: TransformedData): Promise<void> => { }

// 3. Zod infer（スキーマから型を生成）
const UserSchema = z.object({ name: z.string() });
type User = z.infer<typeof UserSchema>;
```

---

## よくある「TSのハマりポイント」集

### as でキャストしすぎる

```typescript
// ❌ as の乱用
const user = data as User;  // 型安全が破壊される

// ✅ Type Guardを使う
function isUser(data: unknown): data is User {
  return (
    typeof data === "object" &&
    data !== null &&
    "name" in data &&
    typeof (data as User).name === "string"
  );
}

if (isUser(data)) {
  // ここではdataはUser型
  console.log(data.name);
}
```

### ! (Non-null assertion) の乱用

```typescript
// ❌ ! の乱用
const element = document.getElementById("app")!;
// nullの可能性を無視

// ✅ 安全な方法
const element = document.getElementById("app");
if (element) {
  element.innerHTML = "Hello";
}

// ✅ またはOptional Chaining
const text = document.getElementById("app")?.innerHTML ?? "Default";
```

---

### object型とRecord型の混同

```typescript
// ❌ object型（非推奨）
function process(data: object) {
  // プロパティアクセスができない
  console.log(data.value);  // ❌ エラー
}

// ✅ Record型
function process(data: Record<string, unknown>) {
  console.log(data.value);  // ✅ OK
}

// ✅ またはインターフェース
interface Data {
  value: string;
}
function process(data: Data) {
  console.log(data.value);  // ✅ OK
}
```

### enumを使ってしまう（const assertionで代替できる）

```typescript
// ❌ enum（非推奨）
enum Status {
  Active = "active",
  Inactive = "inactive"
}

// ✅ const assertion（推奨）
const Status = {
  Active: "active",
  Inactive: "inactive"
} as const;

type Status = typeof Status[keyof typeof Status];
// "active" | "inactive"
```

**理由:**
- enumはTS独自の構文（JSにはない）
- 型安全性が低い（双方向マッピング）
- const assertionの方が軽量

---

## 実力チェック：型クイズ（演習）

### クイズ1: この型は何型？

```typescript
type A = string | number;
type B = A extends string ? true : false;
```

<details>
<summary>答え</summary>

```typescript
// B は false
// A = string | number は string のサブタイプではない
```

</details>

### クイズ2: このコードはエラーになるか？

```typescript
interface User {
  name: string;
  age?: number;
}

const user: Required<User> = {
  name: "Alice"
};
```

<details>
<summary>答え</summary>

```typescript
// ❌ エラー
// Required<User> は age も必須になる
```

</details>

### クイズ3: 型を完成させて

```typescript
// T のキー K の値の型を取得する型を作れ
type GetValue<T, K extends keyof T> = ???;

interface User {
  name: string;
  age: number;
}

type NameType = GetValue<User, "name">;  // string
type AgeType = GetValue<User, "age">;    // number
```

<details>
<summary>答え</summary>

```typescript
type GetValue<T, K extends keyof T> = T[K];
```

</details>

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

**TypeScriptの本質:**
- 型は設計図
- 型推論と明示的な型注釈のバランス
- コンパイルエラーを味方にする

---

## F/Bシリーズへの接続説明

### これから始まるシリーズ

```
Tシリーズ（基礎）
    ↓
┌─────────────┐     ┌─────────────┐
│  Fシリーズ   │     │  Bシリーズ   │
│  Frontend   │     │  Backend    │
│             │     │             │
│ ・Next.js   │     │ ・Hono      │
│ ・React     │     │ ・Drizzle   │
│ ・TanStack  │     │ ・D1        │
│ ・Clerk     │     │ ・Zod       │
└─────────────┘     └─────────────┘
         │                   │
         └─────────┬─────────┘
                   ▼
           フルスタック開発
```

### Tシリーズで学んだ知識が基盤に

- **型安全性** → F/B両方で活用
- **Generics** → Reactコンポーネント、APIクライアント
- **Discriminated Union** → 状態管理、APIレスポンス
- **Utility Types** → Props変換、DBスキーマ変換

**次はF-1（Frontend基礎）から始まります！**

---

## 参考リンク

- [TypeScript Handbook - Modules](https://www.typescriptlang.org/docs/handbook/modules.html)
- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [DefinitelyTyped](https://definitelytyped.org/)
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [TypeScript ES Modules](https://www.typescriptlang.org/docs/handbook/esm-node.html)
