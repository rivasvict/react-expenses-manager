import React from 'react';
import { Col } from 'react-bootstrap';
import { formatNumberForDisplay } from '../../helpers/entriesHelper/entriesHelper';
import RowLink from './RowLink';

function AmountSummary({ to, title, totalSum }) {
  return (
    <RowLink {...{ to, title }} className='results-total'>
      <Col xs={12}>
        {`Savings: ${formatNumberForDisplay(totalSum)}`}
      </Col>
    </RowLink>
  );
}

export default AmountSummary;
