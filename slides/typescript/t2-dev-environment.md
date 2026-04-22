---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# T-2: 開発環境
## Node.js / npm / ビルドシステム / TSC

---

## この授業のゴール

**「npx tsc index.ts がなぜ動くか全部説明できる」**

- Node.jsの仕組み
- npmとパッケージ管理
- モジュールシステムの歴史
- バンドラーの役割
- TypeScript Compilerの理解

---

## Node.jsとは何か（もう少し深く）

### V8 (Google製JSエンジン) + libuv (非同期I/Oライブラリ)

```
┌─────────────────────────────────────┐
│           Node.js                    │
│  ┌─────────────┐  ┌──────────────┐  │
│  │    V8       │  │    libuv     │  │
│  │  (JSエンジン)│  │ (非同期I/O)   │  │
│  │             │  │              │  │
│  │ ・JITコンパイル│  │ ・イベントループ│  │
│  │ ・高速実行    │  │ ・非同期ファイル │  │
│  │ ・C++実装   │  │ ・ネットワーク  │  │
│  └─────────────┘  └──────────────┘  │
└─────────────────────────────────────┘
        │                    │
        ▼                    ▼
   JavaScript実行        OSシステムコール
```

### 「ブラウザなしでJSを動かす実行環境」

```javascript
// ブラウザ
window.alert('Hello');     // ✅ グローバルオブジェクト
document.querySelector();  // ✅ DOM API
fetch('/api');             // ✅ ネットワーク

// Node.js
global.console.log('Hello');  // ✅ グローバルオブジェクト
fs.readFileSync();            // ✅ ファイルシステム
http.createServer();          // ✅ HTTPサーバー
document;                     // ❌ undefined (DOMはない)
```

---

## イベントループ（概念だけ）

### なぜシングルスレッドで並行処理できるか

```
┌─────────────────────────────────────────┐
│              イベントループ               │
│                                         │
│  ┌──────────────┐                       │
│  │   コールスタック  │ ◄── 現在実行中の関数    │
│  │  (Call Stack)  │                       │
│  └──────────────┘                       │
│         │                               │
│         ▼                               │
│  ┌──────────────┐    ┌──────────────┐   │
│  │  マイクロタスク   │    │  コールバックキュー  │   │
│  │  (Promise等)   │    │  (setTimeout等)   │   │
│  └──────────────┘    └──────────────┘   │
│         │                    │          │
│         └────────┬───────────┘          │
│                  ▼                      │
│           スタックが空になったら          │
│           キューから取り出す              │
└─────────────────────────────────────────┘
```

**ポイント**
- シングルスレッドなのに非同期処理ができる
- 重い処理をブロックせずに並行実行
- Promise/async-awaitはマイクロタスクとして優先実行

---

## npm とは何か

### Node Package Manager: 世界最大のパッケージレジストリ

```bash
# npmでパッケージをインストール
npm install lodash

# 160万+ のパッケージが公開されている
# https://www.npmjs.com/
```

### package.json の読み方

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",      // 本番で必要
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",   // 開発時のみ必要
    "vite": "^4.0.0"
  }
}
```

### devDependencies vs dependencies

| 種類 | 用途 | 例 |
|------|------|-----|
| **dependencies** | 本番コードで使用 | React, Next.js, Express |
| **devDependencies** | 開発・ビルド時のみ | TypeScript, ESLint, Vitest |

---

## package-lock.json の役割

### バージョンの固定

```json
// package.json (曖昧)
"lodash": "^4.17.0"  // 4.17.0以上4.x.x

// package-lock.json (厳密)
{
  "lodash": {
    "version": "4.17.21",
    "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
    "integrity": "sha512-..."
  }
}
```

**なぜ必要？**
- チーム全員が同じバージョンを使う
- 再現性のあるビルド
- セキュリティ脆弱性の追跡

---

## node_modules という存在

### install すると何が起きているか

```bash
npm install lodash

