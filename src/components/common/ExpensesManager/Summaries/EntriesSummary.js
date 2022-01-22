import React from 'react';
import { formatNumberForDisplay, getSumFromEntries } from '../../../../helpers/entriesHelper/entriesHelper';

function GetEntriesList(entries) {
  return entries.map((entry, key) => {
    const category = entry.categories_path.split(',')[1];
    return (
      <li key={key}>{formatNumberForDisplay(entry.amount)} {entry.description} {category}</li>
    )
  });
}

function EntriesSummary({ entries, name }) {
  const entriesList = GetEntriesList(entries);
  return (
    <React.Fragment>
      {name}<br/>
      <ul>{entriesList.length ? entriesList : null}</ul><br/>
      <div>Total: {formatNumberForDisplay(getSumFromEntries(entries))}</div>
    </React.Fragment>
  );
}

export default EntriesSummary;
