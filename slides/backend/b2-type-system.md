---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# B-2: Type System
## Numbers, Precision & Functional Programming

---

## この授業のゴール

**JavaScriptの数値型の落とし穴を理解し、型安全な関数型プログラミングを実践する**

- 他言語との数値型の違い
- IEEE 754浮動小数点の罠
- BigIntによる解決策
- 関数型プログラミングとTypeScriptの親和性

---

## 他の言語の数値型

### Java: 明示的な型分離

```java
// 整数型（範囲が明確）
byte  b = 127;                    // -128 ~ 127
short s = 32767;                  // -32768 ~ 32767
int   i = 2147483647;             // -2^31 ~ 2^31-1
long  l = 9223372036854775807L;   // -2^63 ~ 2^63-1

// 浮動小数点型
float  f = 3.14f;                 // 単精度
double d = 3.141592653589793;     // 倍精度
```

### Rust: サイズと符号を明示

```rust
// 符号付き整数
i8, i16, i32, i64, i128, isize

// 符号なし整数
u8, u16, u32, u64, u128, usize

// 浮動小数点
f32, f64

// 型安全な演算
let a: i32 = 100;
let b: i64 = 100;  // 別の型！コンパイルエラーになる
```

### Python: 動的だが任意精度

```python
# int: 任意精度（メモリの許す限り大きな値）
x = 999999999999999999999999999999

# float: IEEE 754倍精度（JSのnumberと同じ）
y = 3.14159

# Decimal: 正確な10進数演算
from decimal import Decimal
z = Decimal('0.1') + Decimal('0.2')  # 0.3（正確！）
```

---

## JavaScriptの数値型

**number型だけ（全部IEEE 754 倍精度浮動小数点）**

```javascript
// JavaScriptには「整数型」がない！
const integer = 42;      // 実際は浮動小数点
const float = 3.14;      // 同じnumber型
const negative = -100;   // 同じnumber型

// typeofは全部同じ
console.log(typeof integer); // "number"
console.log(typeof float);   // "number"

// 内部的には全部こう表現される
// 64ビット: 符号1bit + 指数11bit + 仮数52bit
```

**比較表**

| 言語 | 整数型 | 浮動小数点 | 任意精度 |
|------|--------|-----------|----------|
| Java | byte/short/int/long | float/double | BigInteger |
| Rust | i8~i128/u8~u128 | f32/f64 | クレート依存 |
| Python | int（任意精度） | float | 標準で対応 |
| JavaScript | **number（全部）** | **number（全部）** | **BigInt** |

---

## IEEE 754の罠

### 0.1 + 0.2 === 0.3 が falseになる理由

```javascript
// 直感に反する結果
console.log(0.1 + 0.2);        // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false！！

// なぜ？
// 0.1 は2進数で表現できない（循環小数になる）
// 0.1(10) = 0.0001100110011...(2)（無限に続く）
// 52bitの仮数で打ち切り → 誤差が生じる

// 実際の2進数表現（近似値）
// 0.1 ≈ 0.1000000000000000055511151231257827021181583404541015625
// 0.2 ≈ 0.200000000000000011102230246251565404236316680908203125
// 和  ≈ 0.3000000000000000444089209850062616169452667236328125000
```

**回避策**

```javascript
// 方法1: 整数に変換して計算
const result = (0.1 * 10 + 0.2 * 10) / 10;  // 0.3

// 方法2: Number.EPSILONを使った比較
const epsilon = Number.EPSILON; // 2.220446049250313e-16
function equal(a, b) {
  return Math.abs(a - b) < epsilon;
}
equal(0.1 + 0.2, 0.3); // true

// 方法3: toFixedで文字列にして比較
(0.1 + 0.2).toFixed(1) === '0.3'; // true
```

---

## Number.MAX_SAFE_INTEGER

**安全に整数演算できる上限**

