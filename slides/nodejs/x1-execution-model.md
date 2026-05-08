---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# Node.js講義 番外編
## 実行モデル・コンテナ・周辺ランタイム・バージョン管理

---

# この授業で学ぶこと

**「コードがどう実行されるか」を理解する**

1. Go と TypeScript の実行モデルの違い
2. Dockerコンテナでの見え方の違い
3. Bun / Deno という次世代ランタイム
4. Node.jsを選ぶ理由とLTS
5. miseによるバージョン管理
6. npm / yarn / pnpm の違い

---

# 1. なぜ「実行モデル」から始めるのか

**Node.jsのAPIを覚える前に、前提を押さえる**

- 依存関係の入れ方
- Dockerfileの書き方
- CI/CDの設計
- デプロイ方式

**すべて「誰が・いつ・どこで実行するか」に繋がる**

---

# 2. Go と TypeScript の実行モデル

## 大きな違い

| 観点 | Go | TypeScript |
|:---|:---|:---|
| 実行前 | コンパイル | 型チェック→変換 |
| 実行物 | ネイティブバイナリ | JavaScript |
| 実行時に必要 | バイナリのみ | JavaScriptランタイム |
| 型情報 | 実行物に反映 | コンパイル後に消える |

---

## Go の実行モデル

```
main.go
  ↓ go build
実行可能バイナリ
  ↓ OSが直接実行
```

**「ビルド済みの実行物を持ち歩く」**

```bash
go build -o app
go install
```

---

## TypeScript の実行モデル

```
index.ts
  ↓ tsc
index.js
  ↓ Node.jsなどで実行
```

**「JavaScriptを安全に書くための言語」**

```bash
npx tsc index.ts
node index.js
```

型情報は実行時に消える

---

# 3. Dockerコンテナでの違い

**Dockerは「違いを見えやすくする道具」**

---

## Goコンテナ

```dockerfile
# Build stage
FROM golang:1.23 AS builder
WORKDIR /app
COPY . .
RUN go build -o app

# Run stage
FROM gcr.io/distroless/static
COPY --from=builder /app/app /app
CMD ["/app"]
```

**「実行ファイルの箱」- 小さく・シンプルに**

---

## Node.js/TypeScriptコンテナ

```dockerfile
# Build stage
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage
FROM node:22-alpine
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

**「ランタイム上で動かす箱」**

---

## コンテナ比較

| 観点 | Go | Node.js |
|:---|:---|:---|
| 起動 | バイナリ直接 | NodeがJSを読み込む |
| 本番イメージ | 小さくしやすい | ランタイム必要 |
| 依存関係 | ビルド時に解決 | 実行時も意識 |
| 開発体験 | 再ビルド中心 | watch/hot reload |

---

# 4. 次世代ランタイム

**Node.js以外の選択肢**

---

## Bun

**「便利機能を標準に積極的に取り込む」**

```typescript
// S3互換ストレージを標準APIで
const file = await Bun.s3("s3://bucket/file.txt").text();
const blob = await Bun.s3("s3://bucket/image.png").blob();
```

- AWS S3 / Cloudflare R2 / MinIO 対応
- 独自拡張が豊富
- 実行速度も特徴

---

## Deno

**「ランタイムとインフラの統合」**

```typescript
// Deno KV - ローカルと本番で透過的に切り替わる
const kv = await Deno.openKv();
await kv.set(["users", "123"], { name: "Taro" });
const user = await kv.get(["users", "123"]);
```

- Deno KV: SQLite(ローカル) / FoundationDB(本番)
- Deno Deployまで含めた一体設計

---

## Bun vs Deno

| 観点 | Bun | Deno |
|:---|:---|:---|
| 方向性 | 機能の統合 | インフラ統合 |
| 特徴 | S3などを標準APIに | KVなどランタイム内蔵 |
| 互換性 | Node.js互換重視 | 独自路線から後退 |

**この授業では「Node.js以外にもある」と知っておくだけでOK**

---

# 5. なぜNode.jsを使うのか

---

## 採用理由

**「JavaScript/TypeScriptの実務で最も標準的」**

- ライブラリが最も豊富
- ツールの前提になっている
- ホスティング/CI/CDの標準
- 求人・情報が最も多い

**まずNode.jsを押さえてから、他も比較しやすくなる**

---

## Node.jsのバージョン戦略

**「最新ではなくLTSを使う」**

```
Current (奇数) → 6ヶ月
Current (偶数) → LTS (30ヶ月)
```

| 種別 | 用途 |
|:---|:---|
| Current | 新機能検証 |
| Active LTS | 本番運用 |
| Maintenance LTS | 移行期間 |

---

# 6. miseによるバージョン管理

**「プロジェクトごとにNode.jsの版を固定する」**

---

## なぜ必要か

**「同じJavaScriptでもNodeの版差で動かない」**

```bash
# プロジェクトごとに異なるNode.jsを使い分け
mise use node@22
mise use node@20
mise install
```

- チーム全員が同じ版で開発
- 「自分の環境では動く」問題を防ぐ

---

## miseの基本

```bash
# Node.js版を指定
mise use node@22

