# カメラ・レンズのCSV入出力

「DATA MANAGEMENT」で **CAMERAS** または **LENSES** を選択し、次の操作を行います。

1. **CSV出力**：選択中の種類の全機材を出力します。
2. **CSVテンプレート**：登録に使える全列のヘッダーをダウンロードします。
3. **ChatGPTで登録CSVを作る**：展開すると、その種類に合った作成依頼文をコピーできます。調査したい機材名や調査結果と一緒にChatGPTへ渡してください。
4. **CSV読み込み**：ファイルを選択し、追加／更新件数と内容を確認して「○件を登録する」を押します。

CSVは **UTF-8・カンマ区切り** です。UTF-8 BOMの有無、CRLF／LF、二重引用符で囲まれたカンマ・改行に対応します。Excelでは「CSV UTF-8」で保存してください。最大2 MiB・1,000件です。

## 追加と更新

- `id` が空欄、または列自体がなければ、新しいIDを発行して追加します。新規作成のCSVでは空欄にしてください。
- 出力CSVの既存 `id` を保持すると、その機材を更新します。未知のIDは新規追加として扱います。
- 更新ではCSVの値を採用します。任意列の省略・空欄も空文字に置き換え、評価の省略・空欄は0になります。
- CSVにない機材は削除しません。別種類の機材も保持します。
- 写真はCSVに含めません。更新対象の登録済み写真は保持し、新規機材は写真なしで登録します。CSV単独では写真込みのバックアップにはなりません。
- 必須値、数値、0〜10の評価、ID重複などを検査します。不正な行が1件でもあれば、全件の登録を中止して行番号・列名・理由を表示します。
- 確認前、キャンセル時、保存容量不足時には既存データを変更しません。1回の保存で全件を登録します。

同じ新規CSVをID空欄のまま再び読み込むと、新規登録が繰り返されます。登録後の更新には、CSV出力で取得したIDを使ってください。

## 列の形式

ヘッダーの順番は変更できます。大文字／小文字は区別しません。未対応の列・重複した列はエラーになります。任意列は省略できます。

共通の必須列：`name`, `maker`, `category`, `summary`。

| 列         | 内容                              |
| ---------- | --------------------------------- |
| `id`       | 任意の機材ID。新規追加時は空欄    |
| `name`     | 機材名（100文字以内）             |
| `maker`    | メーカー名                        |
| `category` | カテゴリ（例：Mirrorless、Prime） |
| `summary`  | 説明・機材メモ（700文字以内）     |

その他の各セルは180文字以内です。調査元URLや参考文献はCSVと別に受け取ってください。根拠のないスペックや評価は埋めず、不明な任意項目は空欄にします。必須情報が確認できない機材は登録対象から外してください。

### カメラ

追加の必須列：`role`, `mount`。

```csv
id,name,maker,category,summary,role,mount,sensor,effective_pixels,burst_rate,image_stabilization,weight,storage_media,af_system,release_year,additional_parts,rating_detail,rating_night,rating_latitude,rating_response,rating_stability,rating_endurance,rating_mobility
```

| 列                    | 入力例・意味                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `role`                | MULTIROLE、STREETなど                                            |
| `mount`               | Nikon Zなど。レンズの対応マウントと同じ名前を使用                |
| `sensor`              | FULL FRAME CMOSなど                                              |
| `effective_pixels`    | 24.5 MP                                                          |
| `burst_rate`          | 14frames /s（14 fps、単位なしの数値、既存の「コマ/秒」も使用可） |
| `image_stabilization` | 手ぶれ補正の説明                                                 |
| `weight`              | 710 g                                                            |
| `storage_media`       | SD + microSDなど                                                 |
| `af_system`           | AFシステムの説明                                                 |
| `release_year`        | 4桁の発売年（1800〜2199）                                        |
| `rating_*`            | 0〜10の数値。小数可。空欄は0                                     |

`additional_parts`は任意の追加パーツ列です。値はJSON配列で、種類は`grip`・`adapter`・`other`、名称は`name`に指定します。最大8個、名称は1行64文字まで、列全体は4096文字までです。

各パーツに任意の`effects`を指定すると評価を補正できます。例：`{"kind":"grip","name":"Custom grip","effects":{"stability":0.5,"mobility":-0.3}}`。キーは`detail`・`night`・`latitude`・`response`（AF）・`stability`・`endurance`・`mobility`、値は−10〜+10の数値です。`effects`省略は[参考補正](part-effects.md)（未対応名は0）、`effects:{}`は補正なし、オブジェクト内の未指定項目も0です。不正な項目名や値はバッチ全体を取り込みません。`rating_*`は本体評価なので、パーツの補正を加算しないでください。

セルの値の例：

```json
[
  { "kind": "grip", "name": "SmallRig" },
  { "kind": "adapter", "name": "Nikon FTZ II" }
]
```

CSVではJSONの引用符を二重にし、セル全体を二重引用符で囲みます。最小構成の例：

```csv
name,maker,category,summary,role,mount,additional_parts
Nikon Z f,Nikon,Mirrorless,撮影用の構成,MULTIROLE,Nikon Z,"[{""kind"":""grip"",""name"":""SmallRig""},{""kind"":""adapter"",""name"":""Nikon FTZ II""}]"
```