```javascript
// 2^53 - 1 = 9007199254740991
console.log(Number.MAX_SAFE_INTEGER); // 9007199254740991

// これより大きい値は「安全」に演算できない
const max = Number.MAX_SAFE_INTEGER;

console.log(max + 1); // 9007199254740992 ✓
console.log(max + 2); // 9007199254740992 ✗（1が足されてない！）
console.log(max + 3); // 9007199254740994 ✗（飛んでる！）

// なぜ2^53？
// 52bitの仮数 + 隠れbit 1つ = 53bitの精度
// 2^53 を超えると、隣り合う整数が表現できなくなる
```

**デモ: 精度喪失**

```javascript
// 9007199254740992 + 1 の問題
const big = 9007199254740992;  // 2^53

console.log(big);        // 9007199254740992
console.log(big + 1);    // 9007199254740992（+1が無視される！）
console.log(big + 2);    // 9007199254740994（+2は反映される）

// 隔たりが2ずつ開いていく
console.log(big + 0);    // 9007199254740992
console.log(big + 1);    // 9007199254740992（同じ！）
console.log(big + 2);    // 9007199254740994
console.log(big + 3);    // 9007199254740994（同じ！）
console.log(big + 4);    // 9007199254740996
```

---

## なぜこうなったか：JSの歴史的経緯

**「ブラウザで動く簡単なスクリプト言語」として設計された**

```
1995年: Brendan Eichが10日間で開発
        └─ Javaに似せる必要があった（当時の業界圧力）
        └─ でも「簡単」でなければならなかった
        └─ 結果：number型一つで済ませた

1997年: ECMAScript標準化
        └─ IEEE 754倍精度を採用（当時の標準）
        └─ 整数型の追加は「複雑すぎる」と却下

2015年: ES6でBigIntが提案される
        └─ TwitterのID問題などで必要性が浮上

2020年: BigIntが全ブラウザで対応
        └─ でもnumber型との混在は依然として混乱の元
```

**設計上のトレードオフ**

| 目標 | 実現方法 |
|------|----------|
| 簡単に使える | 型が1つだけ |
| 大きな数も扱える | IEEE 754（最大~10^308） |
| 高速に演算 | CPUのFPUを直接使う |
| **欠点** | 精度の問題、整数表現の制限 |

---

## 現場での実害

### DBのIDをnumberで受け取ると壊れる

```javascript
// ❌ バックエンドから受け取ったID
const tweetId = 900719925474099267;  // number型

// フロントエンドで使おうとすると...
console.log(tweetId);  // 900719925474099300（精度喪失！）

// APIリクエストに使うと、別のツイートになってしまう
fetch(`/api/tweets/${tweetId}`)  // 違うツイート取得！
```

### TwitterのID問題

```javascript
// Twitter（現X）は2010年代後半に64bit整数IDに移行
// ツイートIDが Number.MAX_SAFE_INTEGER を超えた！

// フロントエンドで受け取ると精度喪失
const response = {
  id: 10765432100123456789,  // 実際のID
  text: "Hello World"
};

// JSON.parse後
console.log(response.id);  // 10765432100123458000（壊れてる！）

// ✅ 解決策：文字列として扱う
const safeResponse = {
  id_str: "10765432100123456789",  // ← 文字列！
  text: "Hello World"
};
```

### 「IDはstringで返せ」の理由

```typescript
// API設計の鉄則
interface APIResponse {
  // ❌ 避ける
  id: number;  // 大きな値で壊れる
  
  // ✅ 推奨
  id: string;  // 安全、未来も担保
}

// GraphQLの例
// ❌ type User { id: Int! }
// ✅ type User { id: ID! }  // Stringとして扱われる
```

---

## BigIntによる解決

**9007199254740992n + 1n**

```javascript
// BigIntリテラル：末尾に n を付ける
const big = 9007199254740992n;

console.log(big + 1n);  // 9007199254740993n ✓ 正確！
console.log(big + 2n);  // 9007199254740994n ✓

// 文字列から変換
const fromString = BigInt("900719925474099267");
console.log(fromString);  // 900719925474099267n

// 演算は同じbigint同士で
console.log(10n + 20n);     // 30n ✓
// console.log(10n + 20);   // TypeError！numberと混在不可

// 比較は可能
console.log(10n === 10);    // false（型が違う）
console.log(10n == 10);     // true（緩い比較はOK）
console.log(10n > 5);       // true
```

---

