import { v4 as uuidv4 } from "uuid";
const BALANCE = "balance";
const BUCKET = "buckets";
const CATEGORIES = "categories";

const getItemFromLocalStorageFactory =
  ({ itemType }) =>
  async () => {
    const storedData = localStorage.getItem(itemType) || "";
    /** YOU NEED TO FIND A BETTER WAY TO INITIALIZE THIS VARIABLE. IT CANNOT RETURN AN EMPTY ARRAY FOR BUCKETS. ALSO, VERIFY IF THIS IS APPROPIATE FOR BALANCE
     * CHECK LINE 77 TO SEE THE ISSUE TO VERIFY IF THIS RETURNED NO RESULT. IT DOES NOT EXPRESS THE REALITY
     */
    return storedData ? JSON.parse(storedData) : [];
  };

const getBalanceFromLocalStorage = getItemFromLocalStorageFactory({
  itemType: BALANCE,
});
const getBucketsFromLocalStorage = getItemFromLocalStorageFactory({
  itemType: BUCKET,
});
const getCategoriesFromLocalStorage = getItemFromLocalStorageFactory({
  itemType: CATEGORIES,
});

const storeInLocalStorageFactory =
  ({ itemType }) =>
  async ({ data }) =>
    localStorage.setItem(itemType, JSON.stringify(data));

const storeBalanceInLocalStorage = storeInLocalStorageFactory({
  itemType: BALANCE,
});
const storeBucketsInLocalStorage = storeInLocalStorageFactory({
  itemType: BUCKET,
});
const storeCategoriesInLocalStorage = storeInLocalStorageFactory({
  itemType: CATEGORIES,
});

// Converts an old-format number value to the new per-month history array so
// that legacy data in localStorage remains readable after the migration.
const normalizeBucketValue = (value) => {
  if (Array.isArray(value)) return value;
  return [{ from: "0000-00", limit: Number(value) || 0 }];
};

// Used by the CSV restore path: overwrites all bucket limits wholesale. Each
// incoming value is stored as a new history array rooted at "0000-00" so the
// restored data is immediately in the current format.
const mergeBucketsData = async ({ bucketData }) => {
  if (!bucketData) throw new Error("No bucket data was set");
  const storedBuckets = await getBucketsFromLocalStorage();
  const normalizedIncoming = Object.fromEntries(
    Object.entries(bucketData).map(([name, value]) => [
      name,
      normalizeBucketValue(value),
    ])
  );
  const newBuckets = { ...storedBuckets, ...normalizedIncoming };
  await storeBucketsInLocalStorage({ data: newBuckets });
  return newBuckets;
};

// Writes a new limit entry for `bucketName` starting from `fromYearMonth`
// ("YYYY-MM", 1-indexed). If an entry for that exact month already exists it
// is replaced; otherwise a new entry is appended and the history is kept
// sorted chronologically. Old-format number values are transparently migrated
// to the array form on the first edit.
const editBucketForMonth = async ({ bucketName, limit, fromYearMonth }) => {
  if (!bucketName) throw new Error("No bucket name was set");
  const storedBuckets = (await getBucketsFromLocalStorage()) || {};
  const history = normalizeBucketValue(storedBuckets[bucketName] ?? 0);

  const existingIndex = history.findIndex((e) => e.from === fromYearMonth);
  const updatedHistory =
    existingIndex >= 0
      ? history.map((e, i) =>
          i === existingIndex ? { from: fromYearMonth, limit } : e
        )
      : [...history, { from: fromYearMonth, limit }];

  updatedHistory.sort((a, b) => (a.from <= b.from ? -1 : 1));

  const newBuckets = { ...storedBuckets, [bucketName]: updatedHistory };
  await storeBucketsInLocalStorage({ data: newBuckets });
  return newBuckets;
};

// Creates a brand new expense category, independent of any bucket (issue #100).
// The category becomes selectable when adding a bucket or an expense entry,
// without requiring a spending limit to be set right away.
const addCategoryData = async ({ category }) => {
  const trimmedName = (category || "").trim();
  if (!trimmedName) throw new Error("Category name cannot be empty");

  const storedCategories = (await getCategoriesFromLocalStorage()) || [];
  const storedBuckets = (await getBucketsFromLocalStorage()) || {};
  const alreadyExists = [
    ...storedCategories,
    ...Object.keys(storedBuckets),
  ].some((existingName) => existingName.toLowerCase() === trimmedName.toLowerCase());
  if (alreadyExists) {
    throw new Error(`A category for "${trimmedName}" already exists`);
  }

  const newCategories = [...storedCategories, trimmedName];
  await storeCategoriesInLocalStorage({ data: newCategories });
  return newCategories;
};