# 実際に起きていること:
# 1. npm registryからlodashをダウンロード
# 2. lodashのpackage.jsonを読む
# 3. lodashの依存パッケージもダウンロード
# 4. 依存の依存もダウンロード
# 5. 再帰的に続く...
```

### node_modules の中身

```
my-app/
├── package.json
├── package-lock.json
└── node_modules/
    ├── lodash/
    │   ├── package.json
    │   └── index.js
    └── lodashの依存/
        └── さらにその依存/
            └── ...無限に続く
```

### なぜ容量が爆大きくなるか

```bash
# 1つのパッケージが平均10個の依存を持つと仮定
# lodash → 0依存（例外）
# react → 数個の依存
# next → 100+ の依存

$ du -sh node_modules
500M    node_modules  # 普通にこのサイズ

$ ls node_modules | wc -l
1500    # 1500個以上のフォルダ
```

### .gitignore に入れる理由

```gitignore
# .gitignore
node_modules/
# 理由:
# 1. 容量が大きすぎる
# 2. package.json + lockから再現可能
# 3. OS/環境依存のバイナリが含まれる
```

---

## npm / yarn / pnpm の違い

### npm: 標準・遅かった時代がある

```bash
# npm (Nodeに同梱)
npm install

# 問題:
# - 並列インストールが遅い
# - node_modulesが重複して肥大化
```

### yarn: Facebook製・lockfileを普及させた

```bash
# yarn (2016年登場)
yarn install

# 改善点:
# - 並列ダウンロードで高速化
# - yarn.lockで厳密なバージョン管理
# - ワークスペース機能
```

### pnpm: ハードリンクで容量節約・現代の最良解

```bash
# pnpm (2017年登場)
pnpm install

# 革新的アプローチ:
# - グローバルストアに1回だけ保存
# - ハードリンクで各プロジェクトに参照
# - node_modulesが軽い！

$ du -sh node_modules  # pnpmの場合
50M     # npmの1/10以下
```

**2025年の推奨: pnpm**

---

## モジュールシステムの歴史と混乱

### なぜモジュールが必要か

```javascript
// Before: グローバル汚染の問題
// file1.js
var name = 'Alice';  // グローバルに漏れる

// file2.js
var name = 'Bob';    // 上書きしてしまう！

// index.html
<script src="file1.js"></script>
<script src="file2.js"></script>
<script>
  console.log(name);  // "Bob" (意図しない結果)
</script>
```

### CommonJS (require / module.exports)

```javascript
// Node.jsの歴史的方式 (2009年〜)
// math.js
function add(a, b) {
  return a + b;
}
module.exports = { add };

// index.js
const math = require('./math');
console.log(math.add(1, 2));

// 動的にrequire可能
if (condition) {
  const module = require('./optional');
}
```

### ESModules (import / export)

```javascript
// ブラウザ標準 / ES6で追加 (2015年〜)
// math.mjs or "type": "module"
export function add(a, b) {
  return a + b;
}

// index.mjs
import { add } from './math.js';
console.log(add(1, 2));

// 静的解析可能
// importはファイルの先頭に固定
```

### なぜ今も両方存在するか

```
CommonJS                          ESModules
──────────                        ─────────
Node.jsの歴史的方式                ECMAScript標準
require()                         import
module.exports                    export
動的                              静的
実行時に解決                      パース時に解決
npmの大部分がこれ                 モダンJSの標準
```

### 現代のTS: ESMで書いてツールが変換する

```typescript
// TypeScript (ESModulesで書く)
import { helper } from './utils';
export const result = helper();

// コンパイル後 (CommonJSに変換)
const { helper } = require('./utils');
exports.result = helper();

// または (ESMのまま)
import { helper } from './utils';
export const result = helper();
```

---

## バンドラーとはなぜ必要か

### 大量のimportを1ファイルにまとめる

```javascript
// Before: バンドラーなし
// index.html
<script src="node_modules/react/index.js"></script>
<script src="node_modules/react-dom/index.js"></script>
<script src="node_modules/lodash/index.js"></script>
<!-- 100個の<script>タグ！ -->
<script src="src/utils.js"></script>
<script src="src/components.js"></script>
<script src="src/app.js"></script>