## Cloudflare WorkersでBigIntを使う際の注意

```typescript
// ❌ JSON.stringifyでBigIntはシリアライズできない
const data = { id: 900719925474099267n };
JSON.stringify(data);  // TypeError: BigInt can't serialize

// ✅ 文字列に変換してから
const safeData = { 
  id: 900719925474099267n.toString() 
};
JSON.stringify(safeData);  // '{"id":"900719925474099267"}'

// ✅ カスタムJSONシリアライザ
function safeJSONStringify(obj: unknown): string {
  return JSON.stringify(obj, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  );
}

// APIレスポンスで使う
app.get('/api/user/:id', async (c) => {
  const userId = BigInt(c.req.param('id'));
  const user = await getUser(userId);
  
  return c.json({
    id: user.id.toString(),  // 必ず文字列に
    name: user.name
  });
});
```

---

## 関数型プログラミングとTypeScriptの相性

### 不変性（Immutability）とReadonly型

```typescript
// ❌ ミュータブル（変更可能）
let user = { name: 'Alice', age: 30 };
user.age = 31;  // いつでも変更可能（予測困難）

// ✅ Readonlyで不変に
interface User {
  readonly name: string;
  readonly age: number;
}

const user: User = { name: 'Alice', age: 30 };
// user.age = 31;  // コンパイルエラー！

// ✅ Readonlyユーティリティ型
const users: ReadonlyArray<string> = ['Alice', 'Bob'];
// users.push('Charlie');  // エラー！

// ✅ オブジェクト全体をReadonlyに
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
} as const;  // 全プロパティがreadonly + リテラル型

// config.apiUrl = '...';  // エラー！
```

---

## 純粋関数と型の相性

**副作用がないから型が追いやすい**

```typescript
// ✅ 純粋関数：入力 → 出力（副作用なし）
const calculateTotal = (items: readonly Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// 型が教えてくれること
// - items は読み取り専用（変更しない）
// - number を返す（予測可能）
// - 外部に依存しない（テストしやすい）

// ❌ 非純粋関数：副作用がある
let total = 0;  // 外部状態
const addToTotal = (price: number): void => {
  total += price;  // 副作用：外部状態を変更
  saveToDatabase(total);  // 副作用：I/O操作
};

// 型が追いにくい
// - 返り値 void（何が起きたか分からない）
// - テストが難しい（モックが必要）
```

---

## エッジ実行と関数型の親和性

**ステートレス / リクエストごとに完結 / 副作用を分離**

```typescript
// エッジでの理想的なハンドラー
const handler = async (request: Request, env: Env): Promise<Response> => {
  // 1. 入力の解析（純粋）
  const input = parseRequest(request);
  
  // 2. 純粋な変換（ビジネスロジック）
  const result = processBusinessLogic(input);
  
  // 3. 副作用の実行（明示的に分離）
  await saveResult(env.DB, result);
  
  // 4. 出力の生成（純粋）
  return createResponse(result);
};

// 各フェーズの責務が明確
// - parseRequest: 入力検証
// - processBusinessLogic: 計算（テストしやすい）
// - saveResult: 副作用
// - createResponse: 出力整形
```

**なぜエッジで関数型？**

| 特性 | 関数型の強み |
|------|-------------|
| ステートレス | 純粋関数は自然にステートレス |
| リクエスト分離 | 不変データで安全に並列実行 |
| コールドスタート | 初期化が予測可能 |
| エラーハンドリング | Result型で型安全に |

---

## パイプライン的な関数合成

**小さな純粋関数を組み合わせてロジックを書く**

```typescript
// 小さな純粋関数
const validateInput = (input: unknown): ValidationResult<UserInput> => {
  // 検証ロジック
};

const transformData = (input: UserInput): TransformedData => {
  // 変換ロジック
};

const calculateResult = (data: TransformedData): CalculationResult => {
  // 計算ロジック
};

const formatOutput = (result: CalculationResult): APIResponse => {
  // 整形ロジック
};

// パイプラインで合成
const processRequest = (input: unknown): APIResponse => {
  return pipe(
    input,
    validateInput,
    map(transformData),      // ValidationResult → TransformedData
    map(calculateResult),    // TransformedData → CalculationResult
    map(formatOutput)        // CalculationResult → APIResponse
  );
};

// または
const processRequest2 = flow(
  validateInput,
  map(transformData),
  map(calculateResult),
  map(formatOutput)
);
```

