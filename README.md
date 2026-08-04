# Kalo Trend Lens

TikTok Shop Japanの商品トレンドを探索する、静的な分析ダッシュボードのプロトタイプです。

初期表示はUI確認用のサンプルデータです。画面上の「CSV読込」からKaloDataの商品CSVを選択すると、ブラウザ内だけで実データへ切り替えられます。ファイルはサーバーへ送信されません。

## 拡張構成

- `src/csv.js` — CSV入出力
- `src/kalodata-adapter.js` — KaloData列名から共通商品形式への変換
- `src/sample-data.js` — 公開用サンプルデータ
- `src/app.js` — 検索・集計・画面描画

将来APIを追加する場合は、APIレスポンスを`kalodata-adapter.js`と同じ共通商品形式へ変換すれば、画面側を変更せず接続できます。

## GitHub Pages

GitHubのリポジトリ画面から **Settings → Pages → Deploy from a branch** を選び、`main` / `/(root)` を指定すると公開できます。

## セキュリティ

APIキー、パスワード、有料サービスから取得した非公開CSVをこの公開リポジトリへコミットしないでください。