// Adds a bucket (a spending limit) for an existing category (issue #100). The
// category name must be non-empty and unique among buckets (case-insensitive)
// so we never create orphan or duplicated buckets. Existing buckets are edited
// via editBucket. Once a category gets a bucket, it is removed from the
// standalone categories list so it does not show up twice.
const addBucketData = async ({ bucket }) => {
  if (!bucket) throw new Error("No bucket data was set");

  const [name, value] = Object.entries(bucket)[0] || [];
  const trimmedName = (name || "").trim();
  if (!trimmedName) throw new Error("Category name cannot be empty");

  const storedBuckets = (await getBucketsFromLocalStorage()) || {};
  const alreadyExists = Object.keys(storedBuckets).some(
    (bucketName) => bucketName.toLowerCase() === trimmedName.toLowerCase()
  );
  if (alreadyExists) {
    throw new Error(`A bucket for "${trimmedName}" already exists`);
  }

  const newBuckets = {
    ...storedBuckets,
    [trimmedName]: [{ from: "0000-00", limit: Number(value) || 0 }],
  };
  await storeBucketsInLocalStorage({ data: newBuckets });

  const storedCategories = (await getCategoriesFromLocalStorage()) || [];
  const remainingCategories = storedCategories.filter(
    (categoryName) => categoryName.toLowerCase() !== trimmedName.toLowerCase()
  );
  if (remainingCategories.length !== storedCategories.length) {
    await storeCategoriesInLocalStorage({ data: remainingCategories });
  }

  return newBuckets;
};

const LocalStorage = () => ({
  getBalance: () => getBalanceFromLocalStorage(),
  setBalance: ({ balance }) => storeBalanceInLocalStorage({ data: balance }),
  clearAllData: async () => localStorage.clear(),
  setNewRecord: async (entry) => {
    if (!entry) throw new Error("No entry was added");
    const balance = await getBalanceFromLocalStorage();
    const newEntry = { ...entry, id: uuidv4() };
    const newBalance = [...balance, newEntry];
    storeBalanceInLocalStorage({ data: newBalance });
    return newEntry;
  },
  getEntryById: async (entryId) => {
    const balance = await getBalanceFromLocalStorage();
    const entry = balance.find(
      (entryFromBalance) => entryFromBalance.id === entryId
    );
    if (!entry) return null;
    return entry;
  },
  editEntry: async ({ entry }) => {
    const balance = await getBalanceFromLocalStorage();
    const newBalance = balance.map((originalEntry) => {
      if (originalEntry.id === entry.id) {
        return entry;
      }
      return originalEntry;
    });
    storeBalanceInLocalStorage(newBalance);
    return newBalance;
  },
  removeEntry: async ({ entryId }) => {
    const balance = await getBalanceFromLocalStorage();
    const newBalance = balance.filter(
      (originalEntry) => originalEntry.id !== entryId
    );
    storeBalanceInLocalStorage(newBalance);
    return newBalance;
  },
  getBuckets: async ({ buckets } = {}) => {
    const bucketsFromLocalStorage = await getBucketsFromLocalStorage();
    const isBucketsFromLocalStorageEmpty =
      bucketsFromLocalStorage === null ||
      (bucketsFromLocalStorage.constructor === Object &&
        Object.keys(bucketsFromLocalStorage).length === 0);
    if (!buckets && isBucketsFromLocalStorageEmpty)
      throw new Error("No buckets were set");
    /** YOU NEED TO FIND A BETTER WAY TO INITIALIZE THIS VARIABLE */
    if (bucketsFromLocalStorage?.length !== 0) return bucketsFromLocalStorage;
    await storeBucketsInLocalStorage({ data: buckets });
    return getBucketsFromLocalStorage();
  },
  editBucket: async ({ bucketName, limit, fromYearMonth }) => {
    return editBucketForMonth({ bucketName, limit, fromYearMonth });
  },
  addBucket: async ({ bucket }) => {
    return addBucketData({ bucket });
  },
  getCategories: async () => getCategoriesFromLocalStorage(),
  addCategory: async ({ category }) => {
    return addCategoryData({ category });
  },
  editBuckets: async ({ buckets }) => {
    return mergeBucketsData({ bucketData: buckets });
  },
  getBucket: async ({ bucketName }) => {
    const buckets = await getBucketsFromLocalStorage();
    const selectedBucketKey = Object.keys(buckets).find((bucketKey) => {
      /**
       * TODO: Use bucketId instead, not bucket name
       *
       * This `bucketName` is just a conversion from
       * a string like `Eating out` to kebab case
       * eating-out. That is why the toLowerCase and
       * replace functions are necessary
       */
      return bucketKey.toLowerCase().replace(/\s/g, "-") === bucketName;
    });
    const bucket = { [selectedBucketKey]: buckets[selectedBucketKey] };
    return bucket;
  },
});

export default LocalStorage;
