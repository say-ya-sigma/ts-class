---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# T-3: 型の基礎
## TypeScriptが守ってくれるもの

---

## この授業のゴール

**「型を書く手間 < 型がないと起きるバグ」を理解する**

- JSの動的型付けの問題
- TypeScriptの型推論
- プリミティブ型と型アノテーション
- any/unknown/neverの使い分け
- 配列・オブジェクトの型
- type aliasとinterfaceの基礎

---

## JSの動的型付けが引き起こす問題

### 実際に起きるバグの例

```javascript
function add(a, b) {
  return a + b;
}

add(1, 2);      // → 3 (期待通り)
add(1, "2");    // → "12" (文字列結合！)
add("1", 2);    // → "12" (文字列結合！)
add(true, 1);   // → 2 (trueが1に変換)
add(null, 1);   // → 1 (nullが0に変換)
add([], {});    // → "[object Object]" (！？)
```

### 「実行してみないとわからない」の怖さ

```javascript
function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.price;  // item.priceが文字列かも？
  }, 0);
}

// 実行してみるまで気づかない
const items = [
  { name: "Apple", price: "100" },   // 文字列！
  { name: "Banana", price: 200 },    // 数値
];

calculateTotal(items);  // → "100200" (！？)
// 期待: 300、実際: "100200"
```

---

## 大きなコードベースでは致命的

```javascript
// file1.js
function processUser(user) {
  return {
    name: user.name.toUpperCase(),  // user.nameがundefined？
    age: user.age + 1               // user.ageが文字列？
  };
}

// file2.js (100行離れた場所)
const user = getUserFromAPI();  // どんなデータが来るか不明
const result = processUser(user);

// 実行時エラー！
// TypeError: Cannot read property 'toUpperCase' of undefined
```

**問題:**
- どこで間違ったデータを渡したか追跡困難
- バグは本番環境で発見される
- 100ファイル以上あると手動での確認不可能

---

## TypeScriptの型推論

### 「型を書かなくてもTSが推測してくれる」

```typescript
// TypeScript
const name = "Alice";        // → string と推論される
const age = 30;              // → number と推論される
const isActive = true;       // → boolean と推論される
const items = ["a", "b"];    // → string[] と推論される

// 明示的に書かなくても型がついている！
name = 123;  // ❌ コンパイルエラー: Type 'number' is not assignable to type 'string'
```

### VSCodeでホバーして確認する

```typescript
const user = {
  name: "Alice",
  age: 30
};

// ホバーすると型が表示される
// const user: { name: string; age: number; }
```

**「型推論があるから、全部に型を書く必要はない」**

---

## プリミティブ型

### string / number / boolean

```typescript
// string: 文字列
const name: string = "Alice";
const greeting: string = `Hello, ${name}`;

// number: 数値（整数と小数の区別なし）
const age: number = 30;
const pi: number = 3.14;
const large: number = 1_000_000;  // 区切り文字OK

// boolean: 真偽値
const isActive: boolean = true;
const isValid: boolean = false;
```

### null / undefined の違い（JSの歴史的負債）

```typescript
// undefined: 値が定義されていない
let x;           // undefined
const obj = {};  // obj.name は undefined

// null: 値がないことを明示
const user = null;  // "意図的に空"

// 歴史的経緯
undefined;  // 変数が初期化されていない
null;       // オブジェクトがない

// TypeScriptでは両方存在
let maybe: string | null = null;
let optional: string | undefined = undefined;
```

---

### bigint / symbol（存在だけ紹介）

```typescript
// bigint: 大きな整数（ES2020）
const huge: bigint = 9007199254740991n;
const result: bigint = huge + 1n;

// symbol: 一意な識別子
const id: symbol = Symbol("id");
const key: symbol = Symbol("key");
```

---

## 型アノテーション

### 変数への型注釈