// 問題:
// - HTTPリクエストが100回発生
// - ブラウザの同時接続制限(6個)
// - パフォーマンスが悪い
```

```javascript
// After: バンドラーあり
// bundle.js (1ファイルにまとめられる)
// - React
// - ReactDOM
// - lodash
// - アプリコード
// 全部1ファイル！

<script src="dist/bundle.js"></script>
// 1リクエストで済む
```

### Tree Shaking: 使っていないコードを削除

```javascript
// utils.js
export function used() { return 'used'; }
export function unused() { return 'never called'; }

// app.js
import { used } from './utils';
console.log(used());

// バンドル後:
// unused関数は削除される！
// ファイルサイズが小さくなる
```

### Minify: 変数名を短縮

```javascript
// Before
function calculateTotalPrice(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// After (Minified)
function c(t){return t.reduce((s,i)=>s+i.p,0)}
// 変数名が1文字に、空白削除
```

---

## バンドラーの変遷

### Webpack: 設定が複雑・重い・でも全部できる

```javascript
// webpack.config.js (複雑...)
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  // ...100行以上続く
};
```

### esbuild: Go製・爆速・他ツールの内部エンジン

```bash
# esbuild (2020年登場)
# Goで書かれた超高速バンドラー

$ esbuild app.jsx --bundle --outfile=out.js
# 1秒以内で完了 (Webpackの100倍速い)

# 他のツールの内部エンジンとして採用
# - Vite (開発時)
# - tsx
```

### Vite: esbuild内蔵・開発時はバンドルしない

```bash
# Vite (2020年登場)
# 開発時: ES Modulesをそのまま使用
# 本番: Rollupでバンドル

npm create vite@latest

# 特徴:
# - 開発サーバーが秒速で起動
# - Hot Module Replacement (HMR) が超高速
# - 現在のフロントエンドのデファクト
```

### Turbopack: Rust製・Nextに組み込まれていく

```bash
# Turbopack (2022年発表)
# Rustで書かれたWebpackの後継

# Next.js 13+ で使用可能
next dev --turbo

# 目標:
# - Webpackより700倍速い
# - 設定不要
```

---

## TypeScript Compiler (TSC) の役割

### TSCが提供するもの2つ

```
TypeScript Compiler
├─ ① トランスパイル: TS → JS に変換
└─ ② 型チェック: 型エラーを検出
```

### ① トランスパイル: TS → JS

```typescript
// TypeScript (入力)
const greet = (name: string): string => {
  return `Hello ${name}`;
};

// JavaScript (出力)
const greet = (name) => {
  return `Hello ${name}`;
};
// 型注釈 (: string) が消える
```

### ② 型チェック: エラーを検出

```typescript
function add(a: number, b: number): number {
  return a + b;
}

add("1", "2");  // ❌ コンパイルエラー！
// Argument of type 'string' is not assignable to parameter of type 'number'.
```

---

## 現代のTSCの立ち位置

### 「型チェックはTSC、変換はesbuild/Vite」

```
現代のTypeScript開発
┌─────────────────────────────────────┐
│  開発時                              │
│  - Vite (esbuild) が超高速変換        │
│  - TSCはIDEで型チェック               │
│  - tsc --noEmit はCIで実行            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  本番ビルド                           │
│  - Vite/Rollup/esbuild が変換         │
│  - TSCは型チェックのみ                 │
│  - 型情報は最終的なJSに含まれない       │
└─────────────────────────────────────┘
```

### tsc --noEmit: JSを出力せず型チェックだけ

```bash
# 型チェックのみ (JSを出力しない)
npx tsc --noEmit

# CIで使う
# - 型エラーがあればビルド失敗
# - 実際のビルドは別ツールが担当