---

## Result型によるエラーハンドリング

```typescript
// Result型：成功または失敗を表現
type Result<T, E> = 
  | { success: true; value: T }
  | { success: false; error: E };

// 使い方
const parsePositiveNumber = (input: string): Result<number, string> => {
  const num = Number(input);
  if (isNaN(num)) {
    return { success: false, error: 'Not a number' };
  }
  if (num <= 0) {
    return { success: false, error: 'Must be positive' };
  }
  return { success: true, value: num };
};

// パイプラインで連結
const result = parsePositiveNumber("42")
  .map(x => x * 2)
  .filter(x => x > 50, 'Too small')
  .map(x => x.toString());

// 型安全に分岐
if (result.success) {
  console.log(result.value);  // string型
} else {
  console.log(result.error);  // string型
}
```

---

## ハンズオン：型安全な変換パイプラインを書く

### ステップ1: 基本型の定義

```typescript
// src/types.ts

// 入力（外部から来るデータ）
interface RawUser {
  id: string;
  name: string;
  age: string;  // APIからは文字列で来る
  email: string;
}

// 検証済みデータ
interface ValidatedUser {
  readonly id: bigint;
  readonly name: string;
  readonly age: number;
  readonly email: string;
}

// APIレスポンス
interface UserResponse {
  id: string;
  name: string;
  age: number;
  email: string;
}
```

### ステップ2: 純粋関数の実装

```typescript
// src/pipeline.ts

import { Result, ok, err } from './result';

// 1. 検証
const validateUser = (raw: RawUser): Result<ValidatedUser, string[]> => {
  const errors: string[] = [];
  
  // IDをBigIntに変換
  let id: bigint;
  try {
    id = BigInt(raw.id);
  } catch {
    errors.push('Invalid ID format');
  }
  
  // 年齢をnumberに変換
  const age = Number(raw.age);
  if (isNaN(age) || age < 0 || age > 150) {
    errors.push('Invalid age');
  }
  
  if (errors.length > 0) {
    return err(errors);
  }
  
  return ok({
    id: id!,
    name: raw.name,
    age,
    email: raw.email
  });
};

// 2. 変換
const toResponse = (user: ValidatedUser): UserResponse => ({
  id: user.id.toString(),  // BigInt → string
  name: user.name,
  age: user.age,
  email: user.email
});

// 3. パイプライン
export const processUser = (raw: RawUser): Result<UserResponse, string[]> => {
  return validateUser(raw).map(toResponse);
};
```

---

## まとめ・次回予告

### 今日学んだこと

1. ✅ JavaScriptはnumber型1つ（IEEE 754倍精度浮動小数点）
2. ✅ 0.1 + 0.2 !== 0.3、Number.MAX_SAFE_INTEGER = 2^53-1
3. ✅ 歴史的経緯で「簡単さ」が優先された
4. ✅ DBのIDはstringで扱う（Twitterの問題）
5. ✅ BigIntで大きな整数を安全に扱える
6. ✅ Cloudflare Workersでは文字列変換が必要
7. ✅ 関数型 + TypeScript = 不変性・純粋関数・型安全
8. ✅ エッジ実行と関数型の親和性
9. ✅ パイプラインで小さな関数を合成

### 次回予告: B-3 Validation

**「Zod / drizzle-zod / Type Integration」**

- Zodによるスキーマバリデーション
- 型推論による型安全
- drizzle-zodでDBスキーマと統合
- バリデーションエラーのハンドリング

**次回もお楽しみに！**

---

## 参考リンク

- [MDN: BigInt](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
- [IEEE 754 Standard](https://en.wikipedia.org/wiki/IEEE_754)
- [What Every Programmer Should Know About Floating-Point Arithmetic](https://floating-point-gui.de/)
- [fp-ts: Functional Programming in TypeScript](https://gcanti.github.io/fp-ts/)
