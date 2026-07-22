---
marp: true
theme: ./../themes/modern.css
paginate: true
---

<!-- _class: title -->

# P-1: Array型の応用
## 実際のAPIで配列操作を型安全に

---

## ゴール

**実際のAPIデータで型安全な配列操作を学ぶ**

```bash
npm run array
```

---

## pluck<T,K>

特定プロパティを抽出

```typescript
const userNames = pluck(users, 'name');
```

```json
["Leanne Graham","Ervin Howell",...]
```

---

## sortBy<T>

コンパレータ関数でソート

```typescript
const sorted = sortBy(users, (a, b) => a.name.localeCompare(b.name));
```

```json
["Chelsey Dietrich","Clementina DuBuque",...]
```

---

## paginate<T>

ページ分割

```typescript
const page1 = paginate(users, 3, 1);
```

```json
["Leanne Graham","Ervin Howell","Clementine Bauch"]
```

---

## groupBy<T,K>

Record<K,T[]>でグループ化

```typescript
const postsByUser = groupBy(posts, (p) => p.userId);
```

```json
{"1":10,"2":10,...}
```

---

## unique<T>

Setで重複排除

```typescript
const cities = unique(pluck(users, 'address').map(a => a.city));
```

```json
["Gwenborough","Wisokyburgh",...]
```

---

## flatten<T>

配列の平坦化

```typescript
const flat = flatten([posts.slice(0,3), posts.slice(3,6)]);
```

```json
[{id:1,title:"..."},{id:2,title:"..."},...]
```

---

## reduceBy<T,K,V>

集計

```typescript
const titlesByUser = reduceBy(posts, (p) => p.userId, (p) => p.title);
```

```json
{"1":{"count":10,"titles":["...","..."]},"2":...}
```

---

## まとめ

| 関数 | 用途 |
|------|------|
| pluck | プロパティ抽出 |
| sortBy | ソート |
| paginate | ページ分割 |
| groupBy | グループ化 |
| unique | 重複排除 |
| flatten | 平坦化 |
| reduceBy | 集計 |

---

**次**: `npm run object`
