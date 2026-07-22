---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# T-7: TypeScriptバージョンの変遷と未来
## TS 1.0からGoネイティブのTS 7.0まで
### 〜Pシリーズ修了、特別編〜

---

## この授業のゴール

**Tシリーズ・Pシリーズを終えた今、TypeScriptの歴史を知り、TS 6/7時代に対応できるようになる**

- TypeScriptのバージョンの変遷（1.0 → 5.x）
- 主要バージョンで追加された機能の背景
- TypeScript 6.0の新機能と新デフォルト
- TS 6で非推奨になり、TS 7で廃止された要素
- TypeScript 7.0（Goネイティブ版）の全貌
- 5.x → 6 → 7 への移行手順

---

## なぜバージョンの歴史を学ぶのか

- TypeScriptの文法（Tシリーズ）と実践パターン（Pシリーズ）は身についた
  - ここからはその知識が**どう変化していくか**を知る番
- 既存プロジェクトのtsconfigは「歴史の地層」
- 機能には**導入された理由**がある
- 2026年は**TSの歴史上最大の転換点**
  - 6.0が最後のJavaScript実装版、7.0でGoに完全リプレース
- 移行作業は今後数年、現場の必須スキル

---

## TypeScriptバージョン年表（前半）

| バージョン | 時期 | キーワード |
|-----------|------|-----------|
| 1.0 | 2014年 | 正式リリース、構造的型付け |
| 2.0 | 2016年 | strictNullChecks、@types |
| 2.8 | 2018年 | Conditional Types |
| 3.0 | 2018年 | unknown、Project References |
| 3.7 | 2019年 | Optional Chaining（?.） |
| 4.0 | 2020年 | Variadic Tuple Types |

---

## TypeScriptバージョン年表（後半）

| バージョン | 時期 | キーワード |
|-----------|------|-----------|
| 4.1 | 2020年 | Template Literal Types |
| 4.9 | 2022年 | satisfies演算子 |
| 5.0 | 2023年 | ECMAScript Decorators |
| 5.9 | 2025年 | 5.x系の最終盤 |
| **6.0** | **2026年3月** | **最後のJS実装版** |
| **7.0** | **2026年7月** | **Goネイティブ版GA** |

---

## TS 1.0（2014年）: すべての始まり

- 2012年にAnders Hejlsberg（C#の設計者）が発表
- 2014年4月に1.0が正式リリース
- 当初からの設計思想は今も不変

```typescript
// 1.0の時点で既にあった機能
interface User {
  name: string;
  age: number;
}
// 構造的型付け（structural typing）
// → 形が同じなら同じ型とみなす
```

---

## TS 2.0（2016年）: null安全の獲得

- **strictNullChecks** の導入（歴史的転換点）
- `null` / `undefined` が独立した型に

```typescript
// strictNullChecks: false（2.0以前の世界）
const name: string = null; // エラーにならない！

// strictNullChecks: true
const name: string = null; // ❌ エラー
const name2: string | null = null; // ✅ 明示すればOK
```

- npmの `@types/...` パッケージ取得も2.0から

---

## TS 2.8（2018年）: Conditional Types

- 型レベルの条件分岐が可能に
- Utility Types（T-5で学習）の実装基盤

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;      // false

// ExcludeやReturnTypeはこの機能で作られている
type MyExclude<T, U> = T extends U ? never : T;
```

---

## TS 3.x（2018〜2019年）: 安全性の強化

- **3.0**: `unknown` 型（安全なany）の導入
- **3.0**: Project References（モノレポ対応）
- **3.7**: Assertion Functions

```typescript
// unknown: 使う前に型チェックを強制
function handle(value: unknown) {
  if (typeof value === "string") {
    console.log(value.toUpperCase()); // ✅
  }
}
```

---

## TS 3.7（2019年）: ?. と ?? の衝撃

- Optional Chaining と Nullish Coalescing
- JSより先にTSで使えた（Stage 3の段階で実装）

```typescript
// Before（3.7以前）
const city = user && user.address && user.address.city;

