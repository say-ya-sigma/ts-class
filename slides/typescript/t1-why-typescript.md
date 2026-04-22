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

**ECMAScript を前に進めるための標準化委員会**

- ブラウザベンダーや関係企業が集まり、JavaScriptの将来を議論する
- `Chrome` / `Firefox` / `Safari` / `Node.js` などで動く共通仕様を整える
- 「新機能を誰かが勝手に実装する」のではなく、合意形成して標準化する

**提案は段階的に進む**
- `Stage 0`: アイデア
- `Stage 1`: 検討に値する提案
- `Stage 2`: 仕様の形が見え始める
- `Stage 3`: 実装・検証の最終段階
- `Stage 4`: ECMAScript標準へ正式採用

**現場への意味**
- `async/await` や Optional Chaining も、いきなり生えたわけではない
- `Babel` は TC39 で進む未来の仕様を先取りして使いやすくした
- TC39 がいるから「実装系が違っても、同じJSとして動く世界」が保たれる

---

## 世界を統一しようとした者たち: TC39 / jQuery / Babel

**Web開発は最初から整っていたわけではない**

**TC39**
- 言語仕様そのものを標準化した

**jQuery**
- 現場レベルでブラウザ差分を吸収した

**Babel**
- 未来の文法を現在の環境で使えるようにした

**つまり**
- `TC39` が仕様を作り
- `Babel` が未来を先取りし
- `jQuery` が現場の地獄を埋めた

---

## AltJS の時代: みんな「もっとまともな言語が欲しい」と思っていた

### CoffeeScript, Dart, Flow... しかし最終的に残ったのはTSだった

**CoffeeScript**
- 当時かなり人気があった
- 古いAngular周辺や初期のフロントで見かけることもあった
- ただし「JSとは別言語を覚える」コストが重い

**Dart**
- Googleの大きな野望だった
- しかし「ブラウザそのものを置き換える」は難しかった

**Flow**
- 型の方向性は良かった
- ただしエコシステム全体を取れなかった

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
- 既存資産を捨てずに改善できる

**これが決定的だった**
- 新言語への全面移行を要求しない
- チームで少しずつ導入できる
- 大企業もスタートアップも採用しやすい

---

## Reactが強かった理由の一つは、TypeScriptへの適応が速かったこと

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
- TypeScriptの登場は仮想DOM以後
- ReactはJavaScriptの構文に比較的忠実だった
- そのため「JSのスーパーセット」であるTypeScriptと接続しやすかった

**結果として**
- TS + React の開発体験が早期に強くなった
- 大規模開発の安心感が増した
- これがReact普及の一因になった

---

## Vueが不利だったのは「弱かったから」ではなく、時代との噛み合わせもある

### 特に class-style / decorator 周辺は難所だった

**Vue側の事情**
- 初期Vueは書き味が魅力だった
- ただしTypeScriptとの接合は長く試行錯誤が続いた
- class ベース記法は一時広まったが、標準化や将来性の問題を抱えた

**Vue 3 で何が起きたか**
- Composition API によって TS 相性は大きく改善
- ただし「昔のVue TSの書き方」がそのまま本流にはならなかった

**言い換えると**
- ReactはTS時代への移行が速かった
- Vueは優れた設計を持ちながら、周辺環境の都合で遠回りした

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

## つまり TypeScript は、歴史の全部乗せ回答だった

### JavaScriptが抱えた長年の問題に、一番現実的に応えた

**JavaScript史の課題**
- もともと急造言語だった
- ブラウザ差分が激しかった
- Ajax時代で複雑さが増した
- V8/Nodeで大規模開発需要が爆発した
- BabelやjQueryが橋渡しを続けた

**TypeScriptの回答**
- 型で大規模開発を支える
- JS互換で導入障壁を下げる
- エディタ支援で開発速度を上げる
- フロントもバックも一貫して改善する

---

## まとめ

### TypeScriptは流行ではなく、JavaScript世界の帰結である

1. JavaScriptは短期間で生まれた急造言語だった
2. ブラウザ戦争でWebは長く魔境だった
3. Googleは Ajax のUXと V8 の実行性能で時代を進めた
4. jQuery・Babel・TC39 が世界の破片をつなぎ続けた
5. React は TypeScript 時代への適応が速かった
6. Vue も優れていたが、TSとの接合では遠回りが多かった
7. その結果、TypeScript が「最も現実的な統一解」となった

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
