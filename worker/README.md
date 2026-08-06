# KaloData API proxy

Cloudflare WorkerでKaloDataの`secret-key`を非公開にするための中継です。

```sh
cd worker
npx wrangler secret put KALODATA_SECRET_KEY
npx wrangler deploy
```

表示されたWorker URLを`src/api-config.js`の`API_PROXY_URL`へ設定します。APIキーをファイルへ書いたり、GitHubへコミットしたりしないでください。