// After（3.7以降）
const city = user?.address?.city;
const port = config.port ?? 3000; // null/undefinedのみ代替
```

- 「TSを使うとJSの未来を先取りできる」の代表例

---

## TS 4.x（2020〜2022年）: 型表現力の爆発

- **4.0**: Variadic Tuple Types（可変長タプル）
- **4.1**: Template Literal Types（T-6で紹介）
- **4.9**: `satisfies` 演算子

```typescript
// satisfies: 型チェックしつつ推論結果を保つ
const config = {
  port: 3000,
  host: "localhost",
} satisfies Record<string, string | number>;

config.port.toFixed(); // ✅ number型として扱える
```

---

## TS 5.x（2023〜2025年）: モダン化の完成

- **5.0**: ECMAScript標準のDecorators対応
- **5.0**: `const` 型パラメータ
- **5.2**: `using` 宣言（リソース管理）
- **5.5**: 型述語の自動推論

```typescript
// 5.5: filterで型が自動的に絞り込まれる
const values = [1, "a", 2, "b"];
const nums = values.filter((v) => typeof v === "number");
// nums: number[]（5.4以前は (string | number)[] だった）
```

---

## 知っておくべき: TSのバージョン番号の秘密

- TypeScriptは**セマンティックバージョニングではない**
  - 「5.0」は「4.9」のメジャーアップデートではない
  - 4.9 → 5.0 は 4.8 → 4.9 と同じ感覚のリリース
- マイナーアップデートでも破壊的変更が入りうる
  - 型チェックの改善 = 今までエラーでなかった箇所がエラーに
- **ただし6.0 → 7.0は例外**
  - 史上初の「本当のメジャーアップデート」
  - 明確な非推奨→廃止のプロセスが設けられた

---

## 転換点: Project Corsa（2025年3月発表）

**「A 10x Faster TypeScript」— Anders Hejlsberg**

- コンパイラと言語サービスを**Goに移植**する計画を発表
- コードネーム「Corsa」
- 目標: コンパイル速度・メモリ効率・スケーラビリティの大幅改善
- JavaScript実装（tsc）の限界
  - シングルスレッドが基本、JITの起動コスト
  - 巨大プロジェクトでエディタの応答が遅い
- この計画が **6.0 =最後のJS版、7.0 = Go版** という構図を生んだ

---

## なぜGoだったのか

- **移植のしやすさ**: 既存コンパイラの構造をほぼそのまま移せる
  - 関数とデータ構造中心の設計がTSのコードベースと相性◎
- **ネイティブコード**: JITウォームアップ不要、即座に高速
- **共有メモリの並列処理**: goroutineで型チェックを並列化
- **GCあり**: コンパイラのメモリ管理パターンと一致

```
tsc (TypeScript実装)  → シングルスレッド + JIT
tsgo (Go実装)         → マルチスレッド + ネイティブ
                        → 約8〜12倍の高速化
```

---

## TS 6.0（2026年3月）: 最後のJS実装版

**位置づけ: 7.0への「橋渡し（bridge）」リリース**

- 6.0で新しいデフォルト値に切り替え
- 6.0で古い機能を**非推奨（deprecated）**に
- 7.0で非推奨機能を**完全廃止（removed）**

```
5.9 ──→ 6.0 ──────────────→ 7.0
        │ 非推奨警告が出る    │ 使うとエラー
        │ まだ動く           │ もう動かない
        └ ここで修正する！    └ 修正済みなら無風
