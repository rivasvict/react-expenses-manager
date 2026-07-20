import { capitalize } from "lodash";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { formatNumberForDisplay } from "../../../../helpers/entriesHelper/entriesHelper";
import { IconMoneyIn, IconMoneyOut } from "../../Icons";
import "./EntriesSummary.scss";
import RowLink from "../../RowLink";

function GetEntriesList({ entries, entryType }) {
  const Icon = entryType === "income" ? IconMoneyIn : IconMoneyOut;
  return entries.map((entry, key) => {
    const category = entry.categories_path.split(",")[1];
    return (
      <RowLink
        to={`edit-${entryType}/${entry.id}`}
        key={key}
        className={`entries-item entries-item--${entryType}`}
      >
        {/** Change the key of the entries to avoid matching the index of the array
          to avoid re-rendering in every state change
        */}
        <Col xs={1} className="item-icon">
          <span className="item-icon-chip" aria-hidden="true">
            <Icon />
          </span>
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

// `hideHeader` lets a screen that renders its own list section header (the
// filters/sort UX on /expenses & /incomes) suppress the built-in one.
function EntriesSummary({ entries, name, entryType, total, hideHeader }) {
  const entriesList = GetEntriesList({ entries, entryType });
  return (
    <Container className={`entries-summary entries-summary--${entryType}`}>
      {!hideHeader && (
        <Row className="entries-summary-header">
          <Col xs={total === undefined ? 12 : 8} className="item-type">
            {capitalize(name)}
          </Col>
          {total !== undefined && (
            <Col xs={4} className="item-total">
              {formatNumberForDisplay(total)}
            </Col>
          )}
        </Row>
      )}
      {entriesList.length ? (
        entriesList
      ) : (
        <p className="entries-summary-empty">
          Nothing here yet for this month.
        </p>
      )}
    </Container>
  );
}

export default EntriesSummary;
