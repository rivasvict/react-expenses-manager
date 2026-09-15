import {
  applyItems,
  canonicalStringify,
  contentHash,
  diffSnapshots,
  extractItems,
  snapshotsContentEqual,
} from "./syncMergeHelper";
import { BackupData } from "../../services/syncApi/contract";

/**
 * Unit tests for the pure merge & idempotency engine (RFC §4.1–4.2):
 * identity, hashing, diff, apply — including fixed-entry tombstones,
 * case-insensitive bucket keys, the rejection memory and the
 * additive-only rule.
 */

const emptyData = (): BackupData => ({
  balance: [],
  buckets: {},
  categories: [],
  fixedEntries: [],
});

const entry = (id: string, overrides: any = {}) => ({
  id,
  amount: "10",
  description: "Lunch",
  type: "expense",
  date: 1770000000000,
  categories_path: ",eating out,",
  ...overrides,
});

describe("canonicalStringify + contentHash", () => {
  it("serializes logically equal objects identically regardless of key order", () => {
    expect(canonicalStringify({ b: 1, a: { d: 2, c: 3 } })).toEqual(
      canonicalStringify({ a: { c: 3, d: 2 }, b: 1 })
    );
  });

  it("hashes equal payloads equally and different payloads differently", () => {
    expect(contentHash({ amount: "10", description: "x" })).toEqual(
      contentHash({ description: "x", amount: "10" })
    );
    expect(contentHash({ amount: "10" })).not.toEqual(
      contentHash({ amount: "11" })
    );
  });
});

describe("extractItems (RFC §4.1 identity)", () => {
  it("keys entries by id, fixed states by id+from, bucket states by lowercased name+from", () => {
    const data: BackupData = {
      balance: [entry("e1")],
      buckets: { Groceries: [{ from: "0000-00", limit: 200 }] },
      categories: ["gym"],
      fixedEntries: [
        {
          id: "f1",
          type: "expense",
          history: [
            { from: "2026-01", amount: "9", description: "Netflix", categories_path: ",fun," },
            { from: "2026-03", removed: true },
          ],
        },
      ],
    };

    const keys = extractItems(data).map((item) => item.key);
    expect(keys).toEqual([
      "entry:e1",
      "fixed:f1:2026-01",
      "fixed:f1:2026-03",
      "bucket:groceries:0000-00",
    ]);
  });

  it("hashes the payload without its identity field (id / from)", () => {
    const [a] = extractItems({ ...emptyData(), balance: [entry("e1")] });
    const [b] = extractItems({ ...emptyData(), balance: [entry("e2")] });
    expect(a.hash).toEqual(b.hash); // same content, different id
  });
});

describe("diffSnapshots (RFC §4.2)", () => {
  it("skips items already present with equal content", () => {
    const local = { ...emptyData(), balance: [entry("e1")] };
    const remote = { ...emptyData(), balance: [entry("e1")] };
    expect(diffSnapshots({ localData: local, remoteData: remote })).toEqual([]);
  });

  it("reports a remote-only item as incoming, and an edit as a change", () => {
    const local = { ...emptyData(), balance: [entry("e1")] };
    const remote = {
      ...emptyData(),
      balance: [entry("e1", { amount: "99" }), entry("e2")],
    };
    const incoming = diffSnapshots({ localData: local, remoteData: remote });
    expect(incoming.map((item) => [item.key, item.isChange])).toEqual([
      ["entry:e1", true],
      ["entry:e2", false],
    ]);
  });

  it("honors the rejection memory per (itemKey, contentHash) — EC-4, AC-3.9", () => {
    const local = emptyData();
    const remote = { ...emptyData(), balance: [entry("e1")] };
    const [item] = diffSnapshots({ localData: local, remoteData: remote });

    // Rejected hash → suppressed…
    expect(
      diffSnapshots({
        localData: local,
        remoteData: remote,
        rejections: { [item.key]: [item.hash] },
      })
    ).toEqual([]);

    // …but a later, different edit of the same item is seen again.
    const edited = { ...emptyData(), balance: [entry("e1", { amount: "42" })] };
    expect(
      diffSnapshots({
        localData: local,
        remoteData: edited,
        rejections: { [item.key]: [item.hash] },
      })
    ).toHaveLength(1);
  });

  it("is additive-only: a remote backup lacking a local item deletes nothing", () => {
    const local = { ...emptyData(), balance: [entry("e1"), entry("e2")] };
    const remote = emptyData();
    expect(diffSnapshots({ localData: local, remoteData: remote })).toEqual([]);
  });
});