```

---

## TS 6.0の新デフォルト（1）: strict

**`strict: true` がデフォルトに！**

```jsonc
// TS 5.xまで: 書かないと strict: false
{
  "compilerOptions": {
    "strict": true  // 明示的に書く必要があった
  }
}
// TS 6.0から: 何も書かなくても strict: true
```

- 12年かけて「strictがTypeScriptの標準」が公式化
- すべてのコードがstrict mode前提でチェックされる
- 新規プロジェクトのtsconfigが大幅にシンプルに

---

## TS 6.0の新デフォルト（2): module / target

| オプション | 旧デフォルト | 新デフォルト |
|-----------|------------|-------------|
| `module` | commonjs | **esnext** |
| `target` | es2020 | **es2025**（最新安定版） |

- ESModulesファースト時代の公式承認
  - 「デフォルトでCommonJSが出力される」時代の終わり
- targetは「現在の安定ECMAScript」に自動追従する方針
- T-2で学んだtsconfigの常識がアップデートされた

---

## TS 6.0の新デフォルト（3）: types / rootDir

| オプション | 旧デフォルト | 新デフォルト |
|-----------|------------|-------------|
| `types` | @typesを全列挙 | **[]（空）** |
| `rootDir` | 推論 | **tsconfigのある場所** |
| `noUncheckedSideEffectImports` | false | **true** |

- 使う型パッケージは `"types": ["node"]` のように明示する
- typesの明示だけでビルドが**20〜50%高速化**した例も

---

## TS 6.0の新機能（1）: サブパスimport

**`#/` で始まるサブパスインポート対応**

```typescript
// package.json側: { "imports": { "#/*": "./dist/*" } }

// 相対パス地獄からの解放（baseUrl不要！）
import { formatDate } from "#/utils/date";
```

- Node.js標準の仕組みに乗る → バンドラーとも互換

---

## TS 6.0の新機能（2）: es2025ライブラリ

```typescript
// RegExp.escape(): 正規表現の特殊文字を安全にエスケープ
const safe = RegExp.escape(userInput);
const re = new RegExp(`^${safe}$`);

// Temporal API（Stage 4）: Dateの後継の型定義
const now = Temporal.Now.plainDateISO();

// Map/WeakMapのupsertメソッド
counts.getOrInsert("key", 0);
counts.getOrInsertComputed("key", () => heavyInit());
```

- `dom.iterable` / `dom.asynciterable` も `dom` に統合

---

## TS 6.0の新機能（3）: その他

- **`moduleResolution: bundler` + `module: commonjs` の併用可**
  - バンドラー利用プロジェクトの設定が柔軟に
- **`--stableTypeOrdering` フラグ**
  - 型の表示順をコンパイルごとに安定させる
  - 6.0と7.0の出力差分を調査するための移行支援ツール
  - 最大25%遅くなるため常用は非推奨
- **推論の改善**
  - `this` を使わない関数の文脈依存推論を削減
  - ジェネリックJSX呼び出し内の関数式チェックを強化

---

## 非推奨の仕組み: ignoreDeprecations

```jsonc
// TS 6.0で非推奨オプションを使うとエラー
// 一時的に黙らせるには:
{
  "compilerOptions": {
    "ignoreDeprecations": "6.0",
    "baseUrl": "./src"  // ← 非推奨だが動く
  }
}
```

- **これは延命措置であって解決策ではない**
- TS 7.0では `ignoreDeprecations: "6.0"` ごと無効に
- 5.0 → 5.5の時も同じ仕組みが使われた（`"5.0"`指定）

---

## ここからが本題

# TS 6で非推奨 → TS 7で廃止された要素

**全部で約10項目。1つずつ見ていく**

- 対象は主に「コンパイラオプション」と「古い構文」
- 型システム自体（型の書き方）はほぼ無傷
- つまり: **コードよりtsconfigの修正が中心**

---

## 廃止（1）: target: es5

```jsonc
{ "compilerOptions": { "target": "es5" } } // ❌ TS 7でエラー
```

- **最低ターゲットがES2015（ES6）に**
- `downlevelIteration` フラグも同時に廃止
  - ES5向けにfor-ofを変換する仕組み → 不要に
- 背景: IE11終了（2022年）でES5環境は事実上消滅
- 対処: `"target": "es2015"` 以上に変更するだけ

---

## 廃止（2）: moduleResolution: node（node10）

```jsonc
// ❌ 廃止
{ "moduleResolution": "node" }    // 実体はNode.js 10相当
{ "moduleResolution": "classic" } // TS初期の独自解決

// ✅ TS 7ではこの2択
{ "moduleResolution": "nodenext" } // Node.jsで実行する
{ "moduleResolution": "bundler" }  // バンドラーでビルドする
```

- 「node」という名前なのに**現代のNode.jsと挙動が違う**罠だった
- exports/importsフィールドを解釈できない古い仕様
- T-2・T-6で学んだ「nodenext / bundler」が正式に唯一解へ

