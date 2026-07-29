# 配達メモ

イオンネクスト辰巳拠点の配達ドライバー向け、タワーマンション等の難物件の配達手順をスマホ現場で素早く引ける内製ツールです。

## 機能

- **19物件**の手順データを初期搭載
- 物件名・エリア・メモ本文の横断検索（表記ゆれ・英語/ローマ字対応）
- フィルタ: 台車で変わる / 手続き必要 / 時間外で変わる / エリア別
- 物件の追加・編集・削除
- 重複・類似物件の検出
- 防災センター対応時間の自動判定（時間内/時間外）
- JSONバックアップのエクスポート・インポート
- チーム共有モード（localStorage）

## 使い方

```bash
python3 -m http.server 8080
```

ブラウザで http://localhost:8080/delivery-memo.html を開いてください。

## ファイル

- `delivery-memo.html` — 単一HTMLファイル（CSS・JS込み）

## データ構造

各物件は以下のフィールドを持ちます:

| フィールド | 説明 |
|---|---|
| name | 物件名 |
| area | エリア |
| time | 所要時間目安 |
| permit | 駐車許可証あり |
| cash | 現金が必要 |
| parking | 駐車場所・方法 |
| proc | 防災センター・受付の手順 |
| procReq | 手続き要否 (required / conditional / notRequired) |
| hours | 対応時間 |
| hoursDiffers | 時間外で対応が変わる |
| procOut | 時間外の手順 |
| cartDiffers | 台車の有無で対応が変わる |
| cartNo / cartYes | 台車なし/ありの手順 |
| notes | その他注意点 |

## ライセンス

MIT
