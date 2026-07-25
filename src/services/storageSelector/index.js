import LocalStorage from "./LocalStorage";
import { STORAGE_TYPES } from "../../constants";

const storageSelector = (storageType) => {
  const storageMap = {
    [STORAGE_TYPES.LOCAL]: LocalStorage,
  };

  const selectedStorage = storageMap[storageType];
  // If no storageType is pased , then default to local;
  return selectedStorage ?? storageMap[STORAGE_TYPES.LOCAL];
};

export default storageSelector;
