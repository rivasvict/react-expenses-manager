import React from 'react';
import TotalItem from './common/ExpensesManager/TotalItem';
import { getSum } from '../helpers/entriesHelper';
import { calculateTotal } from '../helpers/general';
import { Col, Row } from 'react-bootstrap';
import './Results.scss';

function Results({ entries, baseUrl = '' }) {
  const incomesName = 'incomes';
  const outcomesName = 'outcomes';
  const incomesSum = getSum({ entryType: 'incomes', entries: entries })
  const outcomesSum = getSum({ entryType: 'outcomes', entries: entries })
  const incomesUrl = `${baseUrl}/${incomesName}`;
  const outcomesUrl = `${baseUrl}/${outcomesName}`;
  const summaryUrl = `${baseUrl}/summary`;
  const totalSum = calculateTotal(incomesSum, outcomesSum);

  return (
    <React.Fragment>
      <Row>
        <Col xs={12}>
          <h1 className='title'>
            Monthly Income/Expenses
          </h1>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <TotalItem name='Incomes' ammount={incomesSum} url={incomesUrl} />
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <TotalItem name='Expenses' ammount={outcomesSum} url={outcomesUrl} />
        </Col>
      </Row>
      <Row className='results-total'>
        <Col xs={12}>
          <TotalItem name='Total' ammount={totalSum} url={summaryUrl} />
        </Col>
      </Row>
    </React.Fragment>
  );
}

export default Results;
