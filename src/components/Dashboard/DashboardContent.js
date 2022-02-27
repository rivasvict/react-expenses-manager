import React from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Results from '../Results';
import { getMonthNameDisplay } from '../../helpers/date';
import { getNewSelectedDate, doesAdjacentDateExist, calculateTotal } from '../../helpers/general';
import ScreenTitle from '../common/ScreenTitle';
import { connect } from 'react-redux';
import { setSelectedDate } from '../../redux/expensesManager/actionCreators';
import { formatNumberForDisplay, getSum } from '../../helpers/entriesHelper/entriesHelper';
import './DashboardContent.scss';
import { IconRemote } from '../common/Icons';
import ContentTileSection from '../common/ContentTitleSection';

const handleDateSelectionPointers = ({ entries, selectedDate, onSelectedDateChange, dateAdjacencyType }) => (
  onSelectedDateChange(getNewSelectedDate({
    entries,
    dateAdjacencyType,
    currentSelectedDate: selectedDate
  }))
);

const DashboardContent = ({ entries, match, selectedDate, onSelectedDateChange }) => {
  const monthBalance = (entries[selectedDate.year] && entries[selectedDate.year][selectedDate.month]) || { incomes: [], expenses: [] };
  const summaryUrl = `${match.url}/summary`;
  const incomesName = 'incomes';
  const expensesName = 'expenses';
  const incomesSum = getSum({ entryType: incomesName, entries: monthBalance })
  const expensesSum = getSum({ entryType: expensesName, entries: monthBalance })
  const totalSum = calculateTotal(incomesSum, expensesSum);

  return (
    <Container className='DasboardContent'>
      <ContentTileSection title='Summary' to={summaryUrl}>
        {`Savings `}<IconRemote inLine={true} />{` ${formatNumberForDisplay(totalSum)}`}
      </ContentTileSection>
      <Row className='month-header'>
        <Col xs={3}>
          {
            doesAdjacentDateExist({ dateAdjacencyType: 'prev', selectedDate, entries }) ?
            <Button onClick={() => handleDateSelectionPointers({ entries, selectedDate, onSelectedDateChange, dateAdjacencyType: 'prev' })}>Prev</Button> :
            null
          }
        </Col>
        <Col xs={6}>
          <ScreenTitle screenTitle={`${getMonthNameDisplay(selectedDate.month)} ${selectedDate.year}`} />
        </Col>
        <Col xs={3}>
          {
            doesAdjacentDateExist({ dateAdjacencyType: 'next', selectedDate, entries }) ?
            <Button onClick={() => handleDateSelectionPointers({ entries, selectedDate, onSelectedDateChange, dateAdjacencyType: 'next' })}>Next</Button> :
            null
          }
        </Col>
      </Row>
      <MonthContent {...{ entries: monthBalance, match }} />
    </Container>
  );
};

const MonthContent = ({ entries, match }) => (
  <React.Fragment>
    <Row className='top-container'>
      <Col xs={12} className='top-content'>
        <Results
          entries={entries}
          baseUrl={match.url} />
      </Col>
    </Row>
    <Row>
      <Col xs={12} className='bottom-content'>
        <Link to={`${match.url}/add-income`} className='btn btn-primary btn-block'>Add Income</Link>
        <Link to={`${match.url}/add-expense`} className='btn btn-secondary btn-block'>Add Expenses</Link>
      </Col>
    </Row>
  </React.Fragment>
);

const mapStateToProps = state => ({
  entries: state.expensesManager.entries,
  selectedDate: state.expensesManager.selectedDate
});

const mapActionsToProps = dispatch => ({
  onSelectedDateChange: newSelectedDate => dispatch(setSelectedDate(newSelectedDate))
});

export default connect(mapStateToProps, mapActionsToProps)(DashboardContent)