# package.json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "tsc --noEmit && vite build"
  }
}
```

---

## tsconfig.json の読み方

```json
{
  "compilerOptions": {
    "strict": true,           // 絶対に有効にすべき
    "target": "ES2020",       // 出力JSのバージョン
    "module": "ESNext",       // モジュール形式
    "moduleResolution": "bundler",  // モジュール解決戦略
    "lib": ["ES2020", "DOM", "DOM.Iterable"],  // 使えるAPI
    "jsx": "react-jsx",       // JSX変換方式
    "paths": {                // パスエイリアス
      "@/*": ["./src/*"]
    },
    "esModuleInterop": true,  // CommonJSとの互換
    "skipLibCheck": true,     // 型定義ファイルのチェック省略
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### 重要オプション解説

| オプション | 説明 | 推奨値 |
|-----------|------|--------|
| **strict** | 厳格な型チェック | `true` (絶対) |
| **target** | 出力JSのESバージョン | `ES2020` |
| **module** | モジュール形式 | `ESNext` |
| **paths** | パスエイリアス | `@/*` |

---

## strict: true → 絶対に有効にすべき理由

```json
{
  "compilerOptions": {
    "strict": true  // これだけで全て有効
  }
}
```

**strictが有効にするもの:**
- `noImplicitAny`: any型を暗黙的に使わせない
- `strictNullChecks`: null/undefinedを厳密にチェック
- `strictFunctionTypes`: 関数の型を厳密に
- `strictBindCallApply`: bind/call/applyを厳密に
- などなど...

```typescript
// strict: false (危険)
function greet(name) {  // nameが暗黙的にany
  return name.toUpperCase();  // ランタイムエリーの可能性
}
greet(null);  // コンパイル通る

// strict: true (安全)
function greet(name: string) {
  return name.toUpperCase();
}
greet(null);  // ❌ コンパイルエラー！
```

---

## ハンズオン：ゼロからTSを動かす

### Step 1: プロジェクト作成

```bash
# 1. フォルダ作成
mkdir my-ts-app
cd my-ts-app

# 2. npm初期化
npm init -y

# 3. TypeScriptインストール
npm install --save-dev typescript
```

### Step 2: TypeScriptコードを書く

```typescript
// index.ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}

const message = greet("TypeScript");
console.log(message);
```

### Step 3: コンパイルして実行

```bash
# コンパイル (TS → JS)
npx tsc index.ts

# 生成されたJSを確認
cat index.js
# function greet(name) {
#     return "Hello, " + name + "!";
# }

# 実行
node index.js
# Hello, TypeScript!
```

### Step 4: tsconfig.jsonを作成

```bash
# 設定ファイル作成
npx tsc --init

# 生成されたtsconfig.jsonを編集
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Step 5: ts-node / tsx で直接実行

```bash
# ts-node (型チェック付き)
npm install --save-dev ts-node
npx ts-node index.ts

# tsx (高速、型チェックなし)
npm install --save-dev tsx
npx tsx index.ts
```

---

## まとめ・次回予告

### 今日学んだこと

1. ✅ Node.js = V8 + libuv
2. ✅ イベントループでシングルスレッド並行処理
3. ✅ npm = パッケージマネージャー
4. ✅ node_modulesは.gitignore必須
5. ✅ pnpmが現代の最良解
6. ✅ CommonJS vs ESModulesの歴史
7. ✅ バンドラーでファイルをまとめる
8. ✅ Viteが現代のデファクト
9. ✅ TSC = 型チェック + トランスパイル
10. ✅ strict: true は絶対に有効に
11. ✅ tsconfig.json の読み方

### 次回予告: T-3

**「基本型システム — プリミティブからUnion/Intersectionまで」**

- string/number/boolean/null/undefined
- Array/Tuple
- Union型 (|)
- Intersection型 (&)
- Literal型
- any/unknown/never

**次回もお楽しみに！**

---

## 参考リンク

- [Node.js Architecture](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [npm Documentation](https://docs.npmjs.com/)
- [pnpm Documentation](https://pnpm.io/)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [Vite Documentation](https://vitejs.dev/)
- [Module Systems Explained](https://nodejs.org/api/esm.html)
