---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# F-4: Styling

## Tailwind / Design Tokens

---

# 1. この授業のゴール

## 学習目標

**✅ デザイントークンを理解する**
- 共通言語としての役割
- チーム全体での認識統一

**✅ Tailwind CSSのベストプラクティス**
- トークンの定義方法
- クラス名の管理

**✅ コンポーネントのバリエーション管理**
- `cn()`ユーティリティ
- `cva()`でvariantを型安全に

**✅ テーマ対応**
- ダークモードの実装

---

# 2. デザイントークンとは何か

## カラー・スペーシング・タイポグラフィの「共通言語」

```
デザイントークン
├── Colors
│   ├── primary: #3B82F6
│   ├── secondary: #64748B
│   └── danger: #EF4444
├── Spacing
│   ├── xs: 4px
│   ├── sm: 8px
│   ├── md: 16px
│   └── lg: 24px
├── Typography
│   ├── font-family: Inter
│   ├── font-size-sm: 14px
│   └── font-size-base: 16px
└── Border Radius
    ├── sm: 4px
    └── md: 8px
```

---

## デザイナーとエンジニアの認識が揃う

**Before（認識がずれている）：**

```
デザイナー: 「ボタンの青を少し濃くしてください」
↓
エンジニア: 「青...？どの青？」
           #3B82F6 ? blue-500 ? primary ?
```

**After（トークンで統一）：**

```
デザイナー: 「primaryを#2563EBに変更してください」
↓
エンジニア: 「primaryの値を1箇所変更するだけでOK！」
```

**「命名」が共通言語になる**

---

# 3. チームで統一されていない場合の苦しさ

## #3B82F6 / blue-500 / brand-primary が混在

```typescript
// ❌ 統一されていないコード
function Button({ variant }: ButtonProps) {
  return (
    <button
      className={`
        ${variant === 'primary' ? 'bg-blue-500' : ''}
        ${variant === 'danger' ? 'bg-[#EF4444]' : ''}
        ${variant === 'success' ? 'bg-green-600' : ''}
      `}
    >
      Click me
    </button>
  );
}

// 別のファイルでは...
function Card() {
  return <div className="border-[#3B82F6]" />;  // 直接指定
}

// さらに別のファイルでは...
function Header() {
  return <div className="text-brand-primary" />;  // カスタムクラス
}
```

---

## 問題点

**❌ 保守性が低下**
- 色を変更する時、複数箇所を修正する必要がある
- 置換ミスのリスク

**❌ 一貫性が失われる**
- 同じ意味の色でも微妙に異なる値が混在
- 「似たような青」が増殖

**❌ チーム内の混乱**
- 新人：「青を指定するとき、どの書き方を使えばいいですか？」
- 先輩：「えーと、場所によるかな...」

```
検索結果: "blue" → 45件ヒット
  - bg-blue-500
  - text-blue-600
  - bg-[#3B82F6]
  - text-blue-500/80
  - border-blue-400
  ...混乱
```

---

# 4. tailwind.config.ts でのトークン定義

## colors / spacing / fontFamily の拡張

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // カラートークン
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          900: '#1E3A8A',
        },
        secondary: '#64748B',
        danger: '#EF4444',
        success: '#22C55E',
      },
      // スペーシングトークン
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      // タイポグラフィトークン
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
};

export default config;
```

---

## 使用例

```tsx
// ✅ 定義したトークンを使用
function Button() {
  return (
    <button className="
      bg-primary-500          /* カラー */
      hover:bg-primary-600    /* ホバー */
      text-white
      px-4                    /* spacing (16px) */
      py-2                    /* spacing (8px) */
      rounded-md              /* border-radius */
      font-sans               /* typography */
    ">
      Submit
    </button>
  );
}
```

**一貫性があり、変更も容易**

---

# 5. shadcn/ui という選択肢

## コンポーネントをコピペして所有する思想

**従来のUIライブラリ：**
```bash
npm install @some-ui/library
# 依存関係が増える
# カスタマイズが制限される
```

**shadcn/ui：**
```bash
npx shadcn add button
# コードが自分のプロジェクトにコピーされる
# 完全に所有・カスタマイズ可能
```

```
components/
└── ui/
    ├── button.tsx      # 自分のコード！
    ├── card.tsx
    ├── dialog.tsx
    └── input.tsx
```

---

## CSS Variables によるトークン管理

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}
```

---

## TailwindでCSS Variablesを使用

```typescript
// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
};
```

**テーマ切り替えが容易**

---

# 6. クラス名の管理：cn()ユーティリティ

## clsx + tailwind-merge の組み合わせ

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**`clsx`**: 条件付きクラス名を整理
**`tailwind-merge`**: 重複・衝突するクラスを解決

---

## 条件付きクラス名の整理

