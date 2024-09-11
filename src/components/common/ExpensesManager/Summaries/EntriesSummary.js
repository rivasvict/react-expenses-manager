import { capitalize } from "lodash";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { formatNumberForDisplay } from "../../../../helpers/entriesHelper/entriesHelper";
import { IconPlus } from "../../Icons";
import "./EntriesSummary.scss";
import RowLink from "../../RowLink";

function GetEntriesList({ entries, entryType }) {
  return entries.map((entry, key) => {
    const category = entry.categories_path.split(",")[1];
    return (
      <RowLink
        to={`edit-${entryType}/${entry.id}`}
        key={key}
        className="entries-item"
      >
        {/** Change the key of the entries to avoid matching the index of the array
          to avoid re-rendering in every state change
        */}
        <Col xs={1} className="item-icon">
          <IconPlus />
        </Col>
        <Col xs={7} className="item-description">
          {capitalize(category)}
          {entry.description ? ` - ${entry.description}` : ``}
        </Col>
        <Col xs={4} className="item-amount">
          {formatNumberForDisplay(entry.amount)}
        </Col>
      </RowLink>
    );
  });
}

function EntriesSummary({ entries, name, entryType }) {
  const entriesList = GetEntriesList({ entries, entryType });
  return (
    <Container className="entries-summary">
      <Row>
        <Col xs={12} className="item-type">
          {capitalize(name)}
        </Col>
      </Row>
      {entriesList.length ? entriesList : null}
    </Container>
  );
}

export default EntriesSummary;
