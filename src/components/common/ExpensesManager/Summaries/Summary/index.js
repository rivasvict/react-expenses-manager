import React, { Component } from "react";
import ContentTileSection from "../../../ContentTitleSection";
import { FormSelect } from "../../../Forms";
import { capitalize } from "lodash";
import { MainContentContainer } from "../../../MainContentContainer";
import EntriesSummary from "../EntriesSummary";
import { IconRemote } from "../../../Icons";
import {
  formatNumberForDisplay,
  getSumFromEntries,
} from "../../../../../helpers/entriesHelper/entriesHelper";
import { getMonthNameDisplay } from "../../../../../helpers/date";
import "./styles.scss";
import { Col, Row } from "react-bootstrap";
import SummaryChart from "./components/SummaryChart";
import SummaryWithChart from "../../../SummaryWithChart";

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
        getSumFromEntries(this.getEntriesToSum({ props }))
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
          getSumFromEntries(this.getEntriesToSum({ filter: value }))
        ),
        filter: value,
      };
    });
  };

  getEntriesToSum = ({ filter = "", props = this.props }) => {
    const datedEntries = this.getDatedEntries({ props });

    return (
      datedEntries?.[filter] || [
        ...(datedEntries?.["incomes"] || []),
        ...(datedEntries?.["expenses"] || []),
      ] ||
      []
    );
  };

  getDatedEntries = ({ props = this.props }) => {
    const selectedYear = this.selectedDate.year;
    const selectedMonth = this.selectedDate.month;
    const entries = props.entries;
    return (
      entries?.[selectedYear]?.[selectedMonth] || { incomes: [], expenses: [] }
    );
  };

  getFilteredEntries = ({ filter = "", props = this.props }) => {
    const datedEntries = this.getDatedEntries({ props });
    const entriesSummary = {
      incomes: !!filter ? (
        <SummaryWithChart entries={datedEntries?.["incomes"]} name="Incomes" />
      ) : (
        <EntriesSummary entries={datedEntries?.["incomes"]} mame="Incomes" />
      ),
      expenses: !!filter ? (
        <SummaryWithChart
          entries={datedEntries?.["expenses"]}
          name="Expenses"
          showChart={!!filter}
        />
      ) : (
        <EntriesSummary entries={datedEntries?.["expenses"]} name="Expenses" />
      ),
    };

    return (
      entriesSummary[filter] || (
        <React.Fragment>
          {entriesSummary["incomes"]}
          {entriesSummary["expenses"]}
        </React.Fragment>
      )
    );
  };

  getSummaryChartData() {
    const datedEntries = this.getDatedEntries({});
    const incomesSum = Math.abs(getSumFromEntries(datedEntries["incomes"]));
    const expensesSum = Math.abs(getSumFromEntries(datedEntries["expenses"]));
    const totalSum = incomesSum + expensesSum;
    const chartData = { incomes: incomesSum, expenses: expensesSum };
    return { data: chartData, totalSum };
  }

  getByEntryTypeChartData(filter = this.state.filter) {
    const datedEntries = this.getDatedEntries({});
    const filteredEntries = datedEntries[filter];
    const entryTotalSum = Math.abs(getSumFromEntries(filteredEntries));
    const chartData = filteredEntries.reduce((allChartData, entry) => {
      const { amount: rawAmount, categories_path } = entry;
      const category = capitalize(categories_path.split(",")[1]);
      const amount = Math.abs(parseFloat(rawAmount));
      const percentageAmount = (amount / entryTotalSum) * 100;
      return {
        ...allChartData,
        [category]:
          (allChartData[category] ? allChartData[category] : 0) +
          percentageAmount,
      };
    }, {});
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
          <option value="incomes">Incomes</option>
          <option value="expenses">Expenses</option>
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
