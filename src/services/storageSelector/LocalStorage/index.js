import { v4 as uuidv4 } from "uuid";
const BALANCE = "balance";
const BUCKET = "buckets";

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

const LocalStorage = () => ({
  getBalance: () => getBalanceFromLocalStorage(),
  setBalance: ({ balance }) => storeBalanceInLocalStorage({ data: balance }),
  clearAllData: async () => localStorage.clear(),
  setNewRecord: async (entry) => {
    if (!entry) throw new Error("No entry was added");
    const balance = await getBalanceFromLocalStorage();
    const newBalance = [...balance, { ...entry, id: uuidv4() }];
    console.log("entry", entry);
    console.log("balance", balance);
    storeBalanceInLocalStorage({ data: newBalance });
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
  getBuckets: async ({ buckets }) => {
    const bucketsFromLocalStorage = await getBucketsFromLocalStorage();
    if (!buckets && !bucketsFromLocalStorage?.length)
      throw new Error("No buckets were set");
    /** YOU NEED TO FIND A BETTER WAY TO INITIALIZE THIS VARIABLE */
    if (bucketsFromLocalStorage?.length !== 0) return bucketsFromLocalStorage;
    await storeBucketsInLocalStorage({ data: buckets });
    return getBucketsFromLocalStorage();
  },
  editBucket: async ({ bucket }) => {
    if (!bucket) throw new Error("No bucket was set");
    const storedBuckets = await getBucketsFromLocalStorage();
    const newBuckets = { ...storedBuckets, ...bucket };
    await storeBucketsInLocalStorage({ data: newBuckets });
    return newBuckets;
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
    const bucket = buckets[selectedBucketKey];
    return bucket;
  },
});

export default LocalStorage;
