import React from 'react';
import TotalItem from './TotalItem';
import { getSum } from '../helpers/entriesHelper';
import { calculateTotal } from '../helpers/general';

const resultsStyle = {
  textAlign: 'center'
}

function Results({ entries, baseUrl = '' }) {
  const incomesName = 'incomes';
  const outcomesName = 'outcomes';
  const incomesSum = getSum({ entryType: 'incomes', entries: entries })
  const outcomesSum = getSum({ entryType: 'outcomes', entries: entries })
  const incomesUrl = `${baseUrl}/${incomesName}`;
  const outcomesUrl = `${baseUrl}/${outcomesName}`;
  const summaryUrl = `${baseUrl}/summary`;
  const totalSum = calculateTotal(incomesSum, -outcomesSum);

  return (
    <div style={resultsStyle}>      
      <TotalItem name='Incomes' ammount={incomesSum} url={incomesUrl} />
      <TotalItem name='Expenses' ammount={-outcomesSum} url={outcomesUrl}/>
      <TotalItem name='Total' ammount={totalSum} url={summaryUrl} />
    </div>
  );
}

export default Results;
