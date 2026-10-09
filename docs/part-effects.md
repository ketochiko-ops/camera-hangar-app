# 追加パーツの参考補正

2026-10-09にメーカー仕様を確認。数値はアプリ内の0〜10評価に合わせた**主観的な参考設定**で、メーカー測定値やベンチマークではありません。本体のスコアは保存したまま、装着した全パーツの補正を合計し、最後に0〜10へ制限します。画面の増減は制限後の実際の差分です。青は増加、赤い斜線は失われた範囲を表します。パーツを削除すると補正も外れます。

| 登録パーツ            | STABILITY | ENDURANCE |   AF | MOBILITY | 設定の根拠                                                                                     |
| --------------------- | --------: | --------: | ---: | -------: | ---------------------------------------------------------------------------------------------- |
| SmallRig              |      +0.5 |         0 |    0 |     −0.3 | 型番未指定のためZ f用4262を参考に、保持の改善と102 gの追加重量を反映                           |
| Nikon FTZ II          |         0 |         0 |    0 |     −0.5 | 125 gの追加重量。対応AF-S/AF-P/AF-Iレンズでの使用を想定し、AFを一律に下げない                  |
| SONY VG-C3EM          |      +0.5 |      +2.0 |    0 |     −1.5 | 縦位置の保持と、NP-FZ100を2本入れた連続使用を想定。グリップと予備バッテリーの重量・容積を反映  |
| MonsterAdapter LA-FE1 |         0 |         0 | −1.0 |     −0.5 | 写真のみAF対応、動画AF非対応という機能制約を参考AF評価に反映。三脚座なし約105 g                |
| Fringer FR-FTX2       |         0 |         0 | −0.5 |     −0.7 | 最適化済みレンズでPDAF対応。レンズ・光条件によるAF変動とアダプターの重量・容積を参考評価に反映 |

DETAIL・NIGHT・LATITUDEはこれらのパーツで変更しません。STABILITYの加算は保持のしやすさを表し、ボディ内手ぶれ補正の段数・センサー性能が向上する意味ではありません。AF減点はメーカーが公表した速度差ではなく、運用制約に対するアプリ内の目安です。レンズの組み合わせ・ファームウェア・使用感に応じて編集してください。VG-C3EMのENDURANCEは2本装填時の補正で、1本のみなら0に変更できます。

## ライティング

| 登録パーツ | 追加重量（電池を含まない） | MOBILITY | 追加機能 |
| --- | ---: | ---: | --- |
| Godox X2-T | 90 g | −0.3 | WIRELESS FLASH（無線ストロボ使用可） |
| Godox TT600 | 400 g | −1.5 | FLASH（ストロボ使用可） |

Z fにはX2T-N、α7R IIIAにはX2T-S、X-T5にはX2T-F、5D Mark IVにはX2T-Cを登録し、各カメラへTT600も追加します。機動力の参考減点は重量と容積を考慮した主観的な設定です。他の評価項目は変更しません。機能表示はTTL・HSSやセンサー性能の向上を意味しません。

WEIGHTは本体重量を保持し、登録した追加重量の合計を赤字で追記します。従来のグリップ・アダプターの重量初期値は0なので、全装備の実測重量を表す値ではありません。それらの重量や電池を含める場合は編集してください。TT600のメーカー記載は電池なし400 g・電池込み500 gです。ADDITIONAL FUNCTIONS欄の機能は青字で表示し、複数パーツで同じ機能を追加しても重複しません。

ライティングを含む初期装備での補正後の例：

| カメラ        |         AF |  STABILITY |             ENDURANCE |   MOBILITY |
| ------------- | ---------: | ---------: | --------------------: | ---------: |
| Nikon Z f     |        9.0 | 9.5 (+0.5) |                   6.0 | 3.4 (−2.6) |
| SONY α7R IIIA | 7.5 (−1.0) | 7.5 (+0.5) | 10.0 (+1.5、上限適用) | 3.2 (−3.8) |
| FUJIFILM X-T5 | 8.0 (−0.5) |        8.5 |                   8.0 | 5.5 (−2.5) |
| Canon EOS 5D Mark IV | 8.0 | 0.0 | 9.0 | 2.2 (−1.8) |

