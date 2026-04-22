---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# T-5: Generics と Utility Types
## 型を再利用する

---

## この授業のゴール

**「型パラメータ」という概念を直感的に理解する**

- 「型のコピペ」問題を解決
- Genericsの基本と実用例
- 型の制約（extends）
- keyof演算子
- Utility Typesの活用
- 型安全なユーティリティ関数の作成

---

## 「型のコピペ」問題

### string用の関数とnumber用の関数を別々に書く羽目になる

```typescript
// ❌ 型だけ違う同じ関数が大量にある
function firstString(arr: string[]): string | undefined {
  return arr[0];
}

function firstNumber(arr: number[]): number | undefined {
  return arr[0];
}

function firstUser(arr: User[]): User | undefined {
  return arr[0];
}

// 同じロジックなのに型のためにコピペ...！
```

### 型だけ違う、同じ関数が大量にある

```typescript
// ❌ ペア関数も型ごとに必要
function pairString(a: string, b: string): [string, string] {
  return [a, b];
}

function pairNumber(a: number, b: number): [number, number] {
  return [a, b];
}

function pairUser(a: User, b: User): [User, User] {
  return [a, b];
}

// DRY原則（Don't Repeat Yourself）に違反
```

**「型もDRYにしたい」という動機**

---

## Genericsとは

### 「型をパラメータにする」という発想

```typescript
// 普通の関数: 値をパラメータにする
function greet(name: string): string {
  return `Hello, ${name}`;
}

greet("Alice");  // "Hello, Alice"
greet(123);      // ❌ エラー
```

```typescript
// Generic関数: 型をパラメータにする
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// <T>のTは「型の変数（プレースホルダー）」
// 呼び出し時に具体的な型が決まる

first<string>(["a", "b", "c"]);   // T = string
first<number>([1, 2, 3]);         // T = number
first<User>([user1, user2]);      // T = User
```

### すでに使っている: Array<string> / Promise<User>

```typescript
// 組み込みのGeneric型
const names: Array<string> = ["Alice", "Bob"];
const promise: Promise<User> = fetchUser();

// Map<K, V>
const users: Map<string, User> = new Map();

// React.FC<Props>
const App: React.FC<AppProps> = () => { };
```

---

## Generic関数

### function identity<T>(value: T): T

```typescript
// 入力の型をそのまま出力に返す関数
function identity<T>(value: T): T {
  return value;
}

// 使用例
const str = identity<string>("Hello");     // string型
const num = identity<number>(42);          // number型
const user = identity<User>({ name: "Alice" });  // User型

// 型パラメータが「入力の型」と「出力の型」を繋ぐ
// <T>が同じ型を指す
```

### 型推論との組み合わせ

```typescript
// 明示的に<T>を書かなくても推論される
const str = identity("Hello");     // T = string と推論
const num = identity(42);          // T = number と推論

// 明示的に書く必要がある場合
const result = identity<User>(fetchData());
// fetchData()がunknownを返す場合など
```

---

## Generic関数の実用例

### function first<T>(arr: T[]): T | undefined

```typescript
// 配列の最初の要素を取得
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// 使用
const names = ["Alice", "Bob", "Charlie"];
const firstName = first(names);  // string | undefined

const numbers = [1, 2, 3];
const firstNum = first(numbers);  // number | undefined

// 同じ関数で複数の型に対応！
```

### function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>

```typescript
// オブジェクトから特定のプロパティだけ取り出す
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    result[key] = obj[key];
  });
  return result;
}

// 使用
const user = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  age: 30
};

const basicInfo = pick(user, ["name", "email"]);
// { name: string; email: string }

const identifier = pick(user, ["id", "name"]);
// { id: number; name: string }
```

---

## 型の制約（extends）

### <T extends string> → Tはstringのサブタイプであるべき

```typescript
// ❌ 制約なし：何でも受け付ける
function logLength<T>(value: T): void {
  console.log(value.length);  // ❌ エラー: Property 'length' does not exist
}

// ✅ extendsで制約をつける
function logLength<T extends { length: number }>(value: T): void {
  console.log(value.length);  // ✅ OK: lengthプロパティが保証される
}

logLength("Hello");     // ✅ stringはlengthを持つ
logLength([1, 2, 3]);   // ✅ 配列はlengthを持つ
logLength(123);         // ❌ numberはlengthを持たない
```

### <T extends { id: string }> → Tはidプロパティを持つべき

```typescript
// idプロパティを持つオブジェクトに対する関数
function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

// 使用
interface User {
  id: string;
  name: string;
}

interface Product {
  id: string;
  price: number;
}

const users: User[] = [{ id: "1", name: "Alice" }];
const products: Product[] = [{ id: "p1", price: 100 }];

findById(users, "1");      // ✅ User | undefined
findById(products, "p1");  // ✅ Product | undefined
```

