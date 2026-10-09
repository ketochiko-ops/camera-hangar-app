# 映像エンジンの初期値

TECHNICAL DATAのENGINE（映像エンジン）には、メーカー公表の画像処理エンジン名を表示します。評価値や追加パーツ補正とは独立したスペック項目です。

| カメラ | ENGINE | メーカーの出典 |
| --- | --- | --- |
| Nikon Z f | EXPEED 7 | [ニコン：搭載画像処理エンジン一覧](https://nij.nikon.com/support/faq/products/article?articleNo=000055730) |
| Nikon Z fc | EXPEED 6 | [ニコン：搭載画像処理エンジン一覧](https://nij.nikon.com/support/faq/products/article?articleNo=000055730) |
| Nikon D7500 | EXPEED 5 | [ニコン：搭載画像処理エンジン一覧](https://nij.nikon.com/support/faq/products/article?articleNo=000055730) |
| Canon EOS 5D Mark IV | DIGIC 6+ | [Canon Camera Museum](https://global.canon/en/c-museum/product/dslr849.html) |
| SONY α7R IIIA | BIONZ X | [Sony：ILCE-7RM3A](https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7rm3a-b) |
| FUJIFILM X-T5 | X-Processor 5 | [FUJIFILM：X-T5 Specifications](https://www.fujifilm-x.com/global/products/cameras/x-t5/specifications/) |

確認日：2026-10-10。登録値は`src/data/cameraImageProcessors.ts`にまとめ、提供済みCSV原本の内容は保持します。

旧保存データと旧CSVにこの項目がない場合、IDと名称が一致する標準6台は上記の値で補完します。その他のカメラは空欄で開始し、詳細では「—」と表示します。保存済みの入力値や明示的な空欄は保持し、元のlocalStorageは次の保存操作まで変更しません。

編集画面で自由に変更できます。CSV列は`image_processor`です。更新CSVに列がない場合は既存の登録値を保持し、列があり空欄の場合は登録値を空欄に更新します。詳細・比較・PNG出力は同じ値を使用します。
