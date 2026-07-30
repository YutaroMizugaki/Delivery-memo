# 配達メモ

イオンネクスト辰巳拠点の配達ドライバー向け、タワーマンション等の難物件の配達手順をスマホ現場で素早く引ける内製ツールです。

## 機能

- **19物件**の手順データを初期搭載
- 物件名・エリア・手順メモの横断検索（表記ゆれ・英語/ローマ字対応）
- フィルタ: 台車で変わる / 要受付 / エリア別
- 物件の追加・編集・削除
- 重複・類似物件の検出
- **最終更新日時**の表示
- JSONバックアップのエクスポート・インポート
- チーム共有モード（localStorage）
- **PWA対応**（オフライン閲覧・ホーム画面追加）
- **トースト通知**（保存・削除・バックアップ等）

## 公開 URL（GitHub Pages）

https://YutaroMizugaki.github.io/Delivery-memo/

`main` ブランチへマージすると、GitHub Actions で自動デプロイされます。

初回はリポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。

## ローカルで動かす

```bash
python3 -m http.server 8080
```

ブラウザで http://localhost:8080 を開いてください。

## ファイル構成

```
.
├── index.html           # メイン画面
├── delivery-memo.html   # index.html へのリダイレクト
├── .github/workflows/   # GitHub Pages デプロイ
├── .nojekyll            # Jekyll 無効化（GitHub Pages用）
├── manifest.webmanifest # PWAマニフェスト（相対パス）
├── sw.js                # Service Worker（network-first + バージョン管理）
├── icons/               # アプリアイコン（SVG + PNG 192/512）
├── css/
│   └── styles.css
├── js/                  # アプリロジック（ES Modules）
└── scripts/
    └── gen-icons.mjs    # PNGアイコン生成用
```

## ライセンス

MIT
