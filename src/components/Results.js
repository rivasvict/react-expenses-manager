import React from "react";
import {
  formatNumberForDisplay,
  getSum,
} from "../helpers/entriesHelper/entriesHelper";
import { Col } from "react-bootstrap";
import "./Results.scss";
import { IconSignIn, IconSignOut } from "./common/Icons";
import RowLink from "./common/RowLink";

function TotalItem({
  name,
  amount,
  Icon,
  url,
  forcePositiveNumberDisplay = false,
}) {
  return (
    <RowLink to={url} title={name} className="total-row">
      <Col xs={2}>{Icon ? <Icon /> : null}</Col>
      <Col xs={5}>{name}</Col>
      <Col xs={5}>
        {forcePositiveNumberDisplay && amount < 0
          ? formatNumberForDisplay(-1 * amount)
          : formatNumberForDisplay(amount)}
      </Col>
    </RowLink>
  );
}

function Results({ entries, baseUrl = "" }) {
  const incomesName = "incomes";
  const expensesName = "expenses";
  const incomesSum = getSum({ entryType: incomesName, entries });
  const expensesSum = getSum({ entryType: expensesName, entries });
  const incomesUrl = `${baseUrl}${incomesName}`;
  const expensesUrl = `${baseUrl}${expensesName}`;

  return (
    <React.Fragment>
      <TotalItem
        name="Incomes"
        amount={incomesSum}
        url={incomesUrl}
        Icon={IconSignIn}
      />
      <TotalItem
        name="Expenses"
        amount={expensesSum}
        url={expensesUrl}
        Icon={IconSignOut}
        forcePositiveNumberDisplay={true}
      />
    </React.Fragment>
  );
}

export default Results;