---

## 廃止（3）: baseUrl

```jsonc
// ❌ 廃止: { "baseUrl": "./src", "paths": { "@app/*": ["app/*"] } }
// ✅ 対処: pathsを相対パスで書く（baseUrl不要）
{ "paths": { "@app/*": ["./src/app/*"] } }
```

- baseUrlは「実行時に存在しないパス解決」を生む元凶だった
  - tscは解決できるがNode.jsでは動かない、という事故
- 新規なら `#/` サブパスimport（package.json準拠）が推奨

---

## 廃止（4）: 古いモジュール形式

```jsonc
// ❌ すべて廃止
{ "module": "amd" }      // RequireJS時代の形式
{ "module": "umd" }      // AMD+CommonJS両対応形式
{ "module": "system" }   // SystemJS形式
{ "module": "none" }
```

- **`outFile` オプションも廃止**
  - 複数ファイルを1つに連結出力する機能
  - AMD/System専用だった → バンドラーの仕事に
- T-1で学んだ「モジュール戦争」の敗者たちがついに退場
- 対処: `esnext` / `nodenext` / `commonjs` へ

---

## 廃止（5）: 相互運用フラグのfalse設定

```jsonc
// ❌ falseに設定すること自体が廃止
{ "esModuleInterop": false }
{ "allowSyntheticDefaultImports": false }
{ "alwaysStrict": false }
```

- `esModuleInterop: true` が唯一の挙動に
  - CommonJSとESModulesの変換の非互換がついに統一
- `alwaysStrict` も常時true
  - **すべてのコードがstrict mode前提**
- 対処: フラグの行を削除するだけ（trueがデフォルト）

---

## 廃止（6）: module キーワードの名前空間

```typescript
// ❌ 廃止: TS 1.x時代の「internal module」構文
module MyLib {
  export function helper() {}
}

// ✅ namespace構文（こちらは存続）
namespace MyLib {
  export function helper() {}
}
```

- ES2015で `module` がJS用語になり紛らわしさの塊に
- 10年以上「namespaceを使え」と言われ続けてきた
- そもそもESModules時代にnamespace自体ほぼ出番なし

---

## 廃止（7）: import assertions（assert）

```typescript
// ❌ 廃止: assertキーワード（旧提案の構文）
import config from "./config.json" assert { type: "json" };

// ✅ withキーワード（Import Attributes、ES標準）
import config from "./config.json" with { type: "json" };
```

- TC39の提案が `assert` → `with` に仕様変更された
- 動的importの `import()` 呼び出しでも同様に廃止
- V8などのJSエンジン側もassert構文を削除済み
- 対処: 機械的に `assert` → `with` へ置換

---

## 廃止（8）: その他のレガシー

- **`/// <reference no-default-lib="true"/>`** ディレクティブ廃止
  - 標準ライブラリを除外する古い指定方法
- **CLIの挙動変更**: tsconfig.jsonがある場所で
  ファイル名を指定して実行するとエラーに

```bash
# ❌ TS 6以降エラー（tsconfigと競合するため）
tsc src/index.ts

# ✅ tsconfigを無視する意図を明示
tsc --ignoreConfig src/index.ts
```

---

## 廃止まとめ表（tsconfig編）

| 廃止された設定 | 移行先 |
|--------------|--------|
| `target: es5` / `downlevelIteration` | `es2015` 以上 |
| `moduleResolution: node` / `classic` | `nodenext` / `bundler` |
| `baseUrl` | 相対 `paths` / `#/` imports |
| `module: amd` / `umd` / `system` / `none` | `esnext` 等 |
| `outFile` | バンドラー |
| `esModuleInterop` / `alwaysStrict` のfalse | 常にtrue |

---

## 廃止まとめ表（構文編）

| 廃止された構文 | 移行先 |
|--------------|--------|
| `module Foo {}`（名前空間） | `namespace Foo {}` |
| `import ... assert { }` | `import ... with { }` |
| `/// <reference no-default-lib/>` | libオプション |
| JSDocの `@enum` / `@constructor` | TypeScriptで書く |

