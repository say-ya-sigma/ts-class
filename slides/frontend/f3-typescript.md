---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# F-3: TypeScript

## Props Design / Dependency on Abstractions

---

# 1. この授業のゴール

## 学習目標

**✅ TypeScriptらしいコードを書く**
- 型パズルではなく設計を型で表現

**✅ SOLID原則の理解**
- Interface Segregation Principle
- 抽象への依存

**✅ 実践的な型テクニック**
- Discriminated Unions
- Utility Types
- Generic Components

**✅ Props設計のベストプラクティス**
- 結合度を下げる
- テスタビリティを上げる

---

# 2. TypeScriptらしいコード

## フロントエンド編

**❌ 型パズル（避けるべき）**

```typescript
// 複雑な型操作に没頭してしまう
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object 
    ? DeepPartial<T[P]> 
    : T[P];
};

// 実際には使わない、理解できない型
```

**型パズルの問題：**
- 可読性が低下
- チーム全体の理解が必要
- メンテナンスコストが高い

---

## ✅ 設計原則を型で表現

```typescript
// 「小さなインターフェースに分割する」
// 「使わないものに依存しない」
// を型で表現

interface UserDisplayProps {
  name: string;
  avatar: string;
}

interface UserActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

// 必要なものだけ選べる
function UserDisplay({ name, avatar }: UserDisplayProps) { }
function UserActions({ onEdit, onDelete }: UserActionsProps) { }
```

**型は設計の意図を伝える道具**

---

# 3. SOLID原則のI

## Interface Segregation Principle

**「クライアントは使わないものに依存してはならない」**

```typescript
// ❌ 肥大化したインターフェース
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
  role: string;
  // ... さらに20個のフィールド
}

// Userを受け取る全てのコンポーネントが
// 必要のないフィールドにも依存している
```

---

## 原則の本質

**大きなインターフェース → 小さく分割**

```typescript
// ❌ Before: 一つの大きな型
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

// ✅ After: 用途別に分割
interface UserBasicInfo {
  id: string;
  name: string;
}

interface UserContact {
  email: string;
  phone: string;
  address: string;
}

// 必要なものだけ選ぶ
function UserCard({ id, name }: UserBasicInfo) { }
function ContactForm({ email, phone, address }: UserContact) { }
```

---

# 4. 具象に依存する悪い例

## user: User 型全体をPropsに渡す

```typescript
// ❌ 悪い例
interface UserCardProps {
  user: User;  // 巨大なUser型全体
}

function UserCard({ user }: UserCardProps) {
  return (
    <div>
      <h2>{user.name}</h2>
      <img src={user.avatar} alt={user.name} />
      {/* 実際にはuserの2-3プロパティしか使わない */}
    </div>
  );
}
```

**何が問題か？**

---

## 問題点①：結合度が高い

```typescript
// User型が変更されると...
interface User {
  name: string;
  avatar: string;
  // email が削除された！
}

// UserCardはemailを使っていないのに
// コンパイルエラーが発生する可能性
// 「影響範囲が不明確」
```

**User型の変更が全てのコンポーネントに影響**

---

## 問題点②：テストが困難

```typescript
// ❌ User型全体をモックする必要がある
const mockUser: User = {
  id: '1',
  name: 'Taro',
  email: 'taro@example.com',
  avatar: '/avatar.png',
  phone: '090-1234-5678',
  address: 'Tokyo',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
  // ... 他にも20個のフィールド
};

render(<UserCard user={mockUser} />);
```

**テストデータの作成が面倒**

---

## 問題点③：再利用性が低い

```typescript
// ❌ UserCardはUser型にしか使えない
<UserCard user={user} />

// 似たようなデータを持つ別の型は使えない
interface Admin {
  id: string;
  displayName: string;
  profileImage: string;
}

// ❌ 型が合わない！
<UserCard user={admin} /> // Error!
```

**型の壁によって再利用が阻害される**

---

# 5. 抽象に依存する良い例

## 必要なプロパティだけ定義

```typescript
// ✅ 良い例
interface UserCardProps {
  name: string;
  avatar: string;
}

function UserCard({ name, avatar }: UserCardProps) {
  return (
    <div>
      <h2>{name}</h2>
      <img src={avatar} alt={name} />
    </div>
  );
}

// 使用時
<UserCard name={user.name} avatar={user.avatar} />
```

---

## メリット①：テストが簡単

```typescript
// ✅ 必要なデータだけ用意すればOK
render(<UserCard name="Taro" avatar="/avatar.png" />);

// モックの作成が簡単
const mockProps = {
  name: 'Test User',
  avatar: '/test-avatar.png',
};

render(<UserCard {...mockProps} />);
```

