import React, { Component } from "react";
import ContentTileSection from "../../../ContentTitleSection";
import { FormSelect } from "../../../Forms";
import { capitalize } from "lodash";
import { MainContentContainer } from "../../../MainContentContainer";
import EntriesSummary from "../EntriesSummary";
import {
  formatNumberForDisplay,
  getCategoryPercentagesFromEntries,
  getDatedEntries,
  getSumFromEntries,
} from "../../../../../helpers/entriesHelper/entriesHelper";
import { getMonthNameDisplay } from "../../../../../helpers/date";
import "./styles.scss";
import SummaryChart from "./components/SummaryChart";
import SummaryWithChart from "../../../SummaryWithChart";
import {
  ENTRY_TYPES_PLURAL,
  ENTRY_TYPES_SINGULAR,
} from "../../../../../constants";
import ChartContainerRowWrapper from "../../../ChartContainerRowWrapper";
import { withRouter } from "react-router-dom";
import { Button, Col, Container, Row } from "react-bootstrap";

/**
 * TODO: Turn this into a functional component
 *
 * TODO: Add a way to navigate through months from this view
 *
 * TODO: Make sure expenses are shown as negative values
 */
class Summary extends Component {
  // Everything displayed is derived from props at render time (only the
  // entry-type filter is state), so the screen also works when entries arrive
  // after mount — e.g. on a page refresh directly on /summary.
  constructor(props) {
    super(props);
    this.state = {
      filter: "",
    };
  }

  handleChange = (event) => {
    const { value } = event.currentTarget;
    this.setState(() => ({ filter: value }));
  };

  getDatedEntries = () =>
    getDatedEntries({
      entries: this.props.entries,
      year: this.props.selectedDate.year,
      month: this.props.selectedDate.month,
    });

  getEntriesToSum = (datedEntries) => {
    const { filter } = this.state;
    return (
      datedEntries?.[filter] || [
        ...(datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES] || []),
        ...(datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES] || []),
      ]
    );
  };

  getFilteredEntries = (datedEntries) => {
    const { filter } = this.state;
    const entriesSummary = {
      incomes: !!filter ? (
        <SummaryWithChart
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES]}
          name={capitalize(ENTRY_TYPES_PLURAL.INCOMES)}
          showChart={!!filter}
          entryType={ENTRY_TYPES_SINGULAR.INCOME}
        />
      ) : (
        <EntriesSummary
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES]}
          name={ENTRY_TYPES_PLURAL.INCOMES}
          entryType={ENTRY_TYPES_SINGULAR.INCOME}
        />
      ),
      expenses: !!filter ? (
        <SummaryWithChart
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES]}
          name={capitalize(ENTRY_TYPES_PLURAL.EXPENSES)}
          showChart={!!filter}
          entryType={ENTRY_TYPES_SINGULAR.EXPENSE}
        />
      ) : (
        <EntriesSummary
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES]}
          name={capitalize(ENTRY_TYPES_PLURAL.EXPENSES)}
          entryType={ENTRY_TYPES_SINGULAR.EXPENSE}
        />
      ),
    };

    return (
      entriesSummary[filter] || (
        <React.Fragment>
          {entriesSummary[ENTRY_TYPES_PLURAL.INCOMES]}
          {entriesSummary[ENTRY_TYPES_PLURAL.EXPENSES]}
        </React.Fragment>
      )
    );
  };

  getSummaryChartData = (datedEntries) => {
    const incomesSum = getSumFromEntries({
      entries: datedEntries[ENTRY_TYPES_PLURAL.INCOMES],
      absolute: true,
    });
    const expensesSum = getSumFromEntries({
      entries: datedEntries[ENTRY_TYPES_PLURAL.EXPENSES],
      absolute: true,
    });
    const totalSum = incomesSum + expensesSum;
    const chartData = { incomes: incomesSum, expenses: expensesSum };
    return { data: chartData, totalSum };
  };

  getByEntryTypeChartData = (datedEntries) => {
    const filteredEntries = datedEntries[this.state.filter];
    const entryTotalSum = getSumFromEntries({
      entries: filteredEntries,
      absolute: true,
    });
    const chartData = getCategoryPercentagesFromEntries({
      totalSum: entryTotalSum,
      entries: filteredEntries,
    });
    return { data: chartData, totalSum: entryTotalSum };
  };

  getChartProps = (datedEntries) =>
    !this.state.filter
      ? this.getSummaryChartData(datedEntries)
      : this.getByEntryTypeChartData(datedEntries);

  goBack = () => {
    this?.props?.history?.goBack();
  };

  handleCancel = () => this.goBack();

  render() {
    // Derive the month's entries once per render; every figure below shares it.
    const datedEntries = this.getDatedEntries();
    const chartProps = this.getChartProps(datedEntries);
    const selectedEntries = this.getFilteredEntries(datedEntries);
    const totalSum = getSumFromEntries({
      entries: this.getEntriesToSum(datedEntries),
    });
    const selectedEntriesSum = formatNumberForDisplay(totalSum);
    // A zero total stays neutral — green would misread as "money in".
    const toneClass =
      totalSum < 0
        ? "tile-tone--expense"
        : totalSum > 0
          ? "tile-tone--income"
          : "";
    return (
      <MainContentContainer
        className="summary-container"
        pageTitle="Monthly Summary"
      >
        <Container fluid className="top-content">
          <ContentTileSection title="Summary" className={toneClass}>
            {/** TODO: Make sure the totalization is done here */}
            {`${capitalize(getMonthNameDisplay(this.props.selectedDate.month))} total: ${selectedEntriesSum}`}
          </ContentTileSection>
          {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
          <label className="form-label" htmlFor="summary-entry-type">
            Show
          </label>
          <FormSelect
            id="summary-entry-type"
            name="filler"
            value={this.state.filter}
            onChange={this.handleChange}
            className="select-entry-type"
          >
            <option value="">All incomes and expenses</option>
            <option value={ENTRY_TYPES_PLURAL.INCOMES}>
              {capitalize(ENTRY_TYPES_PLURAL.INCOMES)}
            </option>
            <option value={ENTRY_TYPES_PLURAL.EXPENSES}>
              {capitalize(ENTRY_TYPES_PLURAL.EXPENSES)}
            </option>
          </FormSelect>
          {!this.state.filter && (
            <ChartContainerRowWrapper>
              <SummaryChart {...chartProps} />
            </ChartContainerRowWrapper>
          )}
          {selectedEntries}
        </Container>
        <Container className="bottom-content" fluid>
          <Row>
            <Col>
              <Button
                type="submit"
                variant="secondary"
                onClick={this.handleCancel}
              >
                Go Back
              </Button>
            </Col>
          </Row>
        </Container>
      </MainContentContainer>
    );
  }
}

export default withRouter(Summary);