- 通常のTSコードで直撃するのは実質 `assert` くらい
- **恐れるほどの破壊的変更ではない**（設定が中心）

---

## TS 7.0（2026年7月8日GA）

**コンパイラと言語サービスが完全にGoネイティブに**

- コマンドは `tsc` の後継として **`tsgo`**
- フルビルドで**約8〜12倍**の高速化
- 共有メモリ並列処理でマルチコアを最大活用
- 6.0のデフォルト値を継承し、非推奨項目をすべて削除

```bash
npm install typescript@7
npx tsgo --project tsconfig.json
```

---

## TS 7.0の実測パフォーマンス

**Microsoftによる実プロジェクトでの計測結果**

| プロジェクト | tsc 6.0 | tsgo 7.0 | 倍率 |
|------------|---------|----------|------|
| Sentry | 133.1秒 | 16.3秒 | 8.2x |
| VS Code | 89.1秒 | 8.7秒 | 10.2x |
| TypeORM | 15.8秒 | 1.1秒 | 9.9x |
| Playwright | 9.3秒 | 1.2秒 | 7.5x |

- エディタの読み込みも劇的改善、CI短縮はコストに直結

---

## 型チェックの互換性は？

**「速くなったら結果が変わる」のでは？ → ほぼ変わらない**

- 約20,000件のコンパイラテストのうち
  新旧で差が出るのは**わずか74件**
- 残る差分も理由が明確
  - 実装途中の機能（正規表現構文チェック等）
  - 意図的な仕様変更
- 型システムのセマンティクスは忠実に移植
- **T-3〜T-6で学んだ型の知識はTS 7でもすべて有効**

---

## TS 7.0の破壊的変更: API編

- **TS 5.9系のコンパイラAPIと非互換**
  - Goで動くため、JSからAPIを直接呼べない
- 言語サービスプラグインは**LSP（Language Server Protocol）ベース**に
  - 独自のTSServerプロトコルは廃止
  - VS Code以外のエディタとの互換性はむしろ向上
- 影響を受けるもの
  - ts-loaderなどコンパイラAPI依存のツール
  - カスタムlintルール、コード生成ツール
- エコシステムのツールは順次対応が進行中

---

## TS 7.0の現時点の制限事項

- **JS出力（emit）**: es2021以前のtargetへの
  ダウンレベル変換は未対応の部分あり
  - デコレータのダウンレベルコンパイル未対応
- **watchモード**: 旧tscより非効率な場合がある
  - 回避策: nodemon + `--incremental`
- **JSファイルのチェック**: JSDocサポートを簡素化
  - `@enum` / `@constructor` タグ削除
  - `Object` 型を `any` 扱いする緩い規則も削除
- 制限は今後のマイナーリリースで順次解消予定

---

## 移行戦略: 3ステップ

```
Step 1: 5.x → 6.0 にアップグレード
        └ 非推奨警告をすべて修正（tsconfig中心）
Step 2: 6.0 で安定運用
        └ ignoreDeprecations を消せる状態にする
Step 3: 6.0 → 7.0 にアップグレード
        └ 警告ゼロなら基本的に無風
```

- 公式移行ツール **`ts5to6`** がtsconfig修正を自動化
- **絶対にやってはいけないこと**: 5.x → 7.0 の一足飛び
  - 非推奨警告という「予告」を見ずに廃止エラーの山へ

---

## 移行例: Before（TS 5.x時代のtsconfig）

```jsonc
{
  "compilerOptions": {
    "target": "es5",                // ❌ 廃止
    "module": "commonjs",
    "moduleResolution": "node",     // ❌ 廃止
    "baseUrl": "./src",             // ❌ 廃止
    "paths": { "@app/*": ["app/*"] },
    "strict": true,                 // 6.0からデフォルト
    "esModuleInterop": true,        // 6.0からデフォルト
    "outDir": "./dist"
  }
}
```

---

## 移行例: After（TS 7.0対応のtsconfig）

```jsonc
{
  "compilerOptions": {
    "target": "es2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "paths": { "@app/*": ["./src/app/*"] },
    "types": ["node"],   // 明示が必要（新デフォルトは[]）
    "rootDir": "./src",
    "outDir": "./dist"
  }
}
```

