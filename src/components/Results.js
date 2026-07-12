import React from "react";
import {
  formatNumberForDisplay,
  getSum,
} from "../helpers/entriesHelper/entriesHelper";
import { Col } from "react-bootstrap";
import "./Results.scss";
import { IconMoneyIn, IconMoneyOut } from "./common/Icons";
import RowLink from "./common/RowLink";

function TotalItem({
  name,
  amount,
  Icon,
  url,
  variant,
  forcePositiveNumberDisplay = false,
}) {
  return (
    <RowLink to={url} title={name} className={`total-row total-row--${variant}`}>
      <Col xs={2} className="total-row__icon">
        <span className="total-row__icon-chip" aria-hidden="true">
          {Icon ? <Icon /> : null}
        </span>
      </Col>
      <Col xs={5} className="total-row__name">
        {name}
      </Col>
      <Col xs={5} className="total-row__amount">
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
        Icon={IconMoneyIn}
        variant="income"
      />
      <TotalItem
        name="Expenses"
        amount={expensesSum}
        url={expensesUrl}
        Icon={IconMoneyOut}
        variant="expense"
        forcePositiveNumberDisplay={true}
      />
    </React.Fragment>
  );
}

export default Results;