既存機材の更新でこの列自体を省略すると、登録済みの追加パーツを保持します。列がある場合はCSVの一覧で置き換え、空欄または`[]`は全パーツの解除になります。旧CSVはそのまま読み込めます。

### レンズ

追加の必須列：`compatible_mounts`, `focal_length`, `max_aperture`, `weight`。

```csv
id,name,maker,category,summary,compatible_mounts,focal_length,max_aperture,weight,usage_tags,rating_resolution,rating_bokeh,rating_low_light,rating_reach,rating_close_focus,rating_mobility,rating_versatility
```

| 列                  | 入力例・意味                                 |
| ------------------- | -------------------------------------------- |
| `compatible_mounts` | Nikon Zなど。複数は半角パイプ区切り          |
| `focal_length`      | 50 mm または 24–70 mm                        |
| `max_aperture`      | f/1.8 または f/3.5–4.5                       |
| `weight`            | 250 g                                        |
| `usage_tags`        | street、portraitなど。複数は半角パイプ区切り |
| `rating_*`          | 0〜10の数値。小数可。空欄は0                 |

`|` は複数値の区切りとして予約されています。カンマを含む値は二重引用符で囲み、値内の引用符は `""` として記述します。CSVの前後にMarkdownのコードフェンスや説明行は入れません。

最小構成の入力例（架空の機材・参考値）：

```csv
name,maker,category,summary,role,mount
Example Camera,Example Maker,Mirrorless,調査結果のメモに置き換えてください,MULTIROLE,Nikon Z
```

```csv
name,maker,category,summary,compatible_mounts,focal_length,max_aperture,weight,usage_tags
Example Lens,Example Maker,Prime,"メモにカンマ, を含む例",Nikon Z,50 mm,f/1.8,250 g,street|portrait
```

出力CSVでは、表計算ソフトが数式として解釈する可能性のある文字列を先頭のアポストロフィで保護します。アプリへ再読み込みすると元の文字列に戻ります。

## 評価項目と旧データの互換性

カメラの評価は次の7項目・順序で表示します。日本語併記モードでは「表示 / 内容」の形式になります。

| 表示      | CSV列              | 内容               |
| --------- | ------------------ | ------------------ |
| DETAIL    | `rating_detail`    | 解像性能           |
| NIGHT     | `rating_night`     | 低照度性能         |
| LATITUDE  | `rating_latitude`  | ダイナミックレンジ |
| AF        | `rating_response`  | AF性能             |
| STABILITY | `rating_stability` | 撮影安定性         |
| ENDURANCE | `rating_endurance` | バッテリー持続力   |
| MOBILITY  | `rating_mobility`  | 携行性             |

AFの内部キーとCSV列名は互換性のため`response`・`rating_response`を維持しています。日本語併記モードでは「AF / AF性能」と表示します。

レンズの評価は次の7項目・順序です。

| 表示        | CSV列                | 内容                   |
| ----------- | -------------------- | ---------------------- |
| RESOLUTION  | `rating_resolution`  | 解像性能               |
| BOKEH       | `rating_bokeh`       | 背景のボケ             |
| LOW LIGHT   | `rating_low_light`   | 低照度での性能         |
| REACH       | `rating_reach`       | 遠距離の被写体への対応 |
| CLOSE FOCUS | `rating_close_focus` | 近接撮影               |
| MOBILITY    | `rating_mobility`    | 携行性                 |
| VERSATILITY | `rating_versatility` | 汎用性                 |

旧カメラCSVも読み込めます。`rating_resolution`をDETAIL、`rating_low_light`（または`rating_high_iso`）をNIGHT、`rating_dynamic_range`をLATITUDE、`rating_autofocus`をAFへ引き継ぎます。`rating_portability`はMOBILITYへ引き継ぎます。新しい列がある場合、その値を優先します（空欄は0）。STABILITY・ENDURANCEは旧評価から推測せず、列がなければ0です。

旧レンズCSVの`rating_sharpness`、`rating_portability`、`rating_close_up`は、それぞれRESOLUTION、MOBILITY、CLOSE FOCUSへ引き継ぎます。別名と対応する元の列を同じCSVに含めると重複列エラーになります（例：`rating_high_iso`と`rating_low_light`）。

保存済みの旧カメラ評価も同じ対応で移行します。旧BOKEH・REACH・CLOSE FOCUS・VERSATILITYなどは、新評価への転用をせず保持します。CSV出力時は保持している旧評価の列も追加するため、再読み込みで失われません。旧列を省略したCSVで更新しても、保存済みの旧評価は保持します。

元のlocalStorageは、ユーザーが保存操作をするまでは変更しません。評価項目が欠けた現在の形式や不正な旧評価は、通常の読み込みエラーとして扱います。

カメラ詳細と比較画面・PNGの表示はSENSOR、PIXELS、MOUNT、BURST、MEDIA、WEIGHT、RELEASEの7項目です。CSVのスペック列名は従来の形式を維持しています。手ぶれ補正・AFシステムは表示対象から外しますが、既存値とCSV列は保持します。
