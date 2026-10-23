# smz-homepage

しみずWeb制作所のホームページです。HTMLファイルだけで動く静的サイトで、Cloudflare Pages で公開しています。

- ビルド不要（Tailwind CSS は CDN から読み込み）
- `main` ブランチに push すると本番に自動で反映

## ファイル構成

```
.
├── index.html                          # トップページ（/）
├── flow/
│   └── index.html                      # Web制作の流れ（/flow）
├── shimizu-logo.jpeg                   # ロゴ・ファビコン
├── aircon-house-cleaning-work.png      # 制作実績のサムネイル
├── payroll-invoice-system-work.png     # 制作実績のサムネイル
└── README.md
```

画像はリポジトリ直下に置き、HTML からは `/shimizu-logo.jpeg` のように `/` 始まりで参照します。

### ページを増やすとき

`フォルダ名/index.html` を作ると、`https://ドメイン/フォルダ名` で公開されます。`<head>`・ヘッダー・フッター・末尾の `<script>` は既存ページからコピーしてください（ビルドがないので、共通部分は各ページに書きます）。ヘッダーのメニューやフッターを変えるときは、**全ページを同じように直す**必要があります。

## ローカルで確認する

### いちばん手軽な方法

```bash
open index.html
```

ブラウザで直接開きます。ただし画像やリンクのパスが `/` 始まりのため、この方法では**画像が表示されず、`/flow` などへのリンクも動きません**。

### 画像やページ間のリンクまで確認したいとき

```bash
python3 -m http.server 8000
```

ブラウザで http://localhost:8000 を開きます。止めるときは `Ctrl + C`。

## 編集ガイド

### 文章を変える

`index.html` をエディタで開き、変えたい文言で検索して直接書き換えます。

| 変えたいもの | 検索のヒント |
| --- | --- |
| キャッチコピー | `ちょうどいいWeb制作` |
| お悩みリスト | `こんなお悩み` |
| サービス内容 | `id="services"` |
| 制作実績 | `id="works"` |
| 料金 | `id="price"` |
| よくある質問 | `よくある質問` |
| プロフィール | `id="about"` |
| お問い合わせ先 | `mailto:` |
| 制作の流れ・修正ルール・期間 | `flow/index.html` を開く |

### 色・フォントを変える

`<head>` 内の `@theme` で一括管理しています。

```css
@theme {
  --color-brand: #439ce4;                         /* ブランドカラー（ボタン・アクセント） */
  --font-sans: "Noto Sans JP", ...;               /* 本文フォント */
  --font-brand: "Zen Maru Gothic", ...;           /* ロゴ文字のフォント */
}
```

`--color-brand` を変えると、`bg-brand` や `text-brand` を使っている箇所がすべて変わります。

### スタイルの書き方

見た目は [Tailwind CSS v4](https://tailwindcss.com/docs) のクラスで指定しています。CDN 版なので、新しいクラスを書き足してもビルドなしでそのまま反映されます。

アニメーション（ヒーローのフェードイン、浮かぶカード、ボタンの光沢、スクロール時のフェードイン）は `<style>` 内の CSS と、ページ末尾の `<script>` で定義しています。OS の「視差効果を減らす」設定がオンの場合は、アニメーションを止めます。

## 公開（Cloudflare Pages）

### 普段の更新

```bash
git add -A
git commit -m "変更内容"
git push
```

`main` に push すると 1〜2 分で本番に反映されます。`main` 以外のブランチを push すると、確認用のプレビュー URL が発行されます。

### 初回設定（済んでいれば不要）

1. Cloudflare ダッシュボード →「Workers & Pages」→「作成」→「Pages」→「Git に接続」
2. リポジトリ `shoheyosaka/smz-homepage` を選択
3. ビルド設定

   | 項目 | 値 |
   | --- | --- |
   | 本番ブランチ | `main` |
   | フレームワークプリセット | なし |
   | ビルドコマンド | （空欄） |
   | ビルド出力ディレクトリ | `/` |

4. 「保存してデプロイ」

独自ドメインを使う場合は、Pages プロジェクトの「カスタムドメイン」から設定します。

## TODO

- [x] 画像3点（ロゴ・制作実績2点）を追加
- [ ] お問い合わせ先 `contact@example.com` を実際のアドレスに変更
- [ ] プロフィール写真の差し替え（現在はアイコンのみ）
