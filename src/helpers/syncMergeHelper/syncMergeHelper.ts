// Merge & idempotency engine for multi-user sync (docs/multi-user-sync/RFC.md
// §4). All pure functions, no I/O — every EC combination
// (docs/multi-user-sync/PRD.md) is unit-testable here.
//
// Every syncable unit gets an itemKey and a contentHash (RFC §4.1):
//   Entry                    entry:{id}                    entry minus id
//   Fixed-entry history state fixed:{id}:{from}            state minus from
//   Bucket history state     bucket:{lowercased name}:{from} state minus from
//
// contentHash is FNV-1a over a canonical (recursively key-sorted) JSON
// serialization — change detection, not security, so it runs identically
// in jsdom.
import { BackupData } from "../../services/syncApi/contract";

export type SyncItemKind = "entry" | "fixed" | "bucket";

export interface SyncItem {
  key: string;
  hash: string;
  kind: SyncItemKind;
  // The concrete unit needed to apply the item locally:
  entry?: any; // kind "entry": the full entry (with id)
  fixed?: { id: string; type?: string; state: any }; // state includes `from`
  bucket?: { name: string; state: any }; // state includes `from`
}

export interface IncomingItem extends SyncItem {
  // True when the local snapshot has the same itemKey with different
  // content — an edit by another member, not a brand-new item.
  isChange: boolean;
  // True for a fixed entry / bucket this device has never seen at all —
  // not merely a new history state on a definition it already has. RFC
  // §4.1: such a definition "arrives as its full set of states but is
  // presented as one wizard card". Always false for entries.
  isNewDefinition?: boolean;
}

// One review card's worth of incoming items: a single item for entries and
// for edits to a definition this device already has, or every history state
// of a brand-new fixed entry / bucket (RFC §4.1).
export interface ReviewGroup {
  // Stable identity for staging a decision: the definition key for a
  // grouped brand-new definition, otherwise the item's own key.
  key: string;
  // The state shown on the card — the definition's resolved current state.
  item: IncomingItem;
  // Every state the card's decision applies to (always includes `item`).
  items: IncomingItem[];
}

// Rejection memory (AC-3.9/EC-4): content hashes rejected per itemKey.
export interface Rejections {
  [itemKey: string]: string[];
}

