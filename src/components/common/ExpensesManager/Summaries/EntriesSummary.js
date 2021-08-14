import React from 'react';
import { getSumFromEntries } from '../../../../helpers/entriesHelper';

function GetEntriesList(entries) {
  return entries.map((entry, key) => <li key={key}>{entry.amount} {entry.description} {entry.category.name}</li>);
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
