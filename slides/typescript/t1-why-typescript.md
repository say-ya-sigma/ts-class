---
marp: true
theme: ./../themes/modern.css
paginate: true
---

# T-1: なぜTypeScriptか

---

# JavaScript神話

---

## この授業のゴール

**TypeScriptを「歴史的必然」として理解する**

- JavaScriptが生まれた背景を知る
- Google / Ajax / V8 が何を変えたか掴む
- Babel・jQuery・TC39 が何と戦っていたか理解する
- React / Vue / TypeScript の力学を歴史で説明できるようになる

---

## 創世記: 神はJavaScriptを10日で作った

```
1995年: Netscapeが「ブラウザで動く軽い言語」を急遽必要とした
    ↓
Brendan Eich が短期間で設計
    ↓
「10日」で出来上がった
```

**十分に設計された言語ではない**
- 十分に設計された巨大言語として始まったわけではない
- もともとは「ブラウザ」の「ちょっとした動き」のための言語
- 現在フロントエンドもバックエンドも支配

---

## 当初のJavaScriptに壮大な目的はない

**当初の立ち位置**
- 画面にちょっと動きをつける
- フォーム入力を軽く検証する
- JavaやC++のような本格アプリ言語ではない

**なので**
- 今日のJavaScriptは歴史的経緯でそうなっているとしか言えない仕様が山ほどある

---

## 旧石器時代: ブラウザ戦争という魔境

**ブラウザごとに挙動が違う**

```
Netscape と Internet Explorer が独自拡張を積み上げる
        ↓
document.layers / document.all / eventモデル差分 / CSS差分
        ↓
「クロスブラウザ」で動かすのは一苦労
```

```javascript
if (document.all) {
  // IE向け
} else if (document.layers) {
  // Netscape向け
}
```
---

## Ajaxというゾルトラーク

```
JavaScript + XMLHttpRequest + DOM更新
        ↓
ページ全体をリロードせず一部だけ更新できる
        ↓
Gmail / Google Maps が圧倒的な体験として世に見せつけた
```

**Webアプリっぽい挙動が世界に生まれた**
- 当時最先端技術
- 現代ではWebアプリの基礎技術となった

---

## 当時の素朴な実装は困難を極めた

```javascript
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function () {
  if (xhr.readyState === 4 && xhr.status === 200) {
    document.getElementById('result').innerHTML = xhr.responseText;
  }
};
xhr.open('GET', '/api/data', true);
xhr.send();
```
非同期コードは書きづらい、DOM操作は頻繁に壊れる、JavaScript環境はAjaxを支えWebアプリの基盤となるには余りにも貧弱だった。

---

## 古代に信じられた神: jQuery

**ブラウザ差分を吸収する神**

```javascript
$('#dialog').hide();
$('.item').addClass('active');
$.ajax({ url: '/api/users' });
```

**jQueryの功績**
- DOM操作をブラウザ差分を気にせず書ける
- Ajax APIが扱いやすい

---

## ブラウザ界を蹂躙した王: GoogleのV8

**GoogleのV8エンジンは今の基準で言っても速い**

```
2008年: Google Chrome + V8エンジン
        ↓
JavaScriptを本気で速く実行する
        ↓
「JSはおもちゃ」という常識が揺らいでくる
```

**V8が変えたこと**
- JITコンパイルで高速化
- Hidden Class と Inline Cache で、動的言語でも実用速度を出した
- 世代別GCで短命オブジェクトを効率よく回収できた

---

## 平行世界: Node.js

**V8をサーバーでも使おう！**

```
V8が高速化を実現
    ↓
Node.js がサーバーサイドへ展開
    ↓
JSは「フロントだけの言語」ではなくなる
```

**Node.jsが刺さった理由**
- `C10k問題` の時代に「大量同時接続をどう捌くか」が重要だった
- スレッドを接続ごとに増やすモデルはメモリ効率が悪かった
- Node.js はイベントループと非同期I/Oで、その問題にかなり相性が良かった

---

## Node.jsの特徴

**イベントループ**
- 重いI/O待ちをブロックせず、終わった仕事を後で受け取る仕組み
- 1接続1スレッドではなく、少ない実行単位で大量接続を扱いやすい
- 特にチャット、API、プロキシのようなI/O中心処理で強かった

**バックエンドのための処理系**
- Node.jsはバックエンドのための処理系だった
- V8の速度を併せ持つ
- JavaScriptの不自然な仕様を引き継いだ。

---

## JS界に現れた「バベルの塔」

### Babel はJS界を統一する夢を支えた変換装置

```javascript
// 開発者は新しい構文で書く
const name = user?.profile?.name ?? 'Anonymous';

// Babel は古い環境向けに変換する
var _a, _b;
var name = (_a = (_b = user == null ? void 0 : user.profile) == null ? void 0 : _b.name) != null ? _a : 'Anonymous';
```

**Babelがやっていたこと**
- 新しいJavaScriptを古いJavaScriptへ変換
- ブラウザ差分を「ビルド工程」で吸収
- ユーザーには同じように動いて見える

---

## Babel以前・以後で、フロントエンドの開発はかなり違う

**昔は「どのブラウザで動く・壊れる」が常に問題だった**

```
言語仕様が新しくなる
        ↓
古いブラウザは対応していない
        ↓
Babel がその差分を埋めてくれた
```

