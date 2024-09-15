import { csv2json, json2csv } from "json-2-csv";
import { getEntryCategoryOption } from "../../helpers/entriesHelper/entriesHelper";
import { ENTRY_TYPES_SINGULAR } from "../../constants";

const expensesList = getEntryCategoryOption(ENTRY_TYPES_SINGULAR.EXPENSE).map(
  (item) => item.value
);
const incomesList = getEntryCategoryOption(ENTRY_TYPES_SINGULAR.INCOME).map(
  (item) => item.value
);
const categoriesList = [...expensesList, ...incomesList];

const sanitizeCommas = (originalValue) => {
  const hasPotentialWrapper = originalValue.includes(',"');
  const isCategory =
    hasPotentialWrapper &&
    categoriesList.includes(originalValue.replace(/,"/g, "").toLowerCase());
  if (hasPotentialWrapper && isCategory) {
    return originalValue
      .replace(/,"/g, "")
      .replace(/^/g, ",")
      .replace(/$/g, ",");
  }
  return originalValue.replace(',"', "");
};

const dataParser = {
  csvToJson: ({ csv }) => {
    const options = {
      parseValue: sanitizeCommas,
    };
    return csv2json(csv, options);
  },
  jsonToCsv: ({ json }) => {
    return json2csv(json);
  },
};

export default dataParser;