---

### 「何でも来ていい」より「ある程度絞る」ための制約

```typescript
// 比較可能な型に制限
function max<T extends number | string>(a: T, b: T): T {
  return a > b ? a : b;
}

max(1, 2);        // ✅
max("a", "b");    // ✅
max(1, "a");      // ❌ 同じ型でない

// 特定のメソッドを持つ型に制限
function sortBy<T extends { toString(): string }>(items: T[]): T[] {
  return [...items].sort((a, b) => 
    a.toString().localeCompare(b.toString())
  );
}
```

---

## keyof 演算子

### keyof User → "id" | "name" | "email" の型

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

type UserKeys = keyof User;
// "id" | "name" | "email" | "age"

const key1: UserKeys = "id";     // ✅
const key2: UserKeys = "name";   // ✅
const key3: UserKeys = "phone";  // ❌ エラー
```

### 「オブジェクトのキーを型として取り出す」

```typescript
// 特定のプロパティの値を取得する関数
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user: User = {
  id: "1",
  name: "Alice",
  email: "alice@example.com",
  age: 30
};

const id = getProperty(user, "id");       // string型
const age = getProperty(user, "age");     // number型
const name = getProperty(user, "name");   // string型

// 補完が効く！
getProperty(user, "em");  // "email"が候補に表示される
```

---

### T[K]でプロパティの型にアクセスする

```typescript
type UserNameType = User["name"];   // string型
type UserIdType = User["id"];       // string型

// ユニオンで複数のプロパティ型を取得
type UserBasicTypes = User["name" | "age"];
// string | number
```

## Utility Types — TSが標準で提供する型ツール

### 「よく使う型変換をTSが用意してくれている」

```typescript
// 毎回自分で書くと大変...
type PartialUser = {
  id?: string;
  name?: string;
  email?: string;
  age?: number;
};

// Utility Typesを使えば1行！
type PartialUser = Partial<User>;
```

---

## 必須Utility Types 一覧

### Partial<T>: 全プロパティをoptionalに

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// {
//   id?: string;
//   name?: string;
//   email?: string;
// }

// 使用例: フォームの入力値
function updateUser(id: string, data: Partial<User>) {
  // 部分的な更新が可能
}

updateUser("1", { name: "New Name" });           // ✅
updateUser("1", { email: "new@example.com" });   // ✅
```

### Required<T>: 全プロパティを必須に

```typescript
interface Config {
  apiUrl?: string;
  timeout?: number;
  retries?: number;
}

type RequiredConfig = Required<Config>;
// {
//   apiUrl: string;
//   timeout: number;
//   retries: number;
// }

// デフォルト値をマージした後の型
function createConfig(partial: Partial<Config>): Required<Config> {
  return {
    apiUrl: partial.apiUrl ?? "https://api.example.com",
    timeout: partial.timeout ?? 5000,
    retries: partial.retries ?? 3
  };
}
```

---

### Readonly<T>: 全プロパティをreadonlyに

```typescript
interface User {
  id: string;
  name: string;
}

type ReadonlyUser = Readonly<User>;
// {
//   readonly id: string;
//   readonly name: string;
// }

const user: ReadonlyUser = { id: "1", name: "Alice" };
user.name = "Bob";  // ❌ エラー: Cannot assign to 'name' because it is a read-only property
```

### Pick<T, K>: 特定のプロパティだけ取り出す

```typescript
type UserBasicInfo = Pick<User, "id" | "name">;
// {
//   id: string;
//   name: string;
// }

// APIレスポンスから不要なフィールドを除外
function getUserBasicInfo(user: User): UserBasicInfo {
  return {
    id: user.id,
    name: user.name
  };
}
```

---

### Omit<T, K>: 特定のプロパティだけ除外する

```typescript
// センシティブな情報を除外
type PublicUser = Omit<User, "password" | "email">;
// {
//   id: string;
//   name: string;
//   age: number;
// }

// APIレスポンス用の型
function toPublicUser(user: User): PublicUser {
  const { password, email, ...publicUser } = user;
  return publicUser;
}
```

### Record<K, V>: キーと値の型を指定したオブジェクト型

```typescript
// キーがstring、値がnumberのオブジェクト
type Prices = Record<string, number>;
const prices: Prices = {
  apple: 100,
  banana: 80,
  orange: 120
};

// キーをリテラル型に制限
type Fruit = "apple" | "banana" | "orange";
type FruitPrices = Record<Fruit, number>;
const fruitPrices: FruitPrices = {
  apple: 100,
  banana: 80,
  orange: 120
};
```

