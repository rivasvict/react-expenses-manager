import React from 'react';
import TotalItem from './TotalItem';

const resultsStyle = {
  textAlign: 'center'
}

function calculateTotal(income, outcome) {
  income = parseInt(income);
  outcome = -parseInt(outcome);
  return income + outcome;
}

function Results({ incomes, outcomes, entries, baseUrl = '' }) {
  const incomesName = 'incomes';
  const outcomesName = 'outcomes';
  const incomesUrl = `${baseUrl}/${incomesName}`;
  const outcomesUrl = `${baseUrl}/${outcomesName}`;
  const summaryUrl = `${baseUrl}/summary`;
  return (
    <div style={resultsStyle}>      
      <TotalItem name='Income' ammount={incomes} entries={entries[incomesName]} url={incomesUrl} />
      <TotalItem name='Expenses' ammount={-outcomes} entries={entries[outcomesName]} url={outcomesUrl}/>
      <TotalItem name='Total' ammount={calculateTotal(incomes, outcomes)} url={summaryUrl} />
    </div>
  );
}

export default Results;
