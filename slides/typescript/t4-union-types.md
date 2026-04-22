---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# T-4: ユニオン型・Type Narrowing
## 現実のデータを型で表す

---

## この授業のゴール

**「この変数はAかもしれないしBかもしれない」という現実のデータをTSで扱う**

- type aliasとinterfaceの本当の違い
- ユニオン型（Union Types）
- Type Narrowing（型の絞り込み）
- Discriminated Union
- Exhaustive Check
- インターセクション型
- リテラル型

---

## type alias vs interface の本当の違い

### interface: 宣言マージができる

```typescript
// interfaceは同名で拡張できる（宣言マージ）
interface User {
  name: string;
}

interface User {  // 同じ名前！
  age: number;
}

// 結果: Userはnameとage両方を持つ
const user: User = {
  name: "Alice",
  age: 30
};
```

### type: ユニオン型・交差型が使える

```typescript
// typeはユニオン型が使える
type Status = "active" | "inactive";
type ID = string | number;

// interfaceはユニオン型を直接書けない
interface Status {  // エラー
  // "active" | "inactive" は書けない
}
```

---

### 実務的な使い分け

```typescript
// オブジェクト型ならどちらでも可
interface User {
  name: string;
  age: number;
}

type User = {
  name: string;
  age: number;
};

// ユニオン型はtype一択
type Status = "active" | "inactive" | "pending";
type Result<T> = Success<T> | Failure;

// 拡張が必要ならinterface
interface ComponentProps {
  children: React.ReactNode;
}
// ライブラリが後から拡張できる

// 推奨:
// - オブジェクト型: interface（拡張しやすい）
// - ユニオン型: type（唯一の選択）
// - 複雑な型: type（条件型、マップ型など）
```

---

## ユニオン型とは

### string | number → 「文字列か数値のどちらか」

```typescript
// 「A または B」を型で表現
type StringOrNumber = string | number;

const value1: StringOrNumber = "Hello";  // ✅
const value2: StringOrNumber = 42;        // ✅
const value3: StringOrNumber = true;      // ❌ エラー

// 関数の引数でも使える
function print(value: string | number) {
  console.log(value);
}

print("Hello");  // ✅
print(42);       // ✅
print(true);     // ❌
```

### 現実のデータは「どちらかわからない」ことが多い

```typescript
// APIレスポンスのID（文字列か数値）
type UserID = string | number;

// ユーザー入力（stringかnull）
type UserInput = string | null;

// 設定値（特定の文字列かboolean）
type ConfigValue = "auto" | "manual" | boolean;
```

---

## なぜユニオン型が必要か（具体例）

### APIレスポンスが成功か失敗か

```typescript
// 成功時のレスポンス
interface SuccessResponse {
  data: User;
  error: null;
}

// 失敗時のレスポンス
interface ErrorResponse {
  data: null;
  error: string;
}

// どちらかが返ってくる
type ApiResponse = SuccessResponse | ErrorResponse;

async function fetchUser(): Promise<ApiResponse> {
  try {
    const data = await api.get('/user');
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}
```

### ユーザーがログイン済みか未ログインか

```typescript
type User =
  | { status: "authenticated"; user: { name: string; email: string } }
  | { status: "unauthenticated"; user: null };

function greet(user: User) {
  if (user.status === "authenticated") {
    return `Hello, ${user.user.name}`;
  }
  return "Hello, Guest";
}
```

---

## Type Narrowing — TSが型を絞り込む仕組み

### 「TSはif文の中の型を理解している」

```typescript
function printValue(value: string | number) {
  // ここでは value は string | number
  
  if (typeof value === "string") {
    // ここでは value は string と絞り込まれる！
    console.log(value.toUpperCase());  // ✅ OK
  } else {
    // ここでは value は number と絞り込まれる！
    console.log(value.toFixed(2));     // ✅ OK
  }
}
```

### typeof による絞り込み

```typescript
function processValue(value: string | number | boolean) {
  if (typeof value === "string") {
    return value.length;  // stringとして安全に使える
  }
  
  if (typeof value === "number") {
    return value.toFixed(2);  // numberとして安全に使える
  }
  
  // ここでは value は boolean
  return value ? "Yes" : "No";
}
```

---

### null チェックによる絞り込み

```typescript
function greetUser(user: User | null) {
  if (user !== null) {
    // ここでは user は null でない
    return `Hello, ${user.name}`;
  }
  
  // ここでは user は null
  return "Hello, Guest";
}

// optional chainingとの組み合わせ
function getUserName(user: User | undefined): string {
  return user?.name ?? "Anonymous";
}
```

### Truthy/Falsy チェック

