---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# F-5: Data Fetching

## TanStack Query / Abolishing useEffect

---

# 1. この授業のゴール

## 学習目標

**✅ useEffectの問題を理解する**
- データフェッチに向かない理由
- 手動管理の痛苦

**✅ TanStack Queryを使いこなす**
- useQuery / useMutation
- キャッシュ戦略

**✅ サーバー状態とクライアント状態を分離**
- 適切な状態管理の選択

**✅ Server/Clientでの使い分け**
- どちらでデータ取得するか

---

# 2. Reactにおけるデータ取得の歴史

## クラスコンポーネント時代

```javascript
// ❌ componentDidMount
class UserList extends React.Component {
  state = { users: [], loading: true, error: null };

  async componentDidMount() {
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      this.setState({ users, loading: false });
    } catch (error) {
      this.setState({ error, loading: false });
    }
  }

  render() {
    const { users, loading, error } = this.state;
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    return <ul>{users.map(user => <li>{user.name}</li>)}</ul>;
  }
}
```

**ボイラープレートが多い、ロジックの再利用が困難**

---

## hooks時代

```javascript
// ❌ useEffect（まだ問題がある）
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        const data = await response.json();
        if (!cancelled) {
          setUsers(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchUsers();
    
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <ul>{users.map(user => <li>{user.name}</li>)}</ul>;
}
```

---

# 3. useEffectでデータフェッチするとどうなるか

## 全部手書きする地獄

```typescript
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // ❌ 手動でローディング管理
  // ❌ 手動でエラー管理
  // ❌ 手動でキャンセル処理
  // ❌ 手動で再試行
  // ❌ 手動でキャッシュ
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchUser() {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchUser();
    
    return () => { cancelled = true; };
  }, [userId]);

  // ... rendering
}
```

---

## 足りないもの

**毎回実装が必要：**
- ✅ ローディング状態
- ✅ エラーハンドリング
- ✅ リクエストキャンセル
- ✅ 重複リクエスト防止
- ✅ キャッシュ
- ✅ バックグラウンド更新
- ✅ 再試行（retry）
- ✅ 楽観的更新
- ✅ 依存関係の追跡

**「車輪の再発明」を毎回している**

---

# 4. useEffectの根本的な問題

## 「副作用の管理」が本来の役割

```typescript
// ✅ useEffectの正しい使い方
function Example() {
  // DOMの操作
  useEffect(() => {
    document.title = 'New Title';
  }, []);
  
  // サブスクリプション
  useEffect(() => {
    const subscription = subscribe();
    return () => subscription.unsubscribe();
  }, []);
  
  // タイマー
  useEffect(() => {
    const timer = setInterval(() => {}, 1000);
    return () => clearInterval(timer);
  }, []);
}
```

**useEffect = 副作用とReactの世界を同期させる**

---

## データフェッチは「副作用」ではなく「同期」

**副作用（Side Effect）：**
- Reactの世界外のこと
- DOM操作、サブスクリプション、タイマー
- クリーンアップが必要

**データフェッチ：**
- アプリケーション状態の「同期」
- サーバー状態をクライアントに反映
- 宣言的に「どのデータが必要か」を記述すべき

```typescript
// ❌ データフェッチを副作用として扱う
useEffect(() => {
  fetchData();
}, [id]);

// ✅ 宣言的に「必要なデータ」を記述
const { data } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id),
});
```

---

# 5. TanStack Query登場

## 「凄い発明」の何が凄いのか

**Before：**
```typescript
// 100行以上のボイラープレート
// バグの温床
// チーム毎に実装が異なる
```

**After：**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
```

**一行で全てを解決**

---

## サーバー状態とクライアント状態の分離

```
状態（State）
├── クライアント状態（Client State）
│   ├── フォーム入力値
│   ├── UIの開閉状態
│   └── 選択中のアイテム
│   → useState, useReducer, Zustand
│
└── サーバー状態（Server State）
    ├── ユーザーデータ
    ├── 商品リスト
    └── TODOアイテム
    → TanStack Query