4台ともライティングの追加重量は合計490 g、追加機能はWIRELESS FLASHとFLASHです。

## 編集とCSV

対応マウントの拡張もMOUNT欄に青字で表示します。FTZ IIはNikon Zへ、LA-FE1はSony Eへ、FR-FTX2はFujifilm Xへ、Nikon Fレンズのマウントを追記します。参照元は下記の各メーカー仕様です。登録名とパーツ種類、カメラ側マウントが一致する場合に表示し、未登録名からは推測しません。複数の対応アダプターで同じマウントを追加しても1回だけ表示します。`effects:{}`で評価補正を無効にしても、このマウント表示は維持します。

追加パーツ欄の「STATUS EFFECTS」で各項目を−10〜+10の範囲で編集できます。既知の名前は参考値を自動で適用し、未登録名は0です。種類も一致する必要があります。名前の英字大小・空白・ハイフン・全角英数字・FTZⅡの表記差は許容します。「SmallRig」は指定のZ fグリップ用の登録名で、他のSmallRig製品へ自動適用しません。

CSVの`additional_parts`内に任意の`effects`オブジェクトを含めます。省略すると自動補正、`{}`は全項目0、指定したオブジェクトの未指定項目も0です。カメラの`rating_*`列は本体評価を入れ、補正を加算しません。保存済みの追加パーツに`effects`がない場合も、データを上書きせず自動補正を表示します。

同じ編集欄で追加重量（0〜10000 g）と機能を設定できます。CSVでは`weightGrams`と`features`を指定し、省略時は参考値、0と空配列はそれぞれ重量・機能なしを表します。機能キーは`wirelessFlash`・`flash`です。評価補正・重量・機能は独立しており、「参考値に戻す」で3つとも参照値に戻ります。`weight`列には追加分を含めない本体重量を登録してください。

```json
[
  {
    "kind": "grip",
    "name": "Custom grip",
    "effects": { "stability": 0.5, "mobility": -0.3 }
  },
  { "kind": "adapter", "name": "Nikon FTZ II" }
]
```

## 調査元

- [SmallRig Z f用グリップ4262](https://www.smallrig.com/SmallRig-L-Shape-Handle-for-Nikon-Zf-4262.html)：保持の改善、重量102 g。型番未指定のSmallRigの参考モデル。
- [Nikon FTZ II仕様・対応機能](https://imaging.nikon.com/imaging/lineup/accessory/camera/ftz_2/)：重量125 g、対応レンズによるAF/AE。AF-Dなどの非対応を全レンズに一般化しない。
- [Sony VG-C3EM](https://www.sony.com.sg/electronics/interchangeable-lens-cameras-vertical-grips/vg-c3em)：縦位置操作、NP-FZ100を2本搭載して運用時間を延長。
- [MonsterAdapter LA-FE1](https://www.monsteradapter.com/products/la-fe1-nikon-f-mount-lenses-to-sony-e-mount-cameras-adapter)：対応AFレンズ・写真のみのAF、重量約105 g（三脚座なし）/153 g（あり）。
- [Fringer NF-FX II / FR-FTX2](https://www.fringeradapter.com/nikon-f-to-fujifilm-x)：最適化済みレンズでPDAF・顔/瞳AF、レンズ・光条件による変動、手ぶれ補正の制約。
- [Godox X2](https://godox.com/product-d/X2.html)・[X2T-N公式説明書](https://www.godox.com/static/upload/file/20230628/1687944822437800.pdf)：2.4 GHz無線トリガー、重量90 g。
- [Godox TT600](https://godox.com/product-d/TT600.html)・[公式説明書](https://www.godox.com/static/upload/file/20230227/1677483894404485.pdf)：ストロボ機能、重量400 g（電池なし）/500 g（電池込み）、単3電池4本。