```typescript
function printLength(value: string | null | undefined) {
  if (value) {
    // ここでは value は string（nullとundefinedは除外される）
    console.log(value.length);
  }
}

// 注意: 空文字列 "" は falsy なので除外される
printLength("");  // 何も出力されない
```

---

## Type Narrowing の応用

### in 演算子: プロパティの存在確認

```typescript
type Cat = { name: string; meow: () => void };
type Dog = { name: string; bark: () => void };
type Animal = Cat | Dog;

function makeSound(animal: Animal) {
  if ("meow" in animal) {
    // ここでは animal は Cat
    animal.meow();
  } else {
    // ここでは animal は Dog
    animal.bark();
  }
}
```

### instanceof: クラスのインスタンス確認

```typescript
class ErrorA {
  message = "Error A";
}

class ErrorB {
  message = "Error B";
}

function handleError(error: ErrorA | ErrorB) {
  if (error instanceof ErrorA) {
    // ここでは error は ErrorA
    console.log("A:", error.message);
  } else {
    // ここでは error は ErrorB
    console.log("B:", error.message);
  }
}
```

---

### Custom Type Guard (is キーワード)

```typescript
// 独自の型ガード関数
type Fish = { swim: () => void };
type Bird = { fly: () => void };

// 戻り値の型が「パラメータ is 型」
function isFish(animal: Fish | Bird): animal is Fish {
  return (animal as Fish).swim !== undefined;
}

function move(animal: Fish | Bird) {
  if (isFish(animal)) {
    // ここでは animal は Fish と絞り込まれる
    animal.swim();
  } else {
    // ここでは animal は Bird
    animal.fly();
  }
}
```

---

## Discriminated Union（判別可能なユニオン）

### kind / type / variant などのリテラル型で区別する

```typescript
// 判別プロパティ（discriminant）を持つ
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "square"; side: number };

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // ここでは shape は { kind: "circle"; radius: number }
      return Math.PI * shape.radius ** 2;
    
    case "rectangle":
      // ここでは shape は { kind: "rectangle"; ... }
      return shape.width * shape.height;
    
    case "square":
      // ここでは shape は { kind: "square"; side: number }
      return shape.side ** 2;
  }
}
```

---

### APIレスポンスの成功/失敗パターン

```typescript
type Result<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string; code: number }
  | { status: "loading" };

async function fetchData(): Promise<Result<User>> {
  // API呼び出し
}

function handleResult(result: Result<User>) {
  switch (result.status) {
    case "success":
      console.log(result.data.name);  // User型としてアクセス可能
      break;
    
    case "error":
      console.error(result.message, result.code);
      break;
    
    case "loading":
      console.log("Loading...");
      break;
  }
}
```

---

## Exhaustive Check

### never を使って「全パターンを処理したか」を型でチェック

```typescript
type Status = "pending" | "success" | "error";

function getStatusMessage(status: Status): string {
  switch (status) {
    case "pending":
      return "処理中...";
    case "success":
      return "成功！";
    case "error":
      return "エラーが発生しました";
    default:
      // 全パターンを処理したらここには到達しない
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
  }
}

// 新しいstatusを追加した場合
// TypeScriptがコンパイルエラーを出してくれる
```

**メリット:**
- 新しいケースを追加した時に忘れにくい
- コンパイル時に検出される
- 安全性が向上

---

## strictNullChecks とnullとの戦い

### null と undefined はJSの歴史的2大罠

```javascript
// JavaScriptの問題
typeof null;        // "object" (バグ)
typeof undefined;   // "undefined"

null == undefined;  // true
null === undefined; // false
```

### strict: true でnullチェックが強制される

```typescript
// strict: true の場合
function greet(name: string | null) {
  console.log(name.toUpperCase());  // ❌ エラー!
  // Object is possibly 'null'
}

// 正しい書き方
function greet(name: string | null) {
  if (name !== null) {
    console.log(name.toUpperCase());  // ✅ OK
  }
}
```

---

### optional chaining (?.) の型との関係

```typescript
interface User {
  profile?: {
    name?: string;
  };
}

const user: User = {};

// optional chaining
const name = user?.profile?.name;
// 型: string | undefined

// nullish coalescing (??)
const displayName = user?.profile?.name ?? "Anonymous";
// 型: string
```

### nullish coalescing (??) の型との関係

```typescript
const value1 = null ?? "default";        // "default"
const value2 = undefined ?? "default";   // "default"
const value3 = 0 ?? "default";           // 0 (falsyだがnullではない)
const value4 = "" ?? "default";          // "" (falsyだがnullではない)

// 型推論
const result: string = value ?? "default";
// valueがnull/undefinedでなければその型、
// そうでなければ"default"の型
```

---

## インターセクション型（&）

### 「A かつ B」を型で表現する

