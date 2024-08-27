import { BOOLEAN_ENUM } from "../../../../../constants";

const EVER_SHOW_DATA_DISCLAIMER_KEY = "everShowDataDisclaimer";

const get = () => {
  const storedData = localStorage.getItem(EVER_SHOW_DATA_DISCLAIMER_KEY);
  const parsedStoredData = parseInt(storedData);
  const isStoredDataValid =
    parsedStoredData === BOOLEAN_ENUM.FALSE ||
    parsedStoredData === BOOLEAN_ENUM.TRUE;
  return storedData && isStoredDataValid ? !!parsedStoredData : true;
};

const set = (everShowDataDisclaimer) => {
  localStorage.setItem(EVER_SHOW_DATA_DISCLAIMER_KEY, everShowDataDisclaimer);
};

const everShowDataDisclaimerStorage = {
  get,
  set,
};

export default everShowDataDisclaimerStorage;
