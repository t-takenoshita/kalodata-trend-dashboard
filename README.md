# Kalo Trend Lens

TikTok Shop Japanの商品トレンドを探索する、静的な分析ダッシュボードのプロトタイプです。

画面上の「Excel読込」からKaloDataの商品Excel（`.xlsx`）を選択すると、ブラウザ内だけで実データへ切り替えられます。ファイルはサーバーへ送信されません。絞り込み結果もExcelで出力できます。

## 拡張構成

- `src/excel.js` — Excel入出力
- `src/kalodata-adapter.js` — KaloData列名から共通商品形式への変換
- `src/sample-data.js` — 公開用サンプルデータ
- `src/app.js` — 検索・集計・画面描画

将来APIを追加する場合は、APIレスポンスを`kalodata-adapter.js`と同じ共通商品形式へ変換すれば、画面側を変更せず接続できます。

## KaloData API接続

GitHubのリポジトリで **Settings → Secrets and variables → Actions** を開き、Repository secretとして`KALODATA_API`を登録します。次に **Actions → KaloDataの商品データを更新 → Run workflow** を実行すると、「昨日・過去7日・過去30日」の商品データが`data/`へ保存されます。任意期間も必要な場合は実行時に`yyyy-MM-dd~yyyy-MM-dd`を入力します。

サイトの期間変更は、最後にActionsで取得した各期間のJSONを切り替えます。APIキーは公開されませんが、取得結果のJSONは公開されます。リアルタイム取得へ戻す場合に備え、Cloudflare Worker版も`worker/`へ残しています。

商品ランキングAPIに含まれない評価・送料は「—」表示です。カテゴリーIDと名称の対応はカテゴリーAPIを追加した後に連動できます。

## GitHub Pages

GitHubのリポジトリ画面から **Settings → Pages → Deploy from a branch** を選び、`main` / `/(root)` を指定すると公開できます。

## セキュリティ

APIキー、パスワード、有料サービスから取得した非公開Excelをこの公開リポジトリへコミットしないでください。
