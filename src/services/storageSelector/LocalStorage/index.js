import { v4 as uuidv4 } from "uuid";
import {
  applyFixedEntry,
  getEmptyFixedEntries,
} from "../../../helpers/fixedEntriesHelper/fixedEntriesHelper";
const BALANCE = "balance";
const BUCKET = "buckets";
const CATEGORIES = "categories";
const FIXED_ENTRIES = "fixedEntries";

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

// Fixed (recurring) incomes/expenses are stored under their own key as the full
// time-aware config (issue #103). Unlike balance/buckets, the empty value is an
// object (not an array), so it has a dedicated getter.
const getFixedEntriesFromLocalStorage = async () => {
  const storedData = localStorage.getItem(FIXED_ENTRIES) || "";
  return storedData ? JSON.parse(storedData) : getEmptyFixedEntries();
};

const storeFixedEntriesInLocalStorage = storeInLocalStorageFactory({
  itemType: FIXED_ENTRIES,
});

// Applies a forward-only change (set, edit, or removal tombstone) to a single
// category history and persists the whole config. Returns the updated config.
const setFixedEntryData = async ({ type, category, amount, from }) => {
  const trimmedCategory = (category || "").trim();
  if (!trimmedCategory) throw new Error("Category name cannot be empty");
  if (!from) throw new Error("An effective-from month is required");

  const storedFixedEntries = await getFixedEntriesFromLocalStorage();
  const newFixedEntries = applyFixedEntry(storedFixedEntries, {
    type,
    category: trimmedCategory,
    amount,
    from,
  });
  await storeFixedEntriesInLocalStorage({ data: newFixedEntries });
  return newFixedEntries;
};

const editBucketData = async ({ bucketData }) => {
  if (!bucketData) throw new Error("No bucket data was set");
  const storedBuckets = await getBucketsFromLocalStorage();
  const newBuckets = { ...storedBuckets, ...bucketData };
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

  const newBuckets = { ...storedBuckets, [trimmedName]: Number(value) || 0 };
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
  editBucket: async ({ bucket }) => {
    return editBucketData({ bucketData: bucket });
  },
  addBucket: async ({ bucket }) => {
    return addBucketData({ bucket });
  },
  getCategories: async () => getCategoriesFromLocalStorage(),
  addCategory: async ({ category }) => {
    return addCategoryData({ category });
  },
  getFixedEntries: async () => getFixedEntriesFromLocalStorage(),
  // Set or edit a fixed income/expense effective from a month (issue #103). The
  // change persists from that month forward; earlier months are untouched.
  setFixedEntry: async ({ type, category, amount, from }) => {
    return setFixedEntryData({ type, category, amount, from });
  },
  // Remove a fixed income/expense from a month forward by writing a tombstone.
  // Earlier months keep their value, mirroring the edition behaviour.
  removeFixedEntry: async ({ type, category, from }) => {
    return setFixedEntryData({ type, category, amount: null, from });
  },
  editBuckets: async ({ buckets }) => {
    return editBucketData({ bucketData: buckets });
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
