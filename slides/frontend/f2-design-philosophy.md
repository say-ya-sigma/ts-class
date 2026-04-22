---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# F-2: Design Philosophy

## Component Design / Atomic Design Critique

---

# 1. この授業のゴール

## 学習目標

**✅ アトミックデザインを理解する**
- なぜ生まれたのか
- どこで有効なのか

**✅ アトミックデザインの限界を知る**
- アプリコードでの苦しみ
- より良い代替案

**✅ 実践的なコンポーネント設計を身につける**
- コロケーション
- BulletProof React
- Rule of Three

---

# 2. アトミックデザインとは

## Brad Frostが提唱した5層構造

```
┌─────────────────────────────────────┐
│           5. Pages                  │
│      ページ（実際のインスタンス）      │
├─────────────────────────────────────┤
│         4. Organisms                │
│    オーガニズム（複雑なコンポーネント）  │
├─────────────────────────────────────┤
│         3. Molecules                │
│     モレキュール（単純なコンポーネント） │
├─────────────────────────────────────┤
│          2. Atoms                   │
│       アトム（最小単位）               │
├─────────────────────────────────────┤
│          1. Tokens                  │
│      トークン（色・フォント等）         │
└─────────────────────────────────────┘
```

---

## 各層の具体例

| 層 | 例 |
|----|-----|
| **Tokens** | #3B82F6, font-size: 16px, spacing: 8px |
| **Atoms** | Button, Input, Label, Icon |
| **Molecules** | SearchBar, FormField, NavItem |
| **Organisms** | Header, Hero, ProductCard, Footer |
| **Pages** | HomePage, AboutPage, Dashboard |

**化学の比喩：小さなものが組み合わさって大きなものになる**

---

# 3. アトミックデザインが生まれた文脈

## デザインシステム / コンポーネントライブラリのための手法

**生まれた背景（2013年頃）：**
- レスポンシブWebデザインの普及
- デザインと実装の分業
- 複数プロダクトでのUI統一の必要性

**目的：**
- デザイナーとエンジニアの共通言語
- 再利用可能なコンポーネントの階層化
- 一貫性のあるデザインシステム構築

---

## shadcn / Material UI / Ant Design

これらはどこに属するか？

```
UIコンポーネントライブラリ
├── Atoms（Button, Input, Badge）
├── Molecules（Dialog, Dropdown, Card）
└── Organisms（DataTable, NavigationMenu）
```

**共通点：**
- **ビジネスロジックを含まない**
- **純粋なUIの見た目のみ**
- **どのプロジェクトでも使える**

**これが重要！**

---

# 4. アプリコードでの苦しみ①

## molecules vs organisms 問題

**定義による分類：**
- Molecules: "relatively simple"
- Organisms: "complex"

**実際の問題：**
```
このコンポーネントは simple か complex か？
┌─────────────────────────────────────┐
│  UserCard                           │
│  ├── Avatar                         │
│  ├── Name                           │
│  ├── Role                           │
│  └── Actions                        │
└─────────────────────────────────────┘
```

**「relatively」とは誰にとっての相対か？**

---

## 主観的な分類の弊害

```
team/
├── molecules/
│   ├── UserCard.tsx        # Aさん：シンプルだからここ
│   └── ProductCard.tsx     # Bさん：複雑だからorganisms?
├── organisms/
│   ├── Header.tsx
│   └── UserCard.tsx        # Cさん：こっちが正しい！
```

**問題：**
- チーム毎に基準が異なる
- 迷う時間の浪費
- レビューでの論争

---

# 5. アプリコードでの苦しみ②

## 「どこで使われるか」が見えない

```
components/
├── atoms/
│   └── Button.tsx          # どこで使うButton？
├── molecules/
│   └── UserCard.tsx        # どのページで使う？
└── organisms/
    └── Header.tsx          # どのレイアウトで？
```

**構造から読み取れる情報：**
- ❌ このコンポーネントがどのページで使われるか
- ❌ どの機能に属するか
- ❌ 削除しても安全かどうか

**物理的な近さ ≠ 論理的な近さ**

---

## 具体例：影響範囲が不明

```typescript
// components/molecules/UserCard.tsx
// このコンポーネントはどこで使われている？

// 検索してみる...
// - app/dashboard/page.tsx
// - app/profile/page.tsx
// - app/admin/users/page.tsx
// - app/teams/[id]/page.tsx
```

**変更する時：**
- どこに影響があるか把握困難
- 削除時の影響範囲不明
- リファクタリングの恐怖

---

# 6. アプリコードでの苦しみ③

## 再利用を前提にしたProps地獄