```

**特性が異なるので、管理方法も分ける**

---

## サーバー状態の特性

| 特性 | 説明 |
|------|------|
| **キャッシュ可能** | 同じデータは再利用できる |
| **非同期** | ネットワーク越しに取得 |
| **共有** | 複数コンポーネントで同じデータ |
| **更新可能** | 楽観的更新、再検証 |
| **古くなる** | 時間経過で信頼性が低下 |

**TanStack Queryはこれらを自動管理**

---

# 6. useQueryの基本

## queryKey / queryFn / isLoading / error / data

```typescript
import { useQuery } from '@tanstack/react-query';

function UserList() {
  const { data, isLoading, isError, error, isFetching } = useQuery({
    // queryKey: キャッシュのキー、依存関係の追跡
    queryKey: ['users'],
    
    // queryFn: データを取得する関数
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    
    // オプション
    staleTime: 1000 * 60 * 5,  // 5分間は新鮮とみなす
    retry: 3,                   // 失敗時に3回再試行
  });

  // 状態に応じたUI
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {isFetching && <span>Updating...</span>}
      <ul>{data.map(user => <li key={user.id}>{user.name}</li>)}</ul>
    </div>
  );
}
```

---

## 返り値の詳細

| プロパティ | 説明 |
|-----------|------|
| `data` | 取得したデータ |
| `isLoading` | 初回取得中（true = まだデータなし） |
| `isFetching` | 取得中（バックグラウンド更新含む） |
| `isError` | エラー発生 |
| `error` | エラーオブジェクト |
| `isSuccess` | 取得成功 |
| `isStale` | データが古い |
| `refetch` | 手動で再取得 |

---

# 7. キャッシュという概念

## 同じqueryKeyなら2回目以降はAPIを叩かない

```typescript
function App() {
  return (
    <div>
      <UserList />    {/* 1回目: API呼び出し */}
      <UserList />    {/* 2回目: キャッシュ使用 */}
    </div>
  );
}

function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],           // 同じキー！
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 5,     // 5分間キャッシュ
  });
  
  // 2つ目のUserListは即座にデータが表示される
  if (isLoading) return <div>Loading...</div>;
  return <ul>{data.map(u => <li>{u.name}</li>)}</ul>;
}
```

**デモ: ネットワークタブで確認**

---

## staleTimeの概念

```typescript
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 1000 * 60 * 5,  // 5分 = 300000ms
});

// 状態遷移:
// Fresh（新鮮） → Stale（古い） → Refetch
//
// |<--- staleTime --->|
// [Fetch]             [Stale]              [Refetch]
//   ↓                   ↓                      ↓
// data表示            バックグラウンド        次のアクセスで
//                     で更新                 再取得
```

**適切なstaleTimeでパフォーマンス向上**

---

## queryKeyの設計

```typescript
// ✅ 良いqueryKeyの設計
const { data: user } = useQuery({
  queryKey: ['user', userId],           // 動的パラメータを含める
  queryFn: () => fetchUser(userId),
});

const { data: posts } = useQuery({
  queryKey: ['posts', { status: 'published', page: 1 }],  // フィルタも含める
  queryFn: () => fetchPosts({ status: 'published', page: 1 }),
});

// ❌ 悪い例
useQuery({
  queryKey: ['user'],    // userIdが含まれていない！
  queryFn: () => fetchUser(userId),
});
// userIdが変わっても再取得されない
```

---

# 8. useMutationの基本

## mutate / isPending / onSuccess

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateTodoForm() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    // mutationFn: データを変更する関数
    mutationFn: async (newTodo: { title: string }) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
    
    // 成功時の処理
    onSuccess: () => {
      // 関連するクエリを無効化 → 自動で再取得
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    
    // エラー時の処理
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ title: 'New Todo' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button 
        type="submit" 
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

---

## invalidateQueriesで関連データを再取得

```typescript
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    // ❌ 手動で更新
    // fetchTodos(); // どこで呼ぶ？
    
    // ✅ invalidateQueriesで自動更新
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    // または特定の範囲
    queryClient.invalidateQueries({ 
      queryKey: ['todos'],
      exact: false  // 'todos'で始まる全て
    });
  },
});
```

**データ整合性を自動的に保つ**

---

# 9. Server Component vs Client Component

## 使い分け

**Server Component：**
```typescript
// app/users/page.tsx
// Server Component（デフォルト）