describe("snapshotsContentEqual", () => {
  it("is order-insensitive for entries and categories", () => {
    const a = {
      ...emptyData(),
      balance: [entry("e1"), entry("e2", { amount: "5" })],
      categories: ["gym", "pets"],
    };
    const b = {
      ...emptyData(),
      balance: [entry("e2", { amount: "5" }), entry("e1")],
      categories: ["pets", "gym"],
    };
    expect(snapshotsContentEqual(a, b)).toBe(true);
  });

  it("detects local-only additions", () => {
    const a = { ...emptyData(), balance: [entry("e1")] };
    expect(snapshotsContentEqual(a, emptyData())).toBe(false);
  });
});

describe("applyItems (RFC §4.3 step 5)", () => {
  it("appends new entries and replaces edited ones by id, without mutating input", () => {
    const local = { ...emptyData(), balance: [entry("e1")] };
    const incoming = diffSnapshots({
      localData: local,
      remoteData: {
        ...emptyData(),
        balance: [entry("e1", { amount: "99" }), entry("e2")],
      },
    });

    const merged = applyItems(local, incoming);
    expect(merged.balance).toEqual([
      entry("e1", { amount: "99" }),
      entry("e2"),
    ]);
    expect(local.balance).toEqual([entry("e1")]); // untouched
  });

  it("upserts fixed-entry history states by from — including removal tombstones — and keeps histories sorted", () => {
    const local: BackupData = {
      ...emptyData(),
      fixedEntries: [
        {
          id: "f1",
          type: "expense",
          history: [{ from: "2026-01", amount: "9", description: "Netflix" }],
        },
      ],
    };
    const remote: BackupData = {
      ...emptyData(),
      fixedEntries: [
        {
          id: "f1",
          type: "expense",
          history: [
            { from: "2026-01", amount: "9", description: "Netflix" },
            { from: "2026-03", removed: true }, // Tom removed it from March
          ],
        },
        {
          id: "f2",
          type: "income",
          history: [{ from: "2026-02", amount: "100", description: "Rent" }],
        },
      ],
    };

    const merged = applyItems(
      local,
      diffSnapshots({ localData: local, remoteData: remote })
    );
    const f1 = merged.fixedEntries.find((d: any) => d.id === "f1");
    expect(f1.history).toEqual([
      { from: "2026-01", amount: "9", description: "Netflix" },
      { from: "2026-03", removed: true },
    ]);
    // A brand-new fixed entry arrives with its type and full state set.
    const f2 = merged.fixedEntries.find((d: any) => d.id === "f2");
    expect(f2).toEqual({
      id: "f2",
      type: "income",
      history: [{ from: "2026-02", amount: "100", description: "Rent" }],
    });
  });

  it("matches bucket names case-insensitively, keeping the local casing", () => {
    const local: BackupData = {
      ...emptyData(),
      buckets: { Groceries: [{ from: "0000-00", limit: 200 }] },
    };
    const remote: BackupData = {
      ...emptyData(),
      buckets: {
        groceries: [
          { from: "0000-00", limit: 200 },
          { from: "2026-08", limit: 250 }, // Tom raised it for August
        ],
      },
    };

    const incoming = diffSnapshots({ localData: local, remoteData: remote });
    expect(incoming).toHaveLength(1); // only the August state is new

    const merged = applyItems(local, incoming);
    expect(Object.keys(merged.buckets)).toEqual(["Groceries"]);
    expect(merged.buckets.Groceries).toEqual([
      { from: "0000-00", limit: 200 },
      { from: "2026-08", limit: 250 },
    ]);
  });

  it("creates a new bucket when nothing matches", () => {
    const merged = applyItems(
      emptyData(),
      diffSnapshots({
        localData: emptyData(),
        remoteData: {
          ...emptyData(),
          buckets: { Pets: [{ from: "0000-00", limit: 50 }] },
        },
      })
    );
    expect(merged.buckets).toEqual({ Pets: [{ from: "0000-00", limit: 50 }] });
  });
});
