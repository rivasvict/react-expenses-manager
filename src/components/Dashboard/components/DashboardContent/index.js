// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import { Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import Results from "../../../Results";
import { calculateTotal } from "../../../../helpers/general";
import { connect } from "react-redux";
import {
  formatNumberForDisplay,
  getSum,
} from "../../../../helpers/entriesHelper/entriesHelper";
import "./styles.scss";
import ContentTileSection from "../../../common/ContentTitleSection";
import { MainContentContainer } from "../../../common/MainContentContainer";
import BalanceChart from "./components/BalanceChart";
import ChartContainerRowWrapper from "../../../common/ChartContainerRowWrapper";
import { NavigableMonthHeader } from "../../../common/NavigableMonthHeader/index.ts";
import { useTranslation } from "../../../../i18n";

const DashboardContent = ({ entries, match, selectedDate }) => {
  const { t } = useTranslation();
  const monthBalance = (entries[selectedDate.year] &&
    entries[selectedDate.year][selectedDate.month]) || {
    incomes: [],
    expenses: [],
  };
  const summaryUrl = `${match.url}summary`;
  const incomesName = "incomes";
  const expensesName = "expenses";
  const incomesSum = getSum({ entryType: incomesName, entries: monthBalance });
  const expensesSum = getSum({
    entryType: expensesName,
    entries: monthBalance,
  });
  const totalSum = calculateTotal(incomesSum, expensesSum);
  // A zero balance stays neutral rather than reading as "positive".
  const balanceTone =
    totalSum < 0 ? "negative" : totalSum > 0 ? "positive" : "neutral";
  return (
    <MainContentContainer
      className="dashboard-content"
      pageTitle={t("dashboard.pageTitle")}
    >
      <NavigableMonthHeader />
      <ContentTileSection
        title={t("common.summary")}
        to={summaryUrl}
        className="balance-hero"
      >
        <span className="balance-hero__label">{t("common.savings")}</span>
        <span
          className={`balance-hero__amount balance-hero__amount--${balanceTone}`}
        >
          {formatNumberForDisplay(totalSum)}
        </span>
      </ContentTileSection>
      <ChartContainerRowWrapper>
        <BalanceChart incomesSum={incomesSum} expensesSum={expensesSum} />
      </ChartContainerRowWrapper>
      <MonthContent {...{ entries: monthBalance, match }} />
    </MainContentContainer>
  );
};

const MonthContent = ({ entries, match }) => {
  const { t } = useTranslation();
  return (
    <React.Fragment>
      <Row className="top-container">
        <Col xs={12} className="top-content">
          <Results entries={entries} baseUrl={match.url} />
        </Col>
      </Row>
      <Row className="bottom-container">
        <Col xs={12} className="bottom-content dashboard-actions">
          <Link
            to={`${match.url}add-income`}
            className="btn btn-primary btn-block"
          >
            {t("dashboard.addIncome")}
          </Link>
          <Link
            to={`${match.url}add-expense`}
            className="btn btn-secondary btn-block"
          >
            {t("dashboard.addExpenses")}
          </Link>
        </Col>
      </Row>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  entries: state.expensesManager.entries,
  selectedDate: state.expensesManager.selectedDate,
});

export default connect(mapStateToProps)(DashboardContent);