```typescript
// 型推論に任せる（推奨）
const name = "Alice";     // stringと推論される

// 明示的に型を書く（必要な時だけ）
let count: number = 0;    // 後で変更する可能性がある
let message: string;      // 初期値なしで宣言
message = "Hello";        // 後で代入
```

### 関数の引数と戻り値の型

```typescript
// 引数と戻り値に型を指定
function add(a: number, b: number): number {
  return a + b;
}

add(1, 2);      // ✅ OK
add(1, "2");    // ❌ コンパイルエラー!
add("1", 2);    // ❌ コンパイルエラー!

// アロー関数
const multiply = (a: number, b: number): number => {
  return a * b;
};

// 戻り値の型は推論できる場合省略可能
const greet = (name: string) => {  // 戻り値はstringと推論
  return `Hello, ${name}`;
};
```

---

## 「型推論に任せられるところに書かなくていい」ルール

```typescript
// ✅ 良い例：型推論に任せる
const user = { name: "Alice", age: 30 };  // 型が明確
const numbers = [1, 2, 3];                 // number[]と推論
const greet = (name: string) => `Hello ${name}`;  // 戻り値は推論

// ✅ 必要な時に明示的に書く
let count: number;                    // 初期値なし
function process(data: unknown): User {  // 戻り値を明示
  // ...
}

// ❌ 過剰な型注釈（冗長）
const name: string = "Alice";         // 明らかにstring
const count: number = 0;              // 明らかにnumber
```

---

## any 型という逃げ道と罠

### any はTSの型チェックを無効にする

```typescript
// any型：どんな値も入れられる
let anything: any = "Hello";
anything = 42;        // OK
anything = true;      // OK
anything.toFixed(2);  // OK (ランタイムエラーの可能性)
anything.map(x => x); // OK (ランタイムエラーの可能性)

// 「anyを使うとJSと同じ」
const user: any = getUserFromAPI();
console.log(user.namee);  // タイプミスに気づかない！
console.log(user.emial);  // コンパイルエラーにならない
```

### noImplicitAny: strict: trueに含まれる設定

```json
{
  "compilerOptions": {
    "strict": true  // noImplicitAnyが有効
  }
}
```

```typescript
// strict: true の場合
function greet(name) {  // ❌ エラー: Parameter 'name' implicitly has an 'any' type
  return `Hello, ${name}`;
}

// 修正版
function greet(name: string) {  // ✅ 型を明示
  return `Hello, ${name}`;
}
```

---

## anyを使っていい場面 / 使ってはいけない場面

### ✅ 使っていい場面

```typescript
// 1. 既存のJSコードからの移行中
const legacyData: any = oldLibrary.getData();

// 2. 本当に型がわからない場合（後で絞り込む）
const unknownData: any = fetchData();

// 3. 型定義ファイルがない外部ライブラリ
const library: any = require('legacy-lib');
```

### ❌ 使ってはいけない場面

```typescript
// 1. 型が明らかなのにanyを使う
const user: any = { name: "Alice", age: 30 };  // 型を書こう

// 2. "面倒くさいから" anyにする
function process(data: any) {  // 具体的な型を書こう
  return data.value;
}

// 3. エラーを無視するためにanyを使う
const result: any = mightFail();  // エラーハンドリングを書こう
```

---

## unknown 型：型安全なany

### anyと違い、unknown は操作前に型チェックが必要

```typescript
// unknown: 型が不明だが、anyより安全
let userInput: unknown = "Hello";
userInput = 42;
userInput = { name: "Alice" };

// ❌ そのまま操作できない
console.log(userInput.name);  // エラー: Object is of type 'unknown'

// ✅ 型を絞り込んでから操作
if (typeof userInput === "object" && userInput !== null) {
  console.log((userInput as { name: string }).name);
}

// ✅ type guardsで絞り込む
function processInput(input: unknown) {
  if (typeof input === "string") {
    return input.toUpperCase();  // stringとして安全に使える
  }
  if (typeof input === "number") {
    return input.toFixed(2);     // numberとして安全に使える
  }
  return "Unknown";
}
```

