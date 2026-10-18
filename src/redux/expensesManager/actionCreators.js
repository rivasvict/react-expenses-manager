// TODO: This file has no colocated unit test; it was edited, not created,
// by category management (design/features/category-management/ui/decision.md).
// Tracked in: https://github.com/rivasvict/react-expenses-manager/issues/187
import { ActionCreators } from "./actions";
import storageSelector from "../../services/storageSelector";
import { STORAGE_TYPES } from "../../constants";
/**
 * TODO: Use STORAGE_TYPES.REMOTE
 * when the connection to the backend is reinstated https://github.com/rivasvict/react-expenses-manager/issues/50
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
  applyOnboarding,
  renameCategory,
  deleteCategory,
  setEntryFilters,
  clearEntryFilters,
  getEntryFilters,
  getFixedEntries,
  addFixedEntry,
  editFixedEntry,
  removeFixedEntry,
} = ActionCreators({ storage });
