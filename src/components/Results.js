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

function Results({ incomes, outcomes }) {
  return (
    <div style={resultsStyle}>      
      <TotalItem name='Income' ammount={incomes} />
      <TotalItem name='Exoepenses' ammount={outcomes}/>
      <TotalItem name='Total' ammount={calculateTotal(incomes, outcomes)}/>
    </div>
  );
}

export default Results;
