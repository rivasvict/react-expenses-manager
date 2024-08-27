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
  createUser,
  userCreationFail,
  userCreationLoading,
  logIn,
  setUser,
  logOut,
} = ActionCreators({ storage });
