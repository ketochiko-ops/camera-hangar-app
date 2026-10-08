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
id,name,maker,category,summary,role,mount,sensor,effective_pixels,burst_rate,image_stabilization,weight,storage_media,af_system,release_year,rating_resolution,rating_bokeh,rating_low_light,rating_reach,rating_close_focus,rating_mobility,rating_versatility
```

| 列                    | 入力例・意味                                        |
| --------------------- | --------------------------------------------------- |
| `role`                | MULTIROLE、STREETなど                               |
| `mount`               | Nikon Zなど。レンズの対応マウントと同じ名前を使用   |
| `sensor`              | FULL FRAME CMOSなど                                        |
| `effective_pixels`    | 24.5 MP                                             |
| `burst_rate`          | 14frames /s（14 fps、単位なしの数値、既存の「コマ/秒」も使用可） |
| `image_stabilization` | 手ぶれ補正の説明                                    |
| `weight`              | 710 g                                               |
| `storage_media`       | SD + microSDなど                                    |
| `af_system`           | AFシステムの説明                                    |
| `release_year`        | 4桁の発売年（1800〜2199）                           |
| `rating_*`            | 0〜10の数値。小数可。空欄は0                        |

### レンズ

追加の必須列：`compatible_mounts`, `focal_length`, `max_aperture`, `weight`。

```csv
id,name,maker,category,summary,compatible_mounts,focal_length,max_aperture,weight,usage_tags,rating_resolution,rating_bokeh,rating_low_light,rating_reach,rating_close_focus,rating_mobility,rating_versatility
```

| 列                  | 入力例・意味                                              |
| ------------------- | --------------------------------------------------------- |
| `compatible_mounts` | Nikon Zなど。複数は半角パイプ区切り |
| `focal_length`      | 50 mm または 24–70 mm                                     |
| `max_aperture`      | f/1.8 または f/3.5–4.5                                    |
| `weight`            | 250 g                                                     |
| `usage_tags` | street、portraitなど。複数は半角パイプ区切り |
| `rating_*`          | 0〜10の数値。小数可。空欄は0                              |

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

カメラ・レンズとも、評価は次の7項目・順序で表示します。

| 表示 | CSV列 | 内容 |
| --- | --- | --- |
| RESOLUTION | `rating_resolution` | 解像性能 |
| BOKEH | `rating_bokeh` | 背景のボケ |
| LOW LIGHT | `rating_low_light` | 低照度での性能 |
| REACH | `rating_reach` | 遠距離の被写体への対応 |
| CLOSE FOCUS | `rating_close_focus` | 近接撮影 |
| MOBILITY | `rating_mobility` | 携行性 |
| VERSATILITY | `rating_versatility` | 汎用性 |

旧CSVの`rating_high_iso`（カメラ）、`rating_sharpness`（レンズ）、`rating_portability`、`rating_close_up`（レンズ）も読み込めます。それぞれLOW LIGHT、RESOLUTION、MOBILITY、CLOSE FOCUSへ引き継ぎます。旧名と対応する新名を同じCSVに含めると重複列エラーになります。

旧カメラのAF・ダイナミックレンジ・操作性・色の評価は、意味の異なる新評価へ転用しません。保存済みデータには保持し、CSV出力時も該当する`rating_autofocus`、`rating_dynamic_range`、`rating_handling`、`rating_color`列を追加します。これらの旧列を省略したCSVで更新しても、登録済みの旧評価は保持します。

保存済みの旧評価は読み込み時に移行し、新しく追加した項目は0になります。元のlocalStorageは、ユーザーが保存操作をするまでは変更しません。評価項目が欠けた現在の形式や不正な旧評価は、通常の読み込みエラーとして扱います。

カメラ詳細と比較画面・PNGの表示はSENSOR、PIXELS、MOUNT、BURST、MEDIA、WEIGHT、RELEASEの7項目です。CSVのスペック列名は従来の形式を維持しています。手ぶれ補正・AFシステムは表示対象から外しますが、既存値とCSV列は保持します。