**再利用前提で作ると...**

```typescript
// 使われるかもしれない全てのケースを想定
interface UserCardProps {
  user: User;
  showAvatar?: boolean;      // ほとんど使わない
  showActions?: boolean;     // 特定のページのみ
  avatarSize?: 'sm' | 'md' | 'lg';  // 2箇所で違う
  onEdit?: () => void;       // 一部のページのみ
  onDelete?: () => void;     // adminのみ
  variant?: 'default' | 'compact' | 'detailed';  // 複雑化
}
```

---

## Propsの膨張

```typescript
// 実際の使用箇所
<UserCard
  user={user}
  showAvatar={true}
  showActions={true}
  avatarSize="md"
  onEdit={handleEdit}
  onDelete={handleDelete}
  variant="detailed"
/>

// 別の箇所では...
<UserCard
  user={user}
  showAvatar={false}
  showActions={false}
  variant="compact"
/>
```

**YAGNI: You Aren't Gonna Need It**

---

# 7. アプリコードでの苦しみ④

## 削除できないゴミコンポーネント

```
components/
├── atoms/
│   ├── Button.tsx          # ✅ 使われている
│   ├── Icon.tsx            # ✅ 使われている
│   └── Badge.tsx           # ❓ 本当に必要？
├── molecules/
│   ├── SearchBar.tsx       # ✅ 使われている
│   └── UserCard.tsx        # ❓ dashboardでしか使ってない
└── organisms/
    ├── Header.tsx          # ✅ 使われている
    └── FeatureSection.tsx  # ❓ 使われてないかも
```

**削除できない理由：**
- 「どこで使われてるかわからない」
- 「将来使うかもしれない」
- 「消したら壊れるかも」

---

## 技術的負債の蓄積

```
プロジェクト開始時：100個のコンポーネント
↓ 1年後
実際に使われている：60個
使われていない/重複：40個
↓ 2年後
実際に使われている：70個
使われていない/重複：80個
```

**「再利用しよう」→「管理できなくなる」**

---

# 8. コロケーションという原則

## 「一緒に変わるものは一緒に置く」

**物理的な近さ = 論理的な近さ**

```
Before（アトミックデザイン）:
components/
├── atoms/Button.tsx
├── atoms/Input.tsx
├── molecules/SearchBar.tsx
└── organisms/Header.tsx

After（コロケーション）:
app/
├── page.tsx
├── layout.tsx
├── search/
│   ├── page.tsx
│   └── _components/
│       ├── SearchBar.tsx      # Search専用
│       └── SearchFilters.tsx  # Search専用
└── _components/
    └── Header.tsx             # 共有
```

---

## コロケーションのメリット

**✅ 影響範囲が明確**
- `_components/` 内 = このフォルダ内のみで使用

**✅ 削除が安全**
- フォルダごと消せばOK

**✅ 変更が容易**
- 関連ファイルが近くにある

**✅ 心理的負荷が減る**
- 「どこに置こう」の議論が不要

---

# 9. Next.js App Routerとコロケーション

## _components / _hooks / _lib の規約

```
app/
├── page.tsx
├── layout.tsx
├── dashboard/
│   ├── page.tsx
│   ├── layout.tsx
│   └── _components/          # dashboard専用
│       ├── StatsWidget.tsx
│       └── RecentActivity.tsx
├── profile/
│   ├── page.tsx
│   └── _hooks/               # profile専用
│       └── useProfile.ts
└── _lib/                     # app全体で共有
    └── utils.ts
```

---

## _プレフィックスがルートにならない理由

**Next.jsの仕様：**
- `_` で始まるフォルダ/ファイルはルートとして扱われない

```
app/
├── page.tsx              # ✅ / (アクセス可能)
├── _components/          # ❌ /_components (404)
│   └── Button.tsx
└── dashboard/
    ├── page.tsx          # ✅ /dashboard
    └── _lib/
        └── utils.ts      # ❌ /dashboard/_lib (404)
```

**プライベート実装の隠蔽が自然にできる！**

---

# 10. コンポーネントは2種類だけ

## shared/ui（ビジネスロジックなし）

```
components/
└── ui/                     # shadcn/ui的な純粋UI
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    └── dialog.tsx
```

**特徴：**
- ビジネスロジックを含まない
- どのページ・機能でも使える
- プロジェクト間で共有可能
- Propsでカスタマイズ可能

**shadcn/ui, Radix UI, Headless UIがここに属する**

---

## feature component（ページ専用）

