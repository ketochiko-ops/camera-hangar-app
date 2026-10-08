# 動作確認結果

2026-10-08、developブランチの実装を次の環境で検証しました。

- Node.js 24.19.0 / npm 11.9.0
- Chromium 151.0.7922.173 / Playwright
- React 19 / TypeScript 5.9 / Vite 7

| 確認 | 結果 |
| --- | --- |
| UT・IT | 4ファイル、30件通過 |
| E2E | 12件通過 |
| TypeScriptのstrict検査 | 通過 |
| 本番ビルド | 成功、dist/を生成 |
| カメラ・レンズ両方の追加・編集・削除 | 通過、リロード後の保存状態も確認 |
| 画像アップロードと未設定時の表示 | 通過 |
| 最大3件の比較 | 通過 |
| 1024px・768px・390px表示 | ページの横方向のはみ出しなし |
| カメラ・レンズPNG出力 | 両画面とも16:9・1:1・4:5で通過 |
| PNGファイルの寸法・シグネチャ・デコード | 各比率で通過 |
| ブラウザのページエラー | 確認フローで0件 |

PNGの検証は出力関数のモックではなく、Chromiumの実際のダウンロードファイルを読み取って行っています。単体テストで保存容量エラーを再現し、結合テストでエラー時に編集内容を保持することも確認しています。壊れた保存データが上書きされないこと、複数マウントの手入力が保持されることは、失敗する再現テストを追加してから修正しました。

Firefox・Safari・スマートフォン実機は未検証です。GitHub Actionsの定義を追加しています。Vercelでの公開確認については以下に記載しています。

## Vercel公開・自動デプロイの確認

- プロジェクト：`camera-hangar-app`（既存プロジェクトを使用）
- リポジトリ：`ketochiko-ops/camera-hangar-app`
- GitHubデフォルトブランチ：`develop`
- 公開URL：https://camera-hangar-app.vercel.app
- Vercel上の環境：`production`、状態：`READY`、デプロイ元：`git`
- 初回公開コミット：`8394264`
- 初回developへのpushはVercelの初回デプロイ特例でProductionになりましたが、2回目のpushはPreviewでした。その後、ProductionのBranch Trackingをdevelopへ切り替えました。
- 最新の実装コミット`318a4c7`はAPIからProductionとして別途公開し、READYを確認しました。
- Production Branchの変更はユーザーがVercel画面から実施しました。設定後のコミット`d3aac4b`をdevelopへpushすると、VercelのGit連携から本番デプロイ`dpl_F4jw2ZToirSVKxnqMmFvimRD18mv`が自動起動し、`source: git`・`target: production`・`READY`と公開URLの割り当てを確認できました。
- Vercel上でNode.js 24.x、`npm ci`、`npm run build`、`dist`出力のビルドが成功。
- Vercelコネクター経由で本番HTML・JavaScript・CSSのHTTP 200応答を確認。
- 実行環境の送信先制限により、本番への直接ブラウザ接続・匿名アクセスの再検証は行っていません。ローカルの実ブラウザE2Eは12件通過しています。
- 本番のエラー／fatal実行ログの照会で該当ログなし。このアプリは静的SPAで、サーバー関数は使いません。
- ビルドログで発見した開発依存の既知の脆弱性を解消するため、Vite 7互換のVitest 4.1.11へ更新。`npm audit`は0件、UT・IT30件と本番ビルドも再確認済み。

ProductionのBranch Trackingはdevelopへ設定済みです。PRをdevelopへマージするとVercelの本番更新が起動します。GitHub Actionsのテスト成功をマージ条件にする場合は、READMEに記載したブランチルールを追加できます。GitHub Actionsの実行結果は、この環境のコネクターではpush起動の実行一覧を取得できないため、完了確認にはGitHubのActions画面を使用してください。