**Partial / Required / Pick / Omit は実務で毎日使う**

---

## 関数から型を取り出すUtility Types

### ReturnType<typeof fn>: 関数の戻り値の型

```typescript
function fetchUser() {
  return {
    id: "1",
    name: "Alice",
    email: "alice@example.com"
  };
}

type FetchUserReturn = ReturnType<typeof fetchUser>;
// {
//   id: string;
//   name: string;
//   email: string;
// }

// 使用例: キャッシュの型
type UserCache = Map<string, ReturnType<typeof fetchUser>>;
```

### Parameters<typeof fn>: 関数の引数の型（タプル）

```typescript
function createUser(name: string, email: string, age: number) {
  return { id: "1", name, email, age };
}

type CreateUserParams = Parameters<typeof createUser>;
// [string, string, number]

// 使用例: イベントハンドラーの型
type HandlerParams = Parameters<typeof createUser>;
const handleCreate = (...args: HandlerParams) => {
  const [name, email, age] = args;
  return createUser(name, email, age);
};
```

---

### Awaited<T>: Promiseを剥がした型

```typescript
async function fetchUser(): Promise<User> {
  const response = await fetch('/api/user');
  return response.json();
}

type FetchedUser = Awaited<ReturnType<typeof fetchUser>>;
// User型（Promiseが剥がされる）

// ネストしたPromiseも対応
type DeepPromise = Promise<Promise<string>>;
type Unwrapped = Awaited<DeepPromise>;  // string
```

## Exclude / Extract / NonNullable

### Exclude<T, U>: UをTから除いたユニオン型

```typescript
type Status = "loading" | "success" | "error" | "cancelled";
type FinalStatus = Exclude<Status, "loading">;
// "success" | "error" | "cancelled"

// 使用例: 完了後のステータス
type CompletedStatus = Exclude<Status, "loading" | "cancelled">;
// "success" | "error"
```

### Extract<T, U>: TとUの共通型

```typescript
type AllTypes = string | number | boolean;
type StringOrNumber = Extract<AllTypes, string | number>;
// string | number

// 使用例: 関数型だけ取り出す
type Mixed = string | number | (() => void);
type FunctionsOnly = Extract<Mixed, Function>;
// () => void
```

---

### NonNullable<T>: null/undefinedを除いた型

```typescript
type MaybeString = string | null | undefined;
type DefinitelyString = NonNullable<MaybeString>;
// string

// 使用例: 配列からnullを除外
const users: (User | null)[] = [user1, null, user2, null, user3];
const validUsers: User[] = users.filter(Boolean) as NonNullable<typeof users[number]>[];
```

## ハンズオン：Genericsを使って型安全なユーティリティ関数を作る

### generic な fetch wrapper を実装する

```typescript
// 型安全なfetchラッパー
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// 使用
interface User {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
}

const user = await fetchJson<User>("/api/user/1");    // User型
const posts = await fetchJson<Post[]>("/api/posts");  // Post[]型
```

---

### Utility Typesを使ってPropsを変換する

```typescript
// 元の型
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// 1. APIレスポンス用（パスワードとメタデータ除外）
type UserResponse = Omit<User, "password" | "createdAt">;

// 2. フォーム入力用（ID不要、全てoptional）
type UserFormInput = Partial<Omit<User, "id" | "createdAt">>;

// 3. 更新用（ID必須、他はoptional）
type UserUpdateInput = Partial<Omit<User, "createdAt">> & Pick<User, "id">;

// 4. 表示用（readonly）
type ReadonlyUser = Readonly<Pick<User, "id" | "name" | "email">>;
```

---

## まとめ・次回予告

### 今日学んだこと

1. ✅ 「型のコピペ」問題をGenericsで解決
2. ✅ <T>は型の変数（プレースホルダー）
3. ✅ Generic関数で型安全な再利用
4. ✅ extendsで型に制約をつける
5. ✅ keyofでオブジェクトのキーを型として取得
6. ✅ Utility Typesで型変換を簡潔に
   - Partial, Required, Readonly
   - Pick, Omit, Record
   - ReturnType, Parameters, Awaited
   - Exclude, Extract, NonNullable

### 次回予告: T-6

**「モジュール・名前空間・型定義ファイル」**

- import/exportの詳細
- namespace
- declare
- .d.tsファイル
- 既存JSライブラリに型をつける
- DefinitelyTyped

**次回もお楽しみに！**

---

## 参考リンク

- [TypeScript Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Handbook - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook - Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [Generics in TypeScript](https://www.totaltypescript.com/concepts)
- [Utility Types Explained](https://www.typescriptlang.org/docs/handbook/utility-types.html)