# インストール
mise install

# 確認
node -v  # v22.x.x

# mise.tomlに記録
cat mise.toml
# [tools]
# node = "22"
```

**「マシン側でNodeの版をそろえる」**

---

# 7. パッケージマネージャ

**npm / yarn / pnpm の違い**

---

## 3者比較

| 観点 | npm | yarn | pnpm |
|:---|:---|:---|:---|
| 立ち位置 | 基準・標準 | DX重視の老舗 | 高速・省ディスク |
| 強み | まず通じる | workspaces等 | モノレポ適性 |
| 初学者 | ◎基準にする | △代替として知る | ◎実務で有力 |

---

## 選び方

**「概念はnpmベースで学び、実務ではpnpmが有力」**

```bash
# npm (標準)
npm install
npm run dev

# yarn
yarn install
yarn dev

# pnpm (推奨)
pnpm install
pnpm dev
```

---

# 8. package.jsonのバージョン設定

**「プロジェクト側で想定環境を宣言する」**

---

## engines

**「このプロジェクトはこのNode.js版で動く」**

```json
{
  "engines": {
    "node": ">=22 <25",
    "npm": ">=10"
  }
}
```

- 互換性の警告として機能
- 完全な強制ではない「札」

---

## packageManager

**「パッケージマネージャも固定する」**

```json
{
  "packageManager": "pnpm@10.0.0"
}
```

```json
{
  "packageManager": "yarn@4.0.0"
}
```

- Corepack連携で自動的に正しい版を使用

---

## まとめ：バージョン管理の3層

| 層 | 役割 | 設定場所 |
|:---|:---|:---|
| マシン側 | Node.js版を固定 | `mise.toml` |
| プロジェクト | 想定Node版を宣言 | `engines` |
| パッケージ | マネージャを固定 | `packageManager` |

---

## 最小構成例

```json
{
  "name": "my-app",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "engines": {
    "node": ">=22 <25"
  },
  "scripts": {
    "dev": "node index.js"
  }
}
```

---

# 9. まとめ

---

## 今日のポイント

| 項目 | 覚えておくこと |
|:---|:---|
| Go | ビルド済みバイナリを実行 |
| TypeScript | JavaScriptに変換→ランタイムで実行 |
| Docker | 違いがより明確に見える |
| Bun/Deno | Node.js以外の設計思想がある |
| Node.js | 実務標準、LTSを使う |
| mise | プロジェクトごとに版を固定 |
| package.json | `engines`と`packageManager`を確認 |

---

## 次回への準備

**この理解があれば次がスムーズ**

- 依存関係の入れ方
- Dockerfileの書き方
- CI/CDの設計
- デプロイ方式

**「コードは誰が・いつ・どこで実行するか」**
この問いを常に意識する

---

# 参考リンク

- [Node.js Releases](https://nodejs.org/en/about/releases/)
- [mise](https://mise.jdx.dev/)
- [npm package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json)
- [Bun](https://bun.com/)
- [Deno](https://deno.com/)
- [Docker Node.js Guide](https://docs.docker.com/guides/nodejs/)