### 「外から来るデータ」に使う

```typescript
// APIからのレスポンスなど
async function fetchUser(): Promise<unknown> {
  const response = await fetch('/api/user');
  return response.json();  // unknown型として返す
}

const user = await fetchUser();
// ここではまだ安全にアクセスできない
// 後でZodなどでバリデーションする（B-3で詳しく）
```

---

## never 型：到達不能を表す

### 関数が絶対に返らないことを示す

```typescript
// never: この関数は値を返さない
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {
    // 無限ループ
  }
}

// 使い方
function process(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();
  } else if (typeof value === "number") {
    return value.toFixed(2);
  } else {
    // ここには到達しないはず
    return throwError("Invalid type");  // never型
  }
}
```

### Exhaustive Check パターン（予告）

```typescript
type Status = "loading" | "success" | "error";

function getMessage(status: Status): string {
  switch (status) {
    case "loading":
      return "Loading...";
    case "success":
      return "Done!";
    case "error":
      return "Error!";
    default:
      // Statusに新しい値が追加されたらここでエラー
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
  }
}
```

---

## 配列の型

### string[] / Array<string>

```typescript
// 配列型の書き方（2種類）
const names: string[] = ["Alice", "Bob", "Charlie"];
const numbers: Array<number> = [1, 2, 3];

// どちらも同じ意味（string[] が一般的）
const items1: string[] = [];
const items2: Array<string> = [];

// 複数の型を含む配列（Union型）
const mixed: (string | number)[] = ["Alice", 30, "Bob", 25];

// readonly配列（変更不可）
const readonlyNames: readonly string[] = ["Alice", "Bob"];
readonlyNames.push("Charlie");  // ❌ エラー
```

### タプル: [string, number]

```typescript
// タプル: 固定長で、各位置に型がある配列
const user: [string, number] = ["Alice", 30];
// [名前, 年齢] のペア

// アクセス
const name = user[0];     // string型
const age = user[1];      // number型
const invalid = user[2];  // ❌ エラー: Tuple type '[string, number]' of length '2' has no element at index '2'

// ラベル付きタプル（可読性向上）
const point: [x: number, y: number] = [10, 20];

// 使用例
function useState<T>(initial: T): [T, (value: T) => void] {
  // ReactのuseStateと同じパターン
  let state = initial;
  const setState = (value: T) => { state = value; };
  return [state, setState];
}

const [count, setCount] = useState(0);
```

---

## オブジェクトの型（インラインで書く）

### { name: string; age: number }

```typescript
// オブジェクト型の書き方
const user: { name: string; age: number } = {
  name: "Alice",
  age: 30
};

// 複数のプロパティ
const product: {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
} = {
  id: 1,
  name: "Laptop",
  price: 999,
  inStock: true
};
```

### optional: { name: string; age?: number }

```typescript
// ? でオプショナル（省略可能）
const user: { name: string; age?: number } = {
  name: "Alice"
  // ageは省略可能
};

// 使用例
function greet(user: { name: string; nickname?: string }) {
  const displayName = user.nickname ?? user.name;
  return `Hello, ${displayName}`;
}

greet({ name: "Alice" });                    // ✅ OK
greet({ name: "Alice", nickname: "Ali" });   // ✅ OK
```

---

### readonly: { readonly id: string }

```typescript
// readonlyで変更不可
const user: { readonly id: string; name: string } = {
  id: "user-123",
  name: "Alice"
};

user.name = "Bob";      // ✅ OK
user.id = "user-456";   // ❌ エラー: Cannot assign to 'id' because it is a read-only property

// ネストしたオブジェクトのreadonly
const config: {
  readonly api: {
    readonly url: string;
    readonly key: string;
  };
} = {
  api: {
    url: "https://api.example.com",
    key: "secret-key"
  }
};

config.api.url = "...";  // ❌ エラー（Deep readonlyは別のテクニックが必要）
```

