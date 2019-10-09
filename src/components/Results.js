import React from 'react';
import TotalItem from './TotalItem';

const resultsStyle = {
  textAlign: 'center'
}

function Results({ incomes, outcomes }) {
  return (
    <div style={resultsStyle}>      
      <TotalItem name='Income' ammount={incomes} />
      <TotalItem name='Exoepenses' ammount={outcomes}/>
      <TotalItem name='Total' ammount={incomes}/>
    </div>
  );
}

export default Results;
