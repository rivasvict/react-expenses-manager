import React from 'react';

function GetEntriesList(entries) {
  return entries.map((entry, key) => <li key={key}>{entry.type === 'income' ? entry.ammount : -entry.ammount} {entry.description}</li>);
}

function EntriesSummary({ entries, name }) {
  const entriesList = GetEntriesList(entries);
  return (
    <div>
      {name}<br/>
      <ul>{entriesList.length ? entriesList : <li>0</li>}</ul>
    </div>
  );
}

export default EntriesSummary;
