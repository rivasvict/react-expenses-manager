import React, { Component } from "react";
import ContentTileSection from "../../../ContentTitleSection";
import { FormSelect } from "../../../Forms";
import { capitalize } from "lodash";
import { MainContentContainer } from "../../../MainContentContainer";
import EntriesSummary from "../EntriesSummary";
import { IconRemote } from "../../../Icons";
import {
  formatNumberForDisplay,
  getCategoryPercentagesFromEntries,
  getDatedEntries,
  getSumFromEntries,
} from "../../../../../helpers/entriesHelper/entriesHelper";
import { getMonthNameDisplay } from "../../../../../helpers/date";
import "./styles.scss";
import { Col, Row } from "react-bootstrap";
import SummaryChart from "./components/SummaryChart";
import SummaryWithChart from "../../../SummaryWithChart";
import { ENTRY_TYPES_PLURAL } from "../../../../../constants";

/**
 * TODO: Turn this into a functional component
 *
 * TODO: Add a way to navigate through months from this view
 *
 * TODO: Make sure expenses are shown as negative values
 */
class Summary extends Component {
  constructor(props) {
    super();
    this.selectedDate = props.selectedDate;
    this.state = {
      selectedEntries: this.getFilteredEntries({ props }),
      selectedEntriesSum: formatNumberForDisplay(
        getSumFromEntries({ entries: this.getEntriesToSum({ props }) })
      ),
      filter: "",
    };
  }

  handleChange = (event) => {
    const { value } = event.currentTarget;
    this.setState(() => {
      return {
        selectedEntries: this.getFilteredEntries({ filter: value }),
        selectedEntriesSum: formatNumberForDisplay(
          getSumFromEntries({
            entries: this.getEntriesToSum({ filter: value }),
          })
        ),
        filter: value,
      };
    });
  };

  getEntriesToSum = ({ filter = "", props = this.props }) => {
    const datedEntries = getDatedEntries({
      entries: props.entries,
      year: this.selectedDate.year,
      month: this.selectedDate.month,
    });

    return (
      datedEntries?.[filter] || [
        ...(datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES] || []),
        ...(datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES] || []),
      ] ||
      []
    );
  };

  getFilteredEntries = ({ filter = "", props = this.props }) => {
    const datedEntries = getDatedEntries({
      entries: props.entries,
      year: this.selectedDate.year,
      month: this.selectedDate.month,
    });
    const entriesSummary = {
      incomes: !!filter ? (
        <SummaryWithChart
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES]}
          name={capitalize(ENTRY_TYPES_PLURAL.INCOMES)}
          showChart={!!filter}
        />
      ) : (
        <EntriesSummary
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES]}
          name={ENTRY_TYPES_PLURAL.INCOMES}
        />
      ),
      expenses: !!filter ? (
        <SummaryWithChart
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES]}
          name={capitalize(ENTRY_TYPES_PLURAL.EXPENSES)}
          showChart={!!filter}
        />
      ) : (
        <EntriesSummary
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES]}
          name={capitalize(ENTRY_TYPES_PLURAL.EXPENSES)}
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

  getSummaryChartData() {
    const datedEntries = getDatedEntries({
      entries: this.props.entries,
      year: this.selectedDate.year,
      month: this.selectedDate.month,
    });
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
  }

  getByEntryTypeChartData(filter = this.state.filter) {
    const datedEntries = getDatedEntries({
      entries: this.props.entries,
      year: this.selectedDate.year,
      month: this.selectedDate.month,
    });
    const filteredEntries = datedEntries[filter];
    const entryTotalSum = getSumFromEntries({
      entries: filteredEntries,
      absolute: true,
    });
    const chartData = getCategoryPercentagesFromEntries({
      totalSum: entryTotalSum,
      entries: filteredEntries,
    });
    return { data: chartData, totalSum: entryTotalSum };
  }

  getChartProps() {
    return !this.state.filter
      ? this.getSummaryChartData()
      : this.getByEntryTypeChartData();
  }

  render() {
    const chartProps = this.getChartProps();
    return (
      <MainContentContainer className="summary-container">
        <ContentTileSection title="Summary">
          {/** TODO: Make sure the totalization is done here */}
          {`${capitalize(getMonthNameDisplay(this.selectedDate.month))} `}
          <IconRemote inLine={true} />
          {` ${this.state.selectedEntriesSum}`}
        </ContentTileSection>
        {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
        <FormSelect
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
          <Row className="chart-container">
            <Col xs={6}>
              <SummaryChart {...chartProps} />
            </Col>
          </Row>
        )}
        {this.state.selectedEntries}
      </MainContentContainer>
    );
  }
}

export default Summary;
