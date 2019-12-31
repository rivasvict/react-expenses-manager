import React from 'react';
import { getSumFromEntries } from '../../../helpers/entriesHelper';

function GetEntriesList(entries) {
  return entries.map((entry, key) => <li key={key}>{entry.ammount} {entry.description} {entry.category}</li>);
}

function EntriesSummary({ entries, name }) {
  const entriesList = GetEntriesList(entries);
  return (
    <div>
      {name}<br/>
      <ul>{entriesList.length ? entriesList : null}</ul><br/>
      <div>Total: {getSumFromEntries(entries)}</div>
    </div>
  );
}

export default EntriesSummary;