**最小限のデータでテスト可能**

---

## メリット②：別の型でも使い回せる

```typescript
// ✅ User型から
<UserCard name={user.name} avatar={user.avatar} />

// ✅ Admin型からも使える
interface Admin {
  id: string;
  displayName: string;
  profileImage: string;
}
<UserCard name={admin.displayName} avatar={admin.profileImage} />

// ✅ 静的データでも使える
<UserCard name="Guest" avatar="/default-avatar.png" />
```

**どこからでも使える汎用性**

---

## 抽象への依存を徹底

```typescript
// さらに良い例：別のコンポーネントにも適用
interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  return <img src={src} alt={alt} className={`avatar-${size}`} />;
}

// UserCardはAvatarに依存
interface UserCardProps {
  name: string;
  avatar: string;
}

function UserCard({ name, avatar }: UserCardProps) {
  return (
    <div>
      <h2>{name}</h2>
      <Avatar src={avatar} alt={name} size="md" />
    </div>
  );
}
```

**小さな抽象が積み重なる**

---

# 6. Discriminated Unions

## 型安全なコンポーネントバリアント

```typescript
// ❌ 曖昧なProps
interface ButtonProps {
  variant: 'link' | 'button' | 'submit';
  href?: string;      // linkの時だけ必要
  onClick?: () => void; // buttonの時だけ必要
  type?: 'button' | 'submit'; // submitの時だけ必要
}
```

**問題：**
- どのvariantにどのPropsが必要か不明確
- ランタイムでバリデーションが必要

---

## 判別可能なUnion型

```typescript
// ✅ Discriminated Union
type ButtonProps =
  | {
      variant: 'link';
      href: string;
      children: React.ReactNode;
    }
  | {
      variant: 'button';
      onClick: () => void;
      children: React.ReactNode;
    }
  | {
      variant: 'submit';
      onSubmit: () => void;
      children: React.ReactNode;
    };
```

---

## Type Narrowingが自動で起きる

```typescript
function Button(props: ButtonProps) {
  // variantで型が絞り込まれる！
  if (props.variant === 'link') {
    // TypeScript knows: props.href exists
    return <a href={props.href}>{props.children}</a>;
  }
  
  if (props.variant === 'button') {
    // TypeScript knows: props.onClick exists
    return <button onClick={props.onClick}>{props.children}</button>;
  }
  
  if (props.variant === 'submit') {
    // TypeScript knows: props.onSubmit exists
    return <button type="submit" onClick={props.onSubmit}>{props.children}</button>;
  }
}
```

---

## 使用例

```typescript
// ✅ linkの場合、hrefが必須
<Button variant="link" href="/about">About</Button>

// ✅ buttonの場合、onClickが必須
<Button variant="button" onClick={handleClick}>Click</Button>

// ❌ コンパイルエラー！
<Button variant="link" onClick={handleClick}>Error</Button>
// Property 'href' is missing
```

**コンパイル時に不整合を検出**

---

# 7. Utility TypesでPropsを操作

## Pick / Omit / Partial

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  createdAt: Date;
}
```

---

## Pick — 必要なものだけ選ぶ

```typescript
// ✅ Pick: 指定したプロパティだけ取り出す
type UserBasicInfo = Pick<User, 'id' | 'name' | 'avatar'>;

// 展開すると：
// type UserBasicInfo = {
//   id: string;
//   name: string;
//   avatar: string;
// }

interface UserCardProps {
  user: UserBasicInfo;
}
```

**既存の型から必要な部分だけ抽出**

---

## Omit — 不要なものを除外

```typescript
// ✅ Omit: 指定したプロパティを除外
type UserPublicInfo = Omit<User, 'email' | 'createdAt'>;

// 展開すると：
// type UserPublicInfo = {
//   id: string;
//   name: string;
//   avatar: string;
//   role: string;
// }

interface UserProfileProps {
  user: UserPublicInfo;
}
```

**センシティブなデータを除外**

---

## Partial — 全てオプショナルに

```typescript
// ✅ Partial: 全てのプロパティをオプショナルに
type PartialUser = Partial<User>;

// 展開すると：
// type PartialUser = {
//   id?: string;
//   name?: string;
//   email?: string;
//   // ... 全てoptional
// }