```typescript
// User型とAdminプロパティを合成
type User = {
  name: string;
  email: string;
};

type AdminRole = {
  role: "admin";
  permissions: string[];
};

type AdminUser = User & AdminRole;
// {
//   name: string;
//   email: string;
//   role: "admin";
//   permissions: string[];
// }

const admin: AdminUser = {
  name: "Alice",
  email: "alice@example.com",
  role: "admin",
  permissions: ["read", "write", "delete"]
};
```

### 型の合成

```typescript
// 複数の型を組み合わせる
type Timestamp = {
  createdAt: Date;
  updatedAt: Date;
};

type SoftDelete = {
  deletedAt: Date | null;
  isDeleted: boolean;
};

type AuditableEntity = User & Timestamp & SoftDelete;
// User + タイムスタンプ + 論理削除
```

---

## リテラル型

### "active" | "inactive" | "pending"

```typescript
// 特定の文字列のみ許可
type Status = "active" | "inactive" | "pending";

const status1: Status = "active";     // ✅
const status2: Status = "deleted";    // ❌ エラー

// 関数の引数でも使える
function setStatus(status: Status) {
  // statusは必ず3つの値のどれか
}

setStatus("active");     // ✅
setStatus("deleted");    // ❌ コンパイルエラー
```

### 文字列を使った「enum的な」型表現

```typescript
// 文字列リテラル型（推奨）
type Direction = "up" | "down" | "left" | "right";

// 従来のenum
enum DirectionEnum {
  Up,
  Down,
  Left,
  Right
}

// 文字列リテラルの方が良い理由:
// 1. 型安全性が高い
// 2. デバッグしやすい（値が文字列で見える）
// 3. Tree Shakingが効く
```

---

### const assertion (as const) でリテラル型を作る

```typescript
// 通常の配列
const colors = ["red", "green", "blue"];
// 型: string[]

// const assertion
const colors = ["red", "green", "blue"] as const;
// 型: readonly ["red", "green", "blue"]
//     ^^^^^^^ リテラル型のタプル

// 用途: 設定値などで型安全に使える
type Color = typeof colors[number];
// "red" | "green" | "blue"

function setColor(color: Color) {
  // colorは3つの文字列のどれか
}

setColor("red");    // ✅
setColor("yellow"); // ❌ エラー
```

---

## ハンズオン：APIレスポンスを型で表現する

### Result<T>型を実装する

```typescript
// 成功時の型
type Success<T> = {
  ok: true;
  value: T;
};

// 失敗時の型
type Failure = {
  ok: false;
  error: string;
  code: number;
};

// Result型
type Result<T> = Success<T> | Failure;

// safeなパース関数
function safeParse<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): Result<T> {
  if (validator(data)) {
    return { ok: true, value: data };
  }
  return { ok: false, error: "Invalid data", code: 400 };
}
```

### Discriminated Unionでステータスを処理する

```typescript
// APIレスポンスの型
type ApiResponse<T> =
  | { status: 200; data: T }
  | { status: 400; error: "Bad Request"; details: string }
  | { status: 401; error: "Unauthorized" }
  | { status: 404; error: "Not Found" }
  | { status: 500; error: "Internal Server Error" };

function handleResponse<T>(response: ApiResponse<T>): T {
  switch (response.status) {
    case 200:
      return response.data;
    
    case 400:
      throw new Error(`Bad Request: ${response.details}`);
    
    case 401:
      throw new Error("Unauthorized");
    
    case 404:
      throw new Error("Not Found");
    
    case 500:
      throw new Error("Internal Server Error");
    
    default:
      const _exhaustiveCheck: never = response;
      throw new Error(`Unknown status: ${_exhaustiveCheck}`);
  }
}
```

---

## まとめ・次回予告

### 今日学んだこと

1. ✅ interfaceは拡張可能、typeはユニオン型が使える
2. ✅ ユニオン型で「AまたはB」を表現
3. ✅ Type Narrowingで型を絞り込む
4. ✅ typeof/in/instanceof/isで絞り込み
5. ✅ Discriminated Unionで構造的な区別
6. ✅ Exhaustive Checkでパターン網羅を保証
7. ✅ strictNullChecksでnull安全に
8. ✅ インターセクション型で型を合成
9. ✅ リテラル型で具体的な値を制限
10. ✅ as const でreadonlyリテラル型

### 次回予告: T-5

**「関数の型 — コールバックからGenericまで」**

- 関数型の書き方
- コールバック関数の型
- Generic関数
- 高階関数の型
- ReturnType / Parameters

**次回もお楽しみに！**

---

## 参考リンク

- [TypeScript Handbook - Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Exhaustiveness Checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [Type vs Interface](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)