async function fetchUsers() {
  const res = await fetch('https://api.example.com/users');
  return res.json();
}

export default async function UsersPage() {
  const users = await fetchUsers();  // サーバーで直接実行
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**Client Component：**
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

function UserList() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
  
  // インタラクティブ機能がある場合
  return <div>{/* ... */}</div>;
}
```

---

## どちらを使うか

| 状況 | 推奨 | 理由 |
|------|------|------|
| 初回表示データ | Server Component | ビルド時・リクエスト時に取得、JSなし |
| インタラクティブなリスト | Client + useQuery | フィルタ、ソート、ページネーション |
| リアルタイム更新 | Client + useQuery | ポーリング、WebSocket |
| ユーザー入力後の取得 | Client + useQuery | 検索、検索候補 |
| ミューテーション後 | Client + useMutation | 楽観的更新、エラーハンドリング |

---

## ハイブリッドアプローチ

```typescript
// app/users/page.tsx
import { UsersList } from './_components/users-list';

export default async function UsersPage() {
  // 初期データをサーバーで取得
  const initialUsers = await fetchUsers();
  
  return (
    <div>
      <h1>Users</h1>
      {/* 初期データを渡し、Clientでキャッシュ管理 */}
      <UsersList initialData={initialUsers} />
    </div>
  );
}

// app/users/_components/users-list.tsx
'use client';

function UsersList({ initialData }: { initialData: User[] }) {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    initialData,  // 初期データを設定
  });
  
  // Clientでのインタラクション
  const [filter, setFilter] = useState('');
  
  return <div>{/* ... */}</div>;
}
```

---

# 10. ハンズオン

## useEffectコードをTanStack Queryに書き換える

**Before (useEffect)：**
```typescript
'use client';

import { useState, useEffect } from 'react';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchTodos() {
      try {
        setLoading(true);
        const res = await fetch('/api/todos');
        const data = await res.json();
        if (!cancelled) setTodos(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTodos();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;
  return <ul>{todos.map(todo => <li>{todo.title}</li>)}</ul>;
}
```

---

**After (TanStack Query)：**
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchTodos() {
  const res = await fetch('/api/todos');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

function TodoList() {
  const { data: todos, isLoading, isError } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error!</div>;
  return <ul>{todos.map(todo => <li>{todo.title}</li>)}</ul>;
}
```

**コード量が1/3に！**

---

# 11. まとめ

## 今日学んだこと

✅ **useEffectの問題**
- 全て手書きする必要がある
- データフェッチ≠副作用

✅ **TanStack Queryの利点**
- ローディング・エラー・キャッシュ自動管理
- サーバー状態とクライアント状態の分離

✅ **useQuery**
- queryKeyでキャッシュと依存管理
- staleTimeでパフォーマンス最適化

✅ **useMutation**
- invalidateQueriesで関連データ更新
- 楽観的更新、エラーハンドリング

✅ **Server vs Client**
- Server: 初期データ取得
- Client: インタラクティブ機能

---

## 次回予告

# F-6: Authentication (Frontend)

**Clerk Integration / Middleware**

- 認証の基礎概念
- Clerkのセットアップ
- Protected Routes
- JWTの取り扱い

**課題：** プロジェクトにTanStack Queryを導入して、useEffectを置き換えてみよう

---

## 深掘りしたい人へ

**公式ドキュメント：**
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Essentials](https://tkdodo.eu/blog/practical-react-query)

**日本語リソース：**
- [React Query入門](https://zenn.dev/t_keshi/articles/react-query-essentials)

**Advanced Topics：**
- Optimistic Updates
- Infinite Queries
- Parallel Queries
- Query Cancellation
