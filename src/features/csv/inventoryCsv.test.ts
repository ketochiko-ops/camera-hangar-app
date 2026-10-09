import { describe, expect, it } from "vitest";
import { sampleInventory } from "../../data/sample";
import { isCamera } from "../../types";
import {
  CSV_MAX_BYTES,
  csvColumns,
  exportEquipmentCsv,
  mergeCsvImport,
  parseEquipmentCsv,
} from "./inventoryCsv";

describe("equipment CSV", () => {
  it("imports and exports processors while old CSV updates preserve existing values and explicit blanks clear them", () => {
    const data = structuredClone(sampleInventory);
    data.cameras[0].specs.imageProcessor = "Custom processor";
    const legacy = parseEquipmentCsv(
      "id,name,maker,category,summary,role,mount\nnikon-zf,Nikon Z f,Nikon,Mirrorless,Notes,Expert,Nikon Z",
      "camera",
    );
    expect(legacy.issues).toEqual([]);
    expect(legacy.includesImageProcessor).toBe(false);
    expect(mergeCsvImport(data, legacy).cameras[0].specs.imageProcessor).toBe(
      "Custom processor",
    );
    const roundTrip = parseEquipmentCsv(
      exportEquipmentCsv("camera", data.cameras),
      "camera",
    );
    expect(roundTrip.issues).toEqual([]);
    expect(roundTrip.includesImageProcessor).toBe(true);
    expect(roundTrip.items).toEqual(data.cameras);
    const blank = parseEquipmentCsv(
      "id,name,maker,category,summary,role,mount,image_processor\nnikon-zf,Nikon Z f,Nikon,Mirrorless,Notes,Expert,Nikon Z,",
      "camera",
    );
    expect(blank.issues).toEqual([]);
    expect(mergeCsvImport(data, blank).cameras[0].specs.imageProcessor).toBe(
      "",
    );
  });
  it("backs up eight long part names and all seven effects without exceeding the CSV cell limit", () => {
    const camera = structuredClone(sampleInventory.cameras[0]);
    camera.additionalParts = Array.from({ length: 8 }, () => ({
      kind: "other",
      name: "x".repeat(64),
      weightGrams: 10000,
      features: ["wirelessFlash", "hss", "ttl", "flash"],
      effects: {
        detail: 10,
        night: -10,
        latitude: 10,
        response: -10,
        stability: 10,
        endurance: -10,
        mobility: 10,
      },
    }));
    const parsed = parseEquipmentCsv(
      exportEquipmentCsv("camera", [camera]),
      "camera",
    );
    expect(parsed.issues).toEqual([]);
    expect(parsed.items).toEqual([camera]);
  });
  it("round trips multiple parts with quotes, commas, pipes and Japanese names", () => {
    const camera = structuredClone(sampleInventory.cameras[0]);
    camera.additionalParts = [
      {
        kind: "grip",
        name: 'SmallRig, "custom"',
        effects: { stability: 0.5, mobility: -1 },
      },
      { kind: "adapter", name: "Adapter | F → Z" },
      { kind: "adapter", name: "別のアダプター" },
      {
        kind: "lighting",
        name: "Godox TT600",
        weightGrams: 500,
        features: ["flash"],
        effects: { mobility: -2 },
      },
    ];
    const parsed = parseEquipmentCsv(
      exportEquipmentCsv("camera", [camera]),
      "camera",
    );
    expect(parsed.issues).toEqual([]);
    expect(parsed.items).toEqual([camera]);
  });
  it("keeps existing parts for old CSVs and clears them when a parts column is explicitly blank", () => {
    const old =
      "id,name,maker,category,summary,role,mount\nnikon-zf,Nikon Z f,Nikon,Mirrorless,Updated,MULTIROLE,Nikon Z";
    const before = structuredClone(sampleInventory);
    const batch = parseEquipmentCsv(old, "camera");
    expect(batch.issues).toEqual([]);
    expect(mergeCsvImport(before, batch).cameras[0].additionalParts).toEqual(
      before.cameras[0].additionalParts,
    );
    const clear = parseEquipmentCsv(
      old.replace("role,mount\n", "role,mount,additional_parts\n") + ",",
      "camera",
    );
    expect(clear.issues).toEqual([]);
    expect(mergeCsvImport(before, clear).cameras[0].additionalParts).toEqual(
      [],
    );
    expect(before).toEqual(sampleInventory);
  });
  it.each([
    '{"kind":"grip","name":"Not an array"}',
    '[{"kind":"unknown","name":"Unsupported"}]',
    JSON.stringify([{ kind: "grip", name: "x".repeat(65) }]),
    JSON.stringify(
      Array.from({ length: 9 }, () => ({ kind: "adapter", name: "Adapter" })),
    ),
    JSON.stringify([{ kind: "grip", name: "two\nlines" }]),
    "[broken JSON",
    '[{"kind":"grip","name":"Bad","effects":null}]',
    '[{"kind":"grip","name":"Bad","effects":[]}]',
    '[{"kind":"grip","name":"Bad","effects":{"response":-11}}]',
    '[{"kind":"grip","name":"Bad","effects":{"detail":11}}]',
    '[{"kind":"grip","name":"Bad","effects":{"mobility":"-1"}}]',
    '[{"kind":"grip","name":"Bad","effects":{"autofocus":1}}]',
    '[{"kind":"grip","name":"Bad","effects":{"__proto__":1}}]',
    '[{"kind":"lighting","name":"Bad","weightGrams":-1}]',
    '[{"kind":"lighting","name":"Bad","weightGrams":10001}]',
    '[{"kind":"lighting","name":"Bad","weightGrams":null}]',
    '[{"kind":"lighting","name":"Bad","weightGrams":"90"}]',
    '[{"kind":"lighting","name":"Bad","features":null}]',
    '[{"kind":"lighting","name":"Bad","features":["unknown"]}]',
    '[{"kind":"lighting","name":"Bad","features":["flash","flash"]}]',
  ])(
    "rejects invalid parts without partially importing the batch: %s",
    (parts) => {
      const camera = sampleInventory.cameras[0];
      const source = exportEquipmentCsv("camera", [camera]);
      // Replace the serialized cell through the public CSV encoder's output.
      const invalid = source.replace(
        '"' +
          JSON.stringify(camera.additionalParts).replaceAll('"', '""') +
          '"',
        '"' + parts.replaceAll('"', '""') + '"',
      );
      const batch = parseEquipmentCsv(invalid, "camera");
      expect(batch.items).toEqual([]);
      expect(
        batch.issues.some((issue) => issue.column === "additional_parts"),
      ).toBe(true);
    },
  );
  it("imports former camera ratings, preserves retired scores in exports and updates", () => {
    const batch = parseEquipmentCsv(
      "id,name,maker,category,summary,role,mount,burst_rate,rating_resolution,rating_high_iso,rating_portability,rating_autofocus,rating_dynamic_range,rating_handling,rating_color\nnikon-zf,Camera,Nikon,Mirrorless,Notes,MULTIROLE,Nikon Z,14frames /s,7,8,9,6,5,4,3",
      "camera",
    );
    expect(batch.issues).toEqual([]);
    expect(batch.items[0].ratings).toEqual({
      detail: 7,
      night: 8,
      latitude: 5,
      response: 6,
      stability: 0,
      endurance: 0,
      resolution: 7,
      lowLight: 8,
      mobility: 9,
      autofocus: 6,
      dynamicRange: 5,
      handling: 4,
      colorRendering: 3,
    });
    const csv = exportEquipmentCsv("camera", batch.items);
    expect(csv).toContain("rating_autofocus");
    expect(parseEquipmentCsv(csv, "camera").items).toEqual(batch.items);
    const stored = mergeCsvImport(sampleInventory, batch);
    const update = parseEquipmentCsv(
      exportEquipmentCsv("camera", [
        { ...sampleInventory.cameras[0], name: "Updated" },
      ]),
      "camera",
    );
    expect(mergeCsvImport(stored, update).cameras[0].ratings).toMatchObject({
      autofocus: 6,
      dynamicRange: 5,
      handling: 4,
      colorRendering: 3,
    });
  });
  it("imports the previous shared camera profile without repurposing lens scores", () => {
    const parsed = parseEquipmentCsv(
      "id,name,maker,category,summary,role,mount,rating_resolution,rating_bokeh,rating_low_light,rating_reach,rating_close_focus,rating_mobility,rating_versatility\nnikon-zf,Camera,Nikon,Mirrorless,Notes,MULTIROLE,Nikon Z,7,4,8,6,5,9,3",
      "camera",
    );
    expect(parsed.issues).toEqual([]);
    expect(parsed.items[0].ratings).toMatchObject({
      detail: 7,
      night: 8,
      latitude: 0,
      response: 0,
      stability: 0,
      endurance: 0,
      mobility: 9,
      bokeh: 4,
      reach: 6,
      closeFocus: 5,
      versatility: 3,
    });
    expect(
      parseEquipmentCsv(exportEquipmentCsv("camera", parsed.items), "camera")
        .items,
    ).toEqual(parsed.items);
    const update = parseEquipmentCsv(
      exportEquipmentCsv("camera", [sampleInventory.cameras[0]]),
      "camera",
    );
    expect(
      mergeCsvImport(mergeCsvImport(sampleInventory, parsed), update).cameras[0]
        .ratings,
    ).toMatchObject({ bokeh: 4, reach: 6, closeFocus: 5, versatility: 3 });
  });
  it("prefers new camera columns including blank zero values while retaining old scores", () => {
    const parsed = parseEquipmentCsv(
      "name,maker,category,summary,role,mount,rating_detail,rating_resolution,rating_night,rating_low_light,rating_latitude,rating_dynamic_range,rating_response,rating_autofocus,rating_stability,rating_endurance\nCamera,Nikon,Mirrorless,Notes,MULTIROLE,Nikon Z,9,7,,8,6,5,4,3,2,1",
      "camera",
    );
    expect(parsed.issues).toEqual([]);
    expect(parsed.items[0].ratings).toMatchObject({
      detail: 9,
      resolution: 7,
      night: 0,
      lowLight: 8,
      latitude: 6,
      dynamicRange: 5,
      response: 4,
      autofocus: 3,
      stability: 2,
      endurance: 1,
    });
  });
  it("imports former lens rating columns into the corresponding new scores", () => {
    const parsed = parseEquipmentCsv(
      "name,maker,category,summary,compatible_mounts,focal_length,max_aperture,weight,rating_sharpness,rating_portability,rating_versatility,rating_low_light,rating_close_up,rating_bokeh\nLens,Nikon,Prime,Notes,Nikon Z,40 mm,f/2,170 g,8,9,7,6,5,4",
      "lens",
    );
    expect(parsed.issues).toEqual([]);
    expect(parsed.items[0].ratings).toEqual({
      resolution: 8,
      bokeh: 4,
      lowLight: 6,
      reach: 0,
      closeFocus: 5,
      mobility: 9,
      versatility: 7,
    });
  });
  it("rejects duplicate old and new rating names and invalid retired scores", () => {
    expect(
      parseEquipmentCsv(
        "name,maker,category,summary,role,mount,rating_high_iso,rating_low_light\nCamera,Nikon,Mirrorless,Notes,MULTIROLE,Nikon Z,5,6",
        "camera",
      ).issues[0].message,
    ).toMatch(/重複/);
    const parsed = parseEquipmentCsv(
      "name,maker,category,summary,role,mount,rating_autofocus\nCamera,Nikon,Mirrorless,Notes,MULTIROLE,Nikon Z,11",
      "camera",
    );
    expect(parsed.items).toEqual([]);
    expect(parsed.issues[0].column).toBe("rating_autofocus");
  });
  for (const kind of ["camera", "lens"] as const) {
    it(`round trips every ${kind} field with UTF-8 BOM and CRLF`, () => {
      const items =
        kind === "camera" ? sampleInventory.cameras : sampleInventory.lenses;
      const csv = exportEquipmentCsv(kind, items);
      expect(csv.startsWith("\uFEFF")).toBe(true);
      const parsed = parseEquipmentCsv(csv, kind);
      expect(parsed.issues).toEqual([]);
      expect(parsed.items).toEqual(items);
    });
  }
  it("preserves commas, escaped quotes, Japanese and multiline notes", () => {
    const camera = structuredClone(sampleInventory.cameras[0]);
    camera.name = 'Camera, "special edition"';
    camera.summary = '撮影メモ, "風景"\r\n次の行\n最終行';
    expect(
      parseEquipmentCsv(exportEquipmentCsv("camera", [camera]), "camera").items,
    ).toEqual([camera]);
  });
  it("escapes spreadsheet formulas reversibly, including literal apostrophes", () => {
    const camera = structuredClone(sampleInventory.cameras[0]);
    camera.name = '=HYPERLINK("example")';
    camera.summary = "  +1+2";
    camera.maker = "'Original";
    const csv = exportEquipmentCsv("camera", [camera]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'  +1+2");
    expect(parseEquipmentCsv(csv, "camera").items).toEqual([camera]);
  });
  it("accepts reordered minimal headers, generates IDs and defaults optional ratings to zero", () => {
    const csv =
      "mount,role,summary,category,maker,name,burst_rate\nNikon Z,MULTIROLE,調査済み,Mirrorless,Nikon,Test,14 fps\n";
    const parsed = parseEquipmentCsv(csv, "camera");
    expect(parsed.issues).toEqual([]);
    const item = parsed.items[0];
    expect(item.id).toBeTruthy();
    expect(isCamera(item) && item.specs.continuousShooting).toBe("14 fps");
    expect(Object.values(item.ratings)).toEqual(Array(7).fill(0));
  });
  it("normalizes pipe-delimited mounts and tags", () => {
    const parsed = parseEquipmentCsv(
      "name,maker,category,summary,compatible_mounts,focal_length,max_aperture,weight,usage_tags\nLens,Maker,Prime,Notes,Nikon Z | Nikon F | Nikon Z,50 mm,f/1.8,250 g,street| portrait |street",
      "lens",
    );
    expect(parsed.issues).toEqual([]);
    const item = parsed.items[0];
    expect(!isCamera(item) && item.compatibleMounts).toEqual([
      "Nikon Z",
      "Nikon F",
    ]);
    expect(!isCamera(item) && item.usageTags).toEqual(["street", "portrait"]);
  });
  it("rejects a batch with invalid ratings without returning partial records", () => {
    const items = structuredClone(sampleInventory.cameras.slice(0, 2));
    items[1].ratings.detail = 11;
    const parsed = parseEquipmentCsv(
      exportEquipmentCsv("camera", items),
      "camera",
    );
    expect(parsed.items).toEqual([]);
    expect(parsed.issues).toContainEqual({
      line: 4,
      column: "rating_detail",
      message: "評価は0〜10の数値で入力してください。",
    });
  });
  it("reports the physical source line after a multiline CSV field", () => {
    const parsed = parseEquipmentCsv(
      'name,maker,category,summary,role,mount\r\nCamera,M,C,"Notes\r\nNext line",MULTIROLE,Nikon Z\r\nBad,M,C,Notes,MULTIROLE,\r\n',
      "camera",
    );
    expect(parsed.issues).toContainEqual({
      line: 4,
      column: "mount",
      message: "必須項目を入力してください。",
    });
  });
  it("rejects malformed quoting and inconsistent column counts", () => {
    expect(
      parseEquipmentCsv('name,"unfinished', "camera").issues[0].message,
    ).toMatch(/引用符/);
    const header = "name,maker,category,summary,role,mount\n";
    expect(
      parseEquipmentCsv(`${header}Bad"quote,M,C,N,MULTIROLE,Z`, "camera")
        .issues[0].message,
    ).toMatch(/引用符/);
    expect(
      parseEquipmentCsv(`${header}Name,M,C,Notes,MULTIROLE,Z,extra`, "camera")
        .issues[0].message,
    ).toMatch(/列数/);
  });
  it("rejects wrong-kind, duplicate and unknown headers", () => {
    expect(
      parseEquipmentCsv(
        exportEquipmentCsv("lens", sampleInventory.lenses),
        "camera",
      ).issues.length,
    ).toBeGreaterThan(0);
    expect(
      parseEquipmentCsv("name,name\nx,x", "camera").issues[0].message,
    ).toMatch(/重複/);
    expect(
      parseEquipmentCsv("__proto__\nx", "camera").issues[0].message,
    ).toMatch(/未対応/);
  });
  it("rejects repeated IDs and enforces field, file and row limits", () => {
    const item = sampleInventory.cameras[0];
    expect(
      parseEquipmentCsv(exportEquipmentCsv("camera", [item, item]), "camera")
        .issues[0].column,
    ).toBe("id");
    expect(
      parseEquipmentCsv(
        exportEquipmentCsv("camera", [{ ...item, name: "x".repeat(101) }]),
        "camera",
      ).issues[0].column,
    ).toBe("name");
    expect(
      parseEquipmentCsv("x".repeat(CSV_MAX_BYTES + 1), "camera").issues[0]
        .message,
    ).toMatch(/2 MiB/);
    expect(
      parseEquipmentCsv("name\n" + "x\n".repeat(1001), "camera").issues[0]
        .message,
    ).toMatch(/1000/);
  });
  it("rejects empty CSV and header-only templates", () => {
    expect(parseEquipmentCsv("", "camera").issues[0].message).toMatch(/空/);
    expect(
      parseEquipmentCsv(csvColumns("camera").join(","), "camera").issues[0]
        .message,
    ).toMatch(/機材の行/);
  });
  it("updates by ID, keeps photos and other equipment, and does not mutate the source", () => {
    const data = structuredClone(sampleInventory);
    data.cameras[0].image = "data:image/png;base64,cGhvdG8=";
    const before = structuredClone(data);
    const update = { ...data.cameras[0], name: "Updated Camera" };
    const addition = { ...data.cameras[1], id: "", name: "New Camera" };
    const batch = parseEquipmentCsv(
      exportEquipmentCsv("camera", [update, addition]),
      "camera",
    );
    const merged = mergeCsvImport(data, batch);
    expect(merged.cameras).toHaveLength(data.cameras.length + 1);
    expect(merged.cameras[0]).toMatchObject({
      name: "Updated Camera",
      image: data.cameras[0].image,
    });
    expect(merged.lenses).toEqual(data.lenses);
    expect(merged.cameras.at(-1)?.name).toBe("New Camera");
    expect(data).toEqual(before);
  });
  it("rejects cross-kind ID collisions and invalid batches", () => {
    const item = {
      ...sampleInventory.cameras[0],
      id: sampleInventory.lenses[0].id,
    };
    const batch = parseEquipmentCsv(
      exportEquipmentCsv("camera", [item]),
      "camera",
    );
    expect(() => mergeCsvImport(sampleInventory, batch)).toThrow(/ID/);
    expect(() =>
      mergeCsvImport(sampleInventory, {
        kind: "camera",
        items: [],
        issues: [],
      }),
    ).toThrow();
    expect(() =>
      mergeCsvImport(sampleInventory, {
        kind: "camera",
        items: [sampleInventory.lenses[0]],
        issues: [],
      }),
    ).toThrow();
  });
});
