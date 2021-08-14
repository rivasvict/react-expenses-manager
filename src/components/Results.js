import React from 'react';
import { getSum } from '../helpers/entriesHelper';
import { calculateTotal } from '../helpers/general';
import { Col } from 'react-bootstrap';
import './Results.scss';
import { IconSignIn, IconSignOut } from './common/Icons';
import RowLink from './common/RowLink';
import ScreenTitle from './common/ScreenTitle';

const incomesName = 'incomes';
const expensesName = 'expenses';

function TotalItem({ name, amount, Icon, url }) {
  return (
    <RowLink to={url} title={name} className='total-row'>
      <Col xs={1}>
        {
          Icon ?
            <Icon /> :
            null
        }
      </Col>
      <Col xs={5}>
        {name}
      </Col>
      <Col xs={6}>
        {amount}
      </Col>
    </RowLink>
  );
}

function Results({ entries, baseUrl = '' }) {
  const incomesSum = getSum({ entryType: incomesName, entries: entries })
  const expensesSum = getSum({ entryType: expensesName, entries: entries })
  const incomesUrl = `${baseUrl}/${incomesName}`;
  const expensesUrl = `${baseUrl}/${expensesName}`;
  const summaryUrl = `${baseUrl}/summary`;
  const totalSum = calculateTotal(incomesSum, expensesSum);

  return (
    <React.Fragment>
      <ScreenTitle screenTitle='Monthly Income/Expenses' />
      <TotalItem name='Incomes' amount={incomesSum} url={incomesUrl} Icon={IconSignIn} />
      <TotalItem name='Expenses' amount={expensesSum} url={expensesUrl} Icon={IconSignOut} />
      <RowLink to={summaryUrl} title='Summary' className='results-total'>
        <Col xs={12}>
          {`Savings: ${totalSum}`}
        </Col>
      </RowLink>
    </React.Fragment>
  );
}

export default Results;
