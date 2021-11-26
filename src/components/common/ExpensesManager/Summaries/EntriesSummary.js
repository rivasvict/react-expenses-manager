import React from 'react';
import { getSumFromEntries } from '../../../../helpers/entriesHelper';

function GetEntriesList(entries) {
  // TODO: Change the way categories are shown here
  return entries.map((entry, key) => {
    const category = entry.categories_path.split(',')[1];
    return (
      <li key={key}>{entry.amount} {entry.description} {category}</li>
    )
  });
}

function EntriesSummary({ entries, name }) {
  const entriesList = GetEntriesList(entries);
  return (
    <React.Fragment>
      {name}<br/>
      <ul>{entriesList.length ? entriesList : null}</ul><br/>
      <div>Total: {getSumFromEntries(entries)}</div>
    </React.Fragment>
  );
}

export default EntriesSummary;
