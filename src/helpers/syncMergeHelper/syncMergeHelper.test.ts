import {
  applyItems,
  canonicalStringify,
  contentHash,
  diffSnapshots,
  extractItems,
  mergeCategories,
  mergeSnapshotForUpload,
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

describe("grouping brand-new definitions (RFC §4.1 — QA D2)", () => {
  const multiStateRemote = (): BackupData => ({
    ...({
      balance: [],
      buckets: {},
      categories: [],
      fixedEntries: [],
    } as BackupData),
    fixedEntries: [
      {
        id: "f-new",
        type: "expense",
        history: [
          { from: "2026-01", amount: "9", description: "Netflix" },
          { from: "2026-03", amount: "12", description: "Netflix 4K" },
        ],
      },
    ],
    buckets: {
      Pets: [
        { from: "0000-00", limit: 50 },
        { from: "2026-06", limit: 80 },
      ],
    },
  });

  it("presents a brand-new multi-state fixed entry and bucket as ONE item each, fronted by the resolved current state", () => {
    const incoming = diffSnapshots({
      localData: emptyData(),
      remoteData: multiStateRemote(),
    });

    expect(incoming).toHaveLength(2);
    const [fixedCard, bucketCard] = incoming;
    // Resolved current state = the latest by `from`.
    expect(fixedCard.fixed!.state).toEqual({
      from: "2026-03",
      amount: "12",
      description: "Netflix 4K",
    });
    expect(fixedCard.grouped).toHaveLength(2);
    expect(bucketCard.bucket!.state).toEqual({ from: "2026-06", limit: 80 });
    expect(bucketCard.grouped).toHaveLength(2);

    // Accepting the card applies ALL its pending states.
    const merged = applyItems(
      emptyData(),
      incoming.reduce<any[]>(
        (all, item) => all.concat(item.grouped || [item]),
        []
      )
    );
    expect(merged.fixedEntries[0].history).toHaveLength(2);
    expect(merged.buckets.Pets).toHaveLength(2);
  });

  it("keeps states of an already-known definition as individual items", () => {
    const local: BackupData = {
      ...emptyData(),
      buckets: { Pets: [{ from: "0000-00", limit: 50 }] },
    };
    const incoming = diffSnapshots({
      localData: local,
      remoteData: multiStateRemote(),
    });
    // The known bucket's new state is its own item; the new fixed entry
    // still groups.
    const bucketItems = incoming.filter((item) => item.kind === "bucket");
    expect(bucketItems).toHaveLength(1);
    expect(bucketItems[0].grouped).toBeUndefined();
    const fixedItems = incoming.filter((item) => item.kind === "fixed");
    expect(fixedItems).toHaveLength(1);
    expect(fixedItems[0].grouped).toHaveLength(2);
  });

  it("rejecting a group records one rejection per member state, suppressing every state on the next diff", () => {
    const remote = multiStateRemote();
    const incoming = diffSnapshots({
      localData: emptyData(),
      remoteData: remote,
    });
    // The wizard expands a rejected group into a (key, hash) per member —
    // reproduce that here, then re-diff the same backup.
    const rejections = incoming.reduce<{ [key: string]: string[] }>(
      (memory, item) => {
        (item.grouped || [item]).forEach(({ key, hash }) => {
          memory[key] = [...(memory[key] || []), hash];
        });
        return memory;
      },
      {}
    );

    expect(
      diffSnapshots({ localData: emptyData(), remoteData: remote, rejections })
    ).toEqual([]);
  });
});

describe("category merging (AC-3.10 — QA D1)", () => {
  it("unions additively, case-insensitively, local casing and order first", () => {
    expect(
      mergeCategories({
        localCategories: ["Pet Care", "gym"],
        remoteCategories: ["pet care", "Travel Fund"],
        buckets: {},
      })
    ).toEqual(["Pet Care", "gym", "Travel Fund"]);
  });

  it("excludes names promoted to buckets, matching bucket creation", () => {
    expect(
      mergeCategories({
        localCategories: ["gym"],
        remoteCategories: ["Pet Care"],
        buckets: { "pet care": [{ from: "0000-00", limit: 50 }] },
      })
    ).toEqual(["gym"]);
  });

  it("content equality treats category casing case-insensitively (no ping-pong)", () => {
    const a = { ...emptyData(), categories: ["Pet Care"] };
    const b = { ...emptyData(), categories: ["pet care"] };
    expect(snapshotsContentEqual(a, b)).toBe(true);
    expect(
      snapshotsContentEqual(a, { ...emptyData(), categories: [] })
    ).toBe(false);
  });
});

describe("mergeSnapshotForUpload (D5 — union preserves remote items)", () => {
  it("retains a remote-only item (rejected / rejected-in-a-prior-sync) at its remote value", () => {
    // `base` is the local snapshot with accepted items applied — it lacks
    // the remote item X (this member rejected it, so it never merged
    // locally). The upload must still carry X so the party backup keeps it.
    const base = { ...emptyData(), balance: [entry("local-only")] };
    const remoteData = {
      ...emptyData(),
      balance: [entry("local-only"), entry("X", { amount: "99" })],
    };
    const merged = mergeSnapshotForUpload({ base, remoteData });
    const ids = merged.balance.map((item: any) => item.id).sort();
    expect(ids).toEqual(["X", "local-only"]);
    // Remote value preserved verbatim.
    expect(merged.balance.find((item: any) => item.id === "X").amount).toEqual(
      "99"
    );
  });

  it("retains a local-only item (additive, remote lacks it)", () => {
    const base = {
      ...emptyData(),
      balance: [entry("shared"), entry("mine")],
    };
    const remoteData = { ...emptyData(), balance: [entry("shared")] };
    const merged = mergeSnapshotForUpload({ base, remoteData });
    expect(merged.balance.map((item: any) => item.id).sort()).toEqual([
      "mine",
      "shared",
    ]);
  });

  it("a modified-accepted item wins over the remote value (EC-5)", () => {
    // Same itemKey (entry:e1) in base and remote, different content: base
    // holds the member's MODIFIED value, which must win in the upload.
    const base = { ...emptyData(), balance: [entry("e1", { amount: "5" })] };
    const remoteData = {
      ...emptyData(),
      balance: [entry("e1", { amount: "99" })],
    };
    const merged = mergeSnapshotForUpload({ base, remoteData });
    expect(merged.balance).toHaveLength(1);
    expect(merged.balance[0].amount).toEqual("5");
  });

  it("unions remote-only fixed-entry states and bucket states by itemKey", () => {
    const base = {
      ...emptyData(),
      fixedEntries: [
        {
          id: "f1",
          type: "expense",
          history: [{ from: "2026-01", amount: "9", categories_path: ",fun," }],
        },
      ],
      buckets: { Groceries: [{ from: "2026-01", limit: 100 }] },
    };
    const remoteData = {
      ...emptyData(),
      fixedEntries: [
        {
          id: "f1",
          type: "expense",
          history: [
            { from: "2026-01", amount: "9", categories_path: ",fun," },
            { from: "2026-03", amount: "12", categories_path: ",fun," },
          ],
        },
      ],
      buckets: {
        Groceries: [
          { from: "2026-01", limit: 100 },
          { from: "2026-03", limit: 150 },
        ],
      },
    };
    const merged = mergeSnapshotForUpload({ base, remoteData });
    // The remote-only later states are retained; existing states unchanged.
    expect(merged.fixedEntries[0].history.map((s: any) => s.from)).toEqual([
      "2026-01",
      "2026-03",
    ]);
    expect(merged.buckets.Groceries.map((s: any) => s.from)).toEqual([
      "2026-01",
      "2026-03",
    ]);
  });

  it("does not mutate its inputs", () => {
    const base = { ...emptyData(), balance: [entry("a")] };
    const remoteData = { ...emptyData(), balance: [entry("a"), entry("b")] };
    mergeSnapshotForUpload({ base, remoteData });
    expect(base.balance).toHaveLength(1);
    expect(remoteData.balance).toHaveLength(2);
  });

  it("converges: after uploading the union, the backup content-equals the upload (no further upload)", () => {
    // Member A rejected X: local (base) lacks X, remote has X. The upload
    // union == remote content, so snapshotsContentEqual(upload, remote) is
    // true — the next sync makes NO upload, and A never re-prompts for X.
    const base = { ...emptyData(), balance: [entry("shared")] };
    const remoteData = {
      ...emptyData(),
      balance: [entry("shared"), entry("X")],
    };
    const uploadSnapshot = mergeSnapshotForUpload({ base, remoteData });
    expect(snapshotsContentEqual(uploadSnapshot, remoteData)).toBe(true);
  });
});
