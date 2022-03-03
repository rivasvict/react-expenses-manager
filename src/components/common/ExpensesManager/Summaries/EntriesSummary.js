import { capitalize } from 'lodash';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { formatNumberForDisplay, getSumFromEntries } from '../../../../helpers/entriesHelper/entriesHelper';
import { IconPlus } from '../../Icons';
import './EntriesSummary.scss';

function GetEntriesList(entries) {
  return entries.map((entry, key) => {
    const category = entry.categories_path.split(',')[1];
    return (
      <Row key={key} className='entries-item'>
        {/** Change the key of the entries to avoid matching the index of the array
          to avoid re-rendering in every state change
        */}
        <Col xs={1} className='item-icon'>
          <IconPlus />
        </Col>
        <Col xs={7} className='item-description'>
          {capitalize(category)}{(entry.description ? ` - ${entry.description}` : ``)} 
        </Col>
        <Col xs={4} className='item-amount'>
          {formatNumberForDisplay(entry.amount)}
        </Col>
      </Row>
    )
  });
}

function EntriesSummary({ entries, name }) {
  const entriesList = GetEntriesList(entries);
  return (
    <Container className='entries-summary'>
      <Row>
        <Col xs={12} className='item-type'>
          {capitalize(name)}
        </Col>
      </Row>
      {entriesList.length ? entriesList : null}<br/>
      <Row>
        <Col xs={12}>
          {/** TODO: Separate the next part into a new component */}
          Total: {formatNumberForDisplay(getSumFromEntries(entries))}
        </Col>
      </Row>
    </Container>
  );
}

export default EntriesSummary;