**この時代感を知らないと伝わりにくいこと**
- 昔は「クロスブラウザ対応できる」だけで強い
- ランタイム差分を隠蔽する価値が非常に高かった
- 今の快適な開発体験は、標準化と変換ツールの積み重ねの上にある

---

## TC39とは何者か

**ECMAScript の標準化委員会**

- ブラウザベンダー・企業が集まり、JSの将来を議論
- Chrome / Firefox / Safari / Node.js で動く共通仕様を整える
- 「新機能を勝手に実装する」→「合意形成で標準化」

---

## TC39の提案段階

**Stage 0 → 4 で段階的に進む**

- **Stage 0**: アイデア
- **Stage 1**: 検討対象
- **Stage 2**: 仕様草案
- **Stage 3**: 実装・検証
- **Stage 4**: 標準採用

---

## TC39と現場の関係

**未来の仕様を今使える**

```
TC39 で標準化
    ↓
Babel が先取り実装
    ↓
開発者が新文法を即利用
```

- `async/await` や `?.` も段階的に生まれた
- TC39が「同じJSが動く世界」を保つ

---

## 世界を統一しようとした者たち

**TC39** - 言語仕様そのものを標準化
- Chrome/Firefox/Safari/Node.js で動く共通仕様を整える

**jQuery** - 現場レベルでブラウザ差分を吸収
- `$()` でDOM操作を簡潔に、Ajax APIを統一

**Babel** - 未来の文法を現在の環境で使えるように
- ESNext → 古いJSへ変換、開発者は新構文を即利用

**時代を追って少しずつ「同じJSが動く世界」になっていった**

---

## AltJS の時代

### CoffeeScript, Dart, Flow... 最終的に残ったのはTS

| 言語 | 特徴 | 課題 |
|:---|:---|:---|
| **CoffeeScript** | Ruby風の簡潔な構文 | JSと別言語を覚える必要 |
| **Dart** | Google製、ブラウザ置き換え目指す | 既存エコシステムと親和性低 |
| **Flow** | Facebook製、型推論 | エコシステム全体を取れず |

---

## TypeScriptはなぜ勝てたのか

### 答えは「JavaScriptを捨てなかった」から

```typescript
function greet(name: string): string {
  return `Hello, ${name}`;
}
```

**TypeScriptの戦略**
- 有効なJavaScriptは基本そのまま有効
- 必要な場所から型を足せる
- 新言語への全面移行を要求しない

---

## ReactとTypeScriptの相性

### JSXベースだったことが、TSとの相性を高めた

```tsx
type Props = {
  title: string;
};

export function Header({ title }: Props) {
  return <h1>{title}</h1>;
}
```

**歴史的な流れ**
- TypeScriptの普及は仮想DOM以後
- ReactはJavaScriptの構文に比較的忠実だった

---

## Vueは大幅な仕様変更を余儀なくされた

### TypeScript対応の試行錯誤

**Vue 2 時代**
- Options API では型推論が難しかった
- class ベース記法で対応 → decorator の標準化問題が発生

**Vue 3 での転換**
- Composition API を新たに導入
- TS対応は改善したが、「昔の書き方」が本流にはならなかった

---

## Nuxt 2 時代の迷いも、Vue陣営の難しさを増幅した

### API開発・構成方針の変化が、安心感に影響した

```
Vue自体の魅力は高い
        ↓
しかし周辺フレームワークや推奨構成が揺れる
        ↓
チーム開発では「今これを選んで大丈夫か」が重要になる
```

**ここでの教訓**
- フレームワークの勝敗は文法の美しさだけでは決まらない
- 型対応、周辺ツール、移行戦略、組織の安心感が効く
- Evan You は非常に優れた設計者だが、エコシステムの条件は常に厳しかった

---

## TypeScriptは、最後の1ピースだった

### JavaScriptが抱えた長年の問題に、一番現実的に応えた

<div class="grid-2">
<div>

**JavaScript史**
- もともと急造言語だった
- ブラウザ差分が激しかった
- Ajax時代で複雑さが増した
- V8/Nodeで大規模開発需要が爆発
- BabelやjQueryが橋渡し

</div>
<div>

**TypeScriptの回答**
- 型で大規模開発を支える
- JS互換で導入障壁を下げる
- エディタ支援で開発速度を上げる
- フロントもバックも一貫改善

</div>
</div>

---

## まとめ

### TypeScriptはJavaScript世界の帰結

**歴史の流れ**
```
急造言語JS → ブラウザ戦争 → Ajax/V8革命
                ↓
      jQuery・Babel・TC39 が橋渡し
                ↓
    ReactがTS適応で先行 → TSが統一解へ
```

**TypeScriptが勝った理由**
- JS互換で導入障壁が低い
- 大規模開発を型で支える

---

## 次回予告

### T-2: TypeScript基礎文法

**「型注釈と型推論 — どこに明示し、どこを推論に任せるか」**

- 基本型: `string`, `number`, `boolean`
- 配列・オブジェクト・関数の型
- 型推論の仕組み
- `any`, `unknown`, `never`
- Union型とIntersection型

---

## 参考リンク

- [JavaScript: The First 20 Years](https://dl.acm.org/doi/book/10.1145/3386327)
- [A Short History of JavaScript](https://www.w3.org/community/webed/wiki/A_Short_History_of_JavaScript)
- [TypeScript Official Docs](https://www.typescriptlang.org/)
- [Babel Documentation](https://babeljs.io/)
- [TC39 Proposals](https://github.com/tc39/proposals)