**行数が減った = デフォルトが賢くなった証拠**

---

## 6.0と7.0の併用という選択肢

**両方インストールして使い分けができる**

```bash
# 型チェック＆ビルド: 高速なtsgo（7.0）
npx tsgo --noEmit

# 旧APIが必要なツール用: tsc（6.0）を残す
npm install typescript@6 --save-dev
```

- 6.0は今後**パッチリリースのみ**（6.0.1, 6.0.2...）
  - セキュリティ修正と重大なリグレッションだけ
  - 新機能の開発リソースはすべて7.x系へ
- 移行期の現実解として公式が認めている運用

---

## エコシステムへの影響

- **VS Code**: ネイティブ版拡張機能が提供済み
  - auto-import、rename、find-all-references対応済み
- **バンドラー**: Vite / esbuild / SWCは型を消すだけ
  - → もともとtscに依存せず、影響小
  - 型チェックは `tsgo --noEmit` をCIで実行する構成へ
- **試すだけなら**: `@typescript/native-preview`
  - GA前からnpmで先行提供されていたプレビュー版
- FシリーズのNext.js、BシリーズのHonoも順次TS 7対応

---

## 最新情報を追いかけるには

- **TypeScript公式ブログ**（devblogs.microsoft.com/typescript）
  - 「Announcing TypeScript X.X」= リリースノート
  - Beta → RC → 正式版 の3段階で告知
- **GitHubのIteration Plan**
  - 次バージョンの計画がIssueで公開されている
- **Roadmap / Deprecation List**
  - 6.0 Deprecation List（Issue #54500）は必読
- 英語だが、リリースノートは**コード例が豊富**
  - コードを読むだけでも概要が掴める

---

## この授業のまとめ（1）: 歴史

- TSは2014年の1.0から**漸進的に**進化してきた
  - 2.0: strictNullChecks / 2.8: Conditional Types
  - 3.7: Optional Chaining / 4.1: Template Literal Types
  - 4.9: satisfies / 5.0: Decorators
- セマンティックバージョニングではない
  - ただし6→7だけは本物のメジャーアップデート
- 2026年、Project Corsaにより歴史的転換
  - **6.0 = 最後のJS実装版（2026年3月）**
  - **7.0 = Goネイティブ版GA（2026年7月8日）**

---

## この授業のまとめ（2）: 6で非推奨→7で廃止

- 廃止の中心は**tsconfigのレガシー設定**
  - `target: es5`、`moduleResolution: node`、`baseUrl`
  - `module: amd/umd/system`、`outFile`
  - `esModuleInterop: false` などのfalse指定
- 構文の廃止は少ない
  - `module` キーワード名前空間、import `assert`
- 新デフォルト: `strict: true`、`module: esnext`
- 移行は **5.x → 6.0（警告修正）→ 7.0** の順で
- 型システムの知識（T-3〜T-6）はそのまま通用する

---

## T/Pシリーズ完結、そして次へ

```
T-1〜T-6: TypeScriptの文法と型システム
    ↓
Pシリーズ: 実践パターン演習（Array〜.d.ts）
    ↓
T-7:      バージョンの変遷と未来（今回、番外編）
    ↓
Fシリーズ（Frontend） / Bシリーズ（Backend)
```

- 言語は進化し続ける。**追いかけ方**を身につけた者が強い
- tsconfigの1行1行の意味が分かる開発者になろう
- 次の現場で「TS 7移行」を任されたら、この授業の出番

---

## 参考リンク

- [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- [Progress on TypeScript 7 (December 2025)](https://devblogs.microsoft.com/typescript/progress-on-typescript-7-december-2025/)
- [A 10x Faster TypeScript (Corsa発表)](https://devblogs.microsoft.com/typescript/typescript-native-port/)
- [6.0 Deprecation List (Issue #54500)](https://github.com/microsoft/TypeScript/issues/54500)
- [TypeScript Roadmap](https://github.com/microsoft/TypeScript/wiki/Roadmap)
- [@typescript/native-preview (npm)](https://www.npmjs.com/package/@typescript/native-preview)