// JSON with recursively sorted object keys, so logically equal values
// always serialize identically.
export const canonicalStringify = (value: any): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(canonicalStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  const body = keys
    .filter((key) => value[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`)
    .join(",");
  return `{${body}}`;
};

// 32-bit FNV-1a, hex-encoded.
export const fnv1a = (text: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    // hash *= 16777619, in 32-bit space without BigInt.
    hash =
      (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>>
      0;
  }
  return hash.toString(16).padStart(8, "0");
};

export const contentHash = (payload: any): string =>
  fnv1a(canonicalStringify(payload));

const omit = (value: any, field: string) => {
  const { [field]: ignored, ...rest } = value || {};
  return rest;
};

// Flattens a snapshot's data into its syncable units (RFC §4.1).
export const extractItems = (data: BackupData): SyncItem[] => {
  const items: SyncItem[] = [];

  (data.balance || []).forEach((entry: any) => {
    items.push({
      kind: "entry",
      key: `entry:${entry.id}`,
      hash: contentHash(omit(entry, "id")),
      entry,
    });
  });

  (data.fixedEntries || []).forEach((definition: any) => {
    (definition.history || []).forEach((state: any) => {
      items.push({
        kind: "fixed",
        key: `fixed:${definition.id}:${state.from}`,
        hash: contentHash(omit(state, "from")),
        fixed: { id: definition.id, type: definition.type, state },
      });
    });
  });

  Object.keys(data.buckets || {}).forEach((name) => {
    const history = data.buckets[name];
    // Legacy plain-number buckets have no history states to sync.
    if (!Array.isArray(history)) return;
    history.forEach((state: any) => {
      items.push({
        kind: "bucket",
        key: `bucket:${name.toLowerCase()}:${state.from}`,
        hash: contentHash(omit(state, "from")),
        bucket: { name, state },
      });
    });
  });

  return items;
};

const itemHashByKey = (data: BackupData): Map<string, string> => {
  const map = new Map<string, string>();
  extractItems(data).forEach((item) => map.set(item.key, item.hash));
  return map;
};

// `fixed:{id}` / `bucket:{lowercased name}` — the definition a history
// state belongs to. Entries stand alone, so they have none.
export const definitionKeyOf = (item: SyncItem): string | null => {
  if (item.kind === "fixed" && item.fixed) return `fixed:${item.fixed.id}`;
  if (item.kind === "bucket" && item.bucket)
    return `bucket:${item.bucket.name.toLowerCase()}`;
  return null;
};

// The definitions a snapshot holds, read from the raw data rather than from
// extractItems, so a legacy plain-number bucket (no history to sync) still
// counts as a definition this device already has.
const definitionKeys = (data: BackupData): Set<string> => {
  const keys = new Set<string>();
  (data.fixedEntries || []).forEach((definition: any) =>
    keys.add(`fixed:${definition.id}`)
  );
  Object.keys(data.buckets || {}).forEach((name) =>
    keys.add(`bucket:${name.toLowerCase()}`)
  );
  return keys;
};

// The diff, on download (RFC §4.2). Additive-only: a remote backup lacking
// a local item never deletes anything locally.
export const diffSnapshots = ({
  localData,
  remoteData,
  rejections = {},
}: {
  localData: BackupData;
  remoteData: BackupData;
  rejections?: Rejections;
}): IncomingItem[] => {
  const local = itemHashByKey(localData);
  const localDefinitions = definitionKeys(localData);
  const incoming: IncomingItem[] = [];
  extractItems(remoteData).forEach((item) => {
    if (local.get(item.key) === item.hash) return; // already applied / own
    if ((rejections[item.key] || []).indexOf(item.hash) !== -1) return; // EC-4
    const definitionKey = definitionKeyOf(item);
    incoming.push({
      ...item,
      isChange: local.has(item.key),
      isNewDefinition:
        definitionKey !== null && !localDefinitions.has(definitionKey),
    });
  });
  return incoming;
};

// `from` orders a definition's history; "0000-00" (the beginning) sorts
// first, so the resolved current state is simply the largest one.
const isLaterState = (item: IncomingItem, other: IncomingItem): boolean => {
  const from = (candidate: IncomingItem) =>
    (candidate.fixed || candidate.bucket)?.state?.from || "";
  return from(item) > from(other);
};

/**
 * Turns the diffed items into the wizard's cards (RFC §4.1). Every state of
 * a BRAND-NEW fixed entry / bucket collapses into one group carrying its
 * resolved current state, so one accept/reject decision applies to the whole
 * definition and no member can end up with a history that never existed. An
 * edit to a definition this device already has stays its own card, as does
 * every entry. Input order is preserved (a group takes its first state's
 * position).
 */
export const groupIncomingItems = (items: IncomingItem[]): ReviewGroup[] => {
  const groups: ReviewGroup[] = [];
  const byDefinition = new Map<string, ReviewGroup>();

  items.forEach((incoming) => {
    const definitionKey = incoming.isNewDefinition
      ? definitionKeyOf(incoming)
      : null;
    if (definitionKey === null) {
      groups.push({ key: incoming.key, item: incoming, items: [incoming] });
      return;
    }
    const group = byDefinition.get(definitionKey);
    if (!group) {
      const created = { key: definitionKey, item: incoming, items: [incoming] };
      byDefinition.set(definitionKey, created);
      groups.push(created);
      return;
    }
    group.items.push(incoming);
    if (isLaterState(incoming, group.item)) group.item = incoming;
  });

  return groups;
};

// The items a decision on `group` applies to, with the card's own state
// replaced by `stagedItem` when the user modified it (EC-5).
export const groupItemsWith = (
  group: ReviewGroup,
  stagedItem?: IncomingItem
): IncomingItem[] =>
  stagedItem
    ? group.items.map((item) =>
        item.key === group.item.key ? stagedItem : item
      )
    : group.items;

// Two snapshots hold the same content when their syncable units match
// exactly (order-insensitive) and their category lists are equal as sets.
export const snapshotsContentEqual = (
  a: BackupData,
  b: BackupData
): boolean => {
  const mapA = itemHashByKey(a);
  const mapB = itemHashByKey(b);
  if (mapA.size !== mapB.size) return false;
  let equal = true;
  mapA.forEach((hash, key) => {
    if (mapB.get(key) !== hash) equal = false;
  });
  if (!equal) return false;
  const categoriesA = [...(a.categories || [])].sort();
  const categoriesB = [...(b.categories || [])].sort();
  return canonicalStringify(categoriesA) === canonicalStringify(categoriesB);
};

const byFromAscending = (first: any, second: any) =>
  first.from < second.from ? -1 : 1;

const upsertHistoryState = (history: any[], state: any): any[] =>
  [...history.filter((item) => item.from !== state.from), state].sort(
    byFromAscending
  );

// Applies accepted incoming items to a local snapshot, returning a new one
// (RFC §4.3 step 5): entries appended/replaced by id; fixed/bucket states
// upserted by `from` with histories kept sorted; bucket names matched
// case-insensitively (local casing wins). Removal tombstones are states
// like any other. Never mutates its input.
export const applyItems = (
  localData: BackupData,
  items: SyncItem[]
): BackupData => {
  const data: BackupData = {
    balance: [...(localData.balance || [])],
    buckets: { ...(localData.buckets || {}) },
    categories: [...(localData.categories || [])],
    fixedEntries: (localData.fixedEntries || []).map((definition: any) => ({
      ...definition,
      history: [...(definition.history || [])],
    })),
  };

  items.forEach((item) => {
    if (item.kind === "entry" && item.entry) {
      const index = data.balance.findIndex(
        (entry: any) => entry.id === item.entry.id
      );
      if (index >= 0) data.balance[index] = item.entry;
      else data.balance.push(item.entry);
    }

    if (item.kind === "fixed" && item.fixed) {
      const definition = data.fixedEntries.find(
        (candidate: any) => candidate.id === item.fixed!.id
      );
      if (definition) {
        definition.history = upsertHistoryState(
          definition.history,
          item.fixed.state
        );
      } else {
        data.fixedEntries.push({
          id: item.fixed.id,
          type: item.fixed.type,
          history: [item.fixed.state],
        });
      }
    }

    if (item.kind === "bucket" && item.bucket) {
      const existingName = Object.keys(data.buckets).find(
        (name) => name.toLowerCase() === item.bucket!.name.toLowerCase()
      );
      if (existingName && Array.isArray(data.buckets[existingName])) {
        data.buckets[existingName] = upsertHistoryState(
          data.buckets[existingName],
          item.bucket.state
        );
      } else {
        data.buckets[existingName || item.bucket.name] = [item.bucket.state];
      }
    }
  });

  return data;
};
