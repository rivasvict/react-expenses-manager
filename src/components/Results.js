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

function Results({ incomes, outcomes, entries }) {
  const incomesName = 'incomes';
  const outcomesName = 'outcomes';
  return (
    <div style={resultsStyle}>      
      <TotalItem name='Income' ammount={incomes} entries={entries[incomesName]} type={incomesName} />
      <TotalItem name='Exoepenses' ammount={-outcomes} type='outcomes' entries={entries[outcomesName]} type={outcomesName}/>
      <TotalItem name='Total' ammount={calculateTotal(incomes, outcomes)} type='summary'/>
    </div>
  );
}

export default Results;
