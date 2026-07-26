import { ActionCreators } from "./actions";
import storageSelector from "../../services/storageSelector";
import { STORAGE_TYPES } from "../../constants";
/**
 * App data is stored locally. The old RemoteStorage adapter (which targeted
 * the defunct expenses-manager-api) has been removed; cross-device sharing is
 * now handled by the separate, additive sync feature (see docs/multi-user-sync).
 */
const selectedStorage = storageSelector(STORAGE_TYPES.LOCAL);
const storage = selectedStorage();

export const {
  addExpense,
  addIncome,
  categoryChange,
  getBalance,
  restoreBackup,
  clearAllData,
  setSelectedDate,
  getEntryById,
  editEntry,
  removeEntry,
  getBackupData,
  getBuckets,
  editBucket,
  addBucket,
  getBucket,
  addCategory,
  getCategories,
  getFixedEntries,
  addFixedEntry,
  editFixedEntry,
  removeFixedEntry,
} = ActionCreators({ storage });