```
app/
├── dashboard/
│   ├── page.tsx
│   └── _components/
│       ├── RevenueChart.tsx      # dashboard専用
│       ├── UserStats.tsx         # dashboard専用
│       └── RecentOrders.tsx      # dashboard専用
```

**特徴：**
- 特定のページ/機能専用
- コンテキスト（文脈）を知っている
- APIコールを含むことが多い
- Propsは最小限（必要なデータのみ）

---

## 2種類の比較

| | shared/ui | feature component |
|--|-----------|-------------------|
| **場所** | `components/ui/` | `app/**/_components/` |
| **再利用** | どこでも | 特定のページのみ |
| **ビジネスロジック** | ❌ なし | ✅ あり |
| **API呼び出し** | ❌ なし | ✅ あり |
| **Props** | 多い（汎用性） | 少ない（特定の用途） |

---

# 11. BulletProof Reactのアーキテクチャ

## featuresディレクトリの思想

```
src/
├── components/           # 共有UI（shadcn的）
│   └── ui/
├── features/             # 機能単位
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── types/
│   └── dashboard/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       └── types/
├── lib/
└── app/                  # Next.js App Router
```

**機能単位でコードをコロケーション**

---

## 実際のフォルダ構成例

```
features/auth/
├── api/
│   ├── login.ts
│   ├── logout.ts
│   └── getCurrentUser.ts
├── components/
│   ├── LoginForm.tsx
│   └── LogoutButton.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useLogin.ts
├── stores/
│   └── authStore.ts
└── types/
    └── index.ts
```

**すべてauth関連が一箇所に！**

---

# 12. 抽出のタイミング：Rule of Three

## 「最初はページの隣」

```
Step 1: 最初はシンプルに
app/
└── dashboard/
    ├── page.tsx
    └── _components/
        └── RevenueChart.tsx   # ここだけで使用

Step 2: 別のページでも必要になった
app/
├── dashboard/
│   └── page.tsx
├── analytics/
│   └── page.tsx              # RevenueChartが欲しい！
└── _components/
    └── RevenueChart.tsx      # 共有場所へ移動
```

---

## Rule of Three（三度目の法則）

**原則：**
- 1箇所で使う → ページの隣（`_components/`）
- 2箇所で使う → まだページの隣（コピー or 移動）
- **3箇所で使う → 初めて共有へ昇格**

**なぜ3か？**
- 1-2箇所は偶然の一致の可能性
- 3箇所目で共通パターンが確立
- 早すぎる抽象化を防ぐ

---

## 具体例

```
# 1箇所目
dashboard/page.tsx で RevenueChart を作成

# 2箇所目
analytics/page.tsx でも RevenueChart が必要
→ dashboard/_components/ から import（仮）

# 3箇所目
reports/page.tsx でも RevenueChart が必要
→ app/_components/RevenueChart.tsx へ昇格！
```

**「必要になるまで抽象化しない」**

---

# 13. ハンズオン：フォルダ構成を設計する

## 設計課題

**TODOアプリの機能：**
- TODO一覧表示
- TODO作成
- TODO編集
- ユーザープロフィール

**設計してみよう：**

```
app/
├── page.tsx              # トップページ（TODO一覧）
├── layout.tsx
├── profile/
│   └── page.tsx          # プロフィールページ
└── [続きを考えてみよう]
```

---

## 解答例

```
app/
├── page.tsx                    # TODO一覧
├── layout.tsx
├── _components/                # 全ページ共有
│   └── Header.tsx
├── _lib/
│   └── utils.ts
├── todo/
│   ├── [id]/
│   │   └── page.tsx            # TODO詳細
│   └── _components/            # TODO関連専用
│       ├── TodoItem.tsx
│       ├── TodoList.tsx
│       ├── TodoForm.tsx
│       └── TodoFilter.tsx
└── profile/
    ├── page.tsx
    └── _components/            # プロフィール専用
        └── UserInfo.tsx
```

---

# 14. まとめ

## 今日学んだこと

✅ **アトミックデザイン**：デザインシステムには有効、**アプリコードには不向き**

✅ **4つの苦しみ**：
- molecules vs organisms の迷い
- どこで使われるか不明
- Props地獄
- 削除できないゴミコンポーネント

✅ **コロケーション**：一緒に変わるものは一緒に置く

✅ **コンポーネント2種類**：shared/ui + feature component

✅ **Rule of Three**：3箇所目で初めて共有へ

---

## 次回予告

# F-3: TypeScript

**Props設計 / 抽象への依存**

- Propsの型設計パターン
- コンポーネント間の依存関係
- interface vs type
- 良い型・悪い型

**課題：** 現在のプロジェクトのフォルダ構成を見直してみよう