```typescript
// ❌ Before: 複雑で読みにくい
function Button({ 
  variant, 
  size, 
  isLoading, 
  isDisabled 
}: ButtonProps) {
  return (
    <button
      className={`
        base-classes
        ${variant === 'primary' ? 'bg-blue-500 text-white' : ''}
        ${variant === 'secondary' ? 'bg-gray-200 text-gray-800' : ''}
        ${size === 'sm' ? 'px-2 py-1 text-sm' : ''}
        ${size === 'lg' ? 'px-6 py-3 text-lg' : ''}
        ${isLoading ? 'opacity-50 cursor-wait' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    />
  );
}
```

---

## cn()で整理

```typescript
// ✅ After: 読みやすく、重複も解決
import { cn } from '@/lib/utils';

function Button({ 
  variant, 
  size, 
  isLoading, 
  isDisabled 
}: ButtonProps) {
  return (
    <button
      className={cn(
        // ベーススタイル
        'inline-flex items-center justify-center rounded-md font-medium',
        
        // variantによる分岐
        variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        
        // sizeによる分岐
        size === 'sm' && 'px-2 py-1 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        
        // 状態による分岐
        (isLoading || isDisabled) && 'opacity-50 cursor-not-allowed',
        isLoading && 'cursor-wait'
      )}
    />
  );
}
```

---

## tailwind-mergeの効果

```typescript
// ❌ 重複するクラス（意図しないスタイル）
className="px-4 px-6 py-2 text-sm text-base"
// → px-4とpx-6が衝突、text-smとtext-baseが衝突

// ✅ twMergeが自動で解決
import { twMerge } from 'tailwind-merge';

twMerge('px-4 px-6 py-2 text-sm text-base');
// → 'px-6 py-2 text-base'（後勝ち）

twMerge('px-4 py-2', 'px-6');
// → 'py-2 px-6'（後から渡したpx-6が優先）
```

**クラス名の衝突を心配する必要がない**

---

# 7. コンポーネントのvariantをcva()で管理

## class-variance-authority の使い方

```bash
npm install class-variance-authority
```

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // ベーススタイル
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

---

## cvaを使用したコンポーネント

```typescript
// variantsの型を抽出
type ButtonVariants = VariantProps<typeof buttonVariants>;

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  asChild?: boolean;
}

function Button({ 
  className, 
  variant, 
  size, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

---

## 使用例

```tsx
// ✅ 型安全にvariantを指定
<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Small</Button>
<Button variant="ghost" size="lg">Large Ghost</Button>
<Button variant="link">Link Style</Button>

// ✅ クラスの追加も可能
<Button className="w-full">Full Width</Button>

// ❌ コンパイルエラー（存在しないvariant）
<Button variant="danger">Error</Button>
// Type '"danger"' is not assignable to type 'Variant'
```

---

# 8. ダークモード対応

## data-theme / CSS Variables の活用

```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... */
  }

  /* ダークモード */
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    /* ... */
  }
}
```

---

## テーマ切り替えの実装

```typescript
// components/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: 'system', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

---

## テーマ切り替えボタン

```typescript
// components/theme-toggle.tsx
'use client';

import { useTheme } from './theme-provider';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        onClick={() => setTheme('light')}
      >
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        onClick={() => setTheme('dark')}
      >
        Dark
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'outline'}
        onClick={() => setTheme('system')}
      >
        System
      </Button>
    </div>
  );
}
```

**CSS Variablesが自動的に切り替わる**

---

# 9. ハンズオン

## デザイントークンを定義してコンポーネントに適用

**ステップ1: tailwind.config.tsにトークンを追加**

```typescript
// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
      },
    },
  },
};
```

---

**ステップ2: Buttonコンポーネントに適用**

```typescript
// components/ui/button.tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-display font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-white hover:bg-brand-600',
        secondary: 'bg-brand-100 text-brand-900 hover:bg-brand-50',
        outline: 'border-2 border-brand-500 text-brand-500 hover:bg-brand-50',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

---

# 10. まとめ

## 今日学んだこと

✅ **デザイントークン**
- チームの共通言語
- 認識の統一

✅ **tailwind.config.ts**
- colors, spacing, fontFamilyの拡張

✅ **shadcn/ui**
- コピペして所有する思想
- CSS Variablesによるトークン管理

✅ **cn()ユーティリティ**
- clsx + tailwind-merge
- 条件付きクラス名の整理

✅ **cva()**
- 型安全なvariant管理
- コンポーネントの一貫性

✅ **ダークモード**
- data-theme / CSS Variables
- テーマ切り替え

---

## 次回予告

# F-5: Data Fetching

**TanStack Query / useEffect廃止**

- useEffectの問題点
- TanStack Queryの利点
- CachingとBackground Updates
- Optimistic Updates

**課題：** プロジェクトにshadcn/uiをセットアップして、Buttonコンポーネントをカスタマイズしてみよう