// フォームの初期値などに使う
const defaultValues: PartialUser = {
  role: 'user',
};
```

**更新用の型やフォームで活用**

---

## 使いどころまとめ

| Utility | 用途 | 例 |
|---------|------|-----|
| **Pick** | 必要なものだけ | APIレスポンスの絞り込み |
| **Omit** | 除外したいもの | センシティブデータ除外 |
| **Partial** | 全て任意に | フォーム、更新処理 |

```typescript
// 組み合わせも可能
type UserUpdateInput = Partial<Omit<User, 'id' | 'createdAt'>>;
// idとcreatedAtは変更不可、他は任意で更新可能
```

---

# 8. Generic Components

## Select<T>の例

```typescript
// ❌ anyを使った曖昧な実装
interface SelectProps {
  options: any[];
  value: any;
  onChange: (value: any) => void;
}
```

**問題：**
- 型安全性が失われる
- 自動補完が効かない

---

## 型パラメータを使う

```typescript
// ✅ Generic Component
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
}

function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
}: SelectProps<T>) {
  return (
    <select
      value={getValue(value)}
      onChange={(e) => {
        const selected = options.find(o => getValue(o) === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      {options.map(option => (
        <option key={getValue(option)} value={getValue(option)}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}
```

---

## 使用例

```typescript
// User型で使用
interface User {
  id: string;
  name: string;
}

const users: User[] = [
  { id: '1', name: 'Taro' },
  { id: '2', name: 'Hanako' },
];

<Select<User>
  options={users}
  value={selectedUser}
  onChange={setSelectedUser}
  getLabel={(user) => user.name}
  getValue={(user) => user.id}
/>
```

**型安全にどんな型でも使える**

---

# 9. Const AssertionとTailwind

## as const / typeof sizes[number] パターン

```typescript
// ❌ マジックナンバー・文字列
function Button({ size }: { size: string }) {
  const className = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-12' : 'h-10';
  return <button className={className} />;
}

// ❌ タイポのリスク
<Button size="lm" /> // 気づかない...
```

---

## Const Assertionで型を生成

```typescript
// ✅ as const でreadonlyタプルに
const SIZES = ['sm', 'md', 'lg'] as const;

// typeof SIZES[number] でUnion型を生成
type Size = typeof SIZES[number];
// type Size = 'sm' | 'md' | 'lg'

// Tailwindのクラスをマッピング
const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
};

interface ButtonProps {
  size?: Size;  // 'sm' | 'md' | 'lg'
}

function Button({ size = 'md' }: ButtonProps) {
  return <button className={sizeClasses[size]} />;
}
```

---

## 型安全性の向上

```typescript
// ✅ 自動補完が効く
<Button size="sm" />   // OK
<Button size="md" />   // OK
<Button size="lg" />   // OK

// ❌ コンパイルエラー！
<Button size="lm" />
// Type '"lm"' is not assignable to type 'Size'
```

**1箇所の定義変更で型と実装が両方更新される**

---

# 10. ハンズオン

## Props設計をリファクタリングする

**改善前：**
```typescript
// ❌ Before
interface ProductCardProps {
  product: Product;  // 巨大な型
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <div>
      <img src={product.images[0].url} />
      <h3>{product.name}</h3>
      <p>¥{product.price}</p>
    </div>
  );
}
```

---

## 改善ステップ

**Step 1: 使っているプロパティを確認**
- images[0].url
- name
- price

**Step 2: 新しいProps型を定義**
```typescript
// ✅ After
interface ProductCardProps {
  imageUrl: string;
  name: string;
  price: number;
}

function ProductCard({ imageUrl, name, price }: ProductCardProps) {
  return (
    <div>
      <img src={imageUrl} />
      <h3>{name}</h3>
      <p>¥{price}</p>
    </div>
  );
}

// 使用時
<ProductCard
  imageUrl={product.images[0].url}
  name={product.name}
  price={product.price}
/>
```

---

# 11. まとめ

## 今日学んだこと

✅ **TypeScriptらしいコード**
- 型パズルではなく設計を型で表現

✅ **Interface Segregation Principle**
- 小さなインターフェースに分割
- 使わないものに依存しない

✅ **具象→抽象への移行**
- テストが簡単に
- 再利用性が向上

✅ **Discriminated Unions**
- 型安全なバリアント
- コンパイル時検証

✅ **Utility Types**
- Pick, Omit, Partial

✅ **Generic Components**
- Select<T>で型安全に

---

## 次回予告

# F-4: Styling

**Tailwind / Design Tokens**

- Tailwind CSSのベストプラクティス
- デザイントークンの設計
- CVA (Class Variance Authority)
- コンポーネントのバリエーション管理

**課題：** 既存のコンポーネントのProps設計を見直してみよう