---

## type alias と interface の基礎

### type User = { name: string; age: number }

```typescript
// type alias（型エイリアス）
type User = {
  name: string;
  age: number;
};

type Product = {
  id: number;
  name: string;
  price: number;
};

// 使用
const user: User = { name: "Alice", age: 30 };
const product: Product = { id: 1, name: "Book", price: 10 };
```

### interface User { name: string; age: number }

```typescript
// interface（インターフェース）
interface User {
  name: string;
  age: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

// 使用
const user: User = { name: "Alice", age: 30 };
const product: Product = { id: 1, name: "Book", price: 10 };
```

### 「どちらを使うか」問題

```typescript
// 基本的には「どちらでも動く」
// 深い違いはT-4で詳しく説明

// 現在の推奨:
// - interface: オブジェクトの形状を定義（メイン）
// - type: Union型、Tuple、複雑な型

// 例:
interface User {        // オブジェクトはinterface
  name: string;
}

type Status = "active" | "inactive";  // Union型はtype
type Point = [number, number];        // Tupleはtype
```

---

## ハンズオン：JSコードをTSに移行する

### 問題1: add関数

```javascript
// JavaScript (問題あり)
function add(a, b) {
  return a + b;
}

add(1, "2");  // "12" になってしまう
```

```typescript
// TypeScript (安全)
function add(a: number, b: number): number {
  return a + b;
}

add(1, 2);      // ✅ 3
add(1, "2");    // ❌ コンパイルエラー!
```

### 問題2: ユーザーオブジェクト

```javascript
// JavaScript
function greetUser(user) {
  return `Hello, ${user.namee}!`;  // タイプミスに気づかない
}

greetUser({ name: "Alice" });  // "Hello, undefined!"
```

```typescript
// TypeScript
interface User {
  name: string;
}

function greetUser(user: User): string {
  return `Hello, ${user.namee}!`;  // ❌ コンパイルエラー: Property 'namee' does not exist
}

greetUser({ name: "Alice" });  // ✅ "Hello, Alice!"
```

---

### 問題3: 配列処理

```javascript
// JavaScript
function getNames(users) {
  return users.map(u => u.name);
}

getNames([{ name: "Alice" }, { name: "Bob" }]);  // ✅ ["Alice", "Bob"]
getNames(["Alice", "Bob"]);  // ❌ [undefined, undefined]（気づかない）
```

```typescript
// TypeScript
interface User {
  name: string;
}

function getNames(users: User[]): string[] {
  return users.map(u => u.name);
}

getNames([{ name: "Alice" }, { name: "Bob" }]);  // ✅
getNames(["Alice", "Bob"]);  // ❌ コンパイルエラー!
```

---

## まとめ・次回予告

### 今日学んだこと

1. ✅ JSの動的型付けは実行時バグを生む
2. ✅ TypeScriptの型推論で安全に開発
3. ✅ プリミティブ型: string/number/boolean/null/undefined
4. ✅ 型アノテーションは必要な時だけ
5. ✅ any型は避ける、unknown型を使う
6. ✅ never型は到達不能を表す
7. ✅ 配列型: string[] とタプル [string, number]
8. ✅ オブジェクト型: { name: string; age?: number }
9. ✅ readonlyで変更不可に
10. ✅ typeとinterfaceの基礎

### 次回予告: T-4

**「型の組み合わせ — Union/Intersection/Generics入門」**

- Union型 (A | B)
- Intersection型 (A & B)
- Genericsの基礎
- 条件付き型 (Conditional Types)
- Mapped Types

**次回もお楽しみに！**

---

## 参考リンク

- [TypeScript Handbook - Basic Types](https://www.typescriptlang.org/docs/handbook/basic-types.html)
- [TypeScript Handbook - Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [any vs unknown](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
