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
import { ENTRY_TYPES_PLURAL } from "../../../../../constants";

const getDatedEntries = ({ entries, year, month }) => {
  return entries?.[year]?.[month] || { incomes: [], expenses: [] };
};

/**
 * Calculates the percentage of each category's total amount relative to the total sum.
 *
 * This function transforms an array of entries to an array of categories as keys
 * and it accumulated percentages. This is ideal to summarize a list of expenses for a
 * chart.
 *
 * @param {Object} params - The parameters for the function.
 * @param {number} params.totalSum - The total sum used as the denominator for percentage calculation.
 * @param {Array<Object>} params.entries - The list of entries to process.
 * @param {string} params.entries[].amount - The raw amount value for the entry, which will be converted to a float.
 * @param {string} params.entries[].categories_path - A comma-separated string representing the category path.
 * @returns {Object} An object where each key is a category and each value is the percentage of the total sum for that category
 */
const getEntriesToPercentagesByCategory = ({ totalSum, entries }) =>
  entries.reduce((consolidatedCategories, entry) => {
    const { amount: rawAmount, categories_path } = entry;
    const category = capitalize(categories_path.split(",")[1]);
    const amount = Math.abs(parseFloat(rawAmount));
    const percentageAmount = (amount / totalSum) * 100;
    return {
      ...consolidatedCategories,
      [category]:
        (consolidatedCategories[category]
          ? consolidatedCategories[category]
          : 0) + percentageAmount,
    };
  }, {});

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
    const datedEntries = this.getDatedEntries(props);

    return (
      datedEntries?.[filter] || [
        ...(datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES] || []),
        ...(datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES] || []),
      ] ||
      []
    );
  };

  getDatedEntries = (props = this.props) => {
    const selectedYear = this.selectedDate.year;
    const selectedMonth = this.selectedDate.month;
    const entries = props.entries;
    return getDatedEntries({
      entries,
      year: selectedYear,
      month: selectedMonth,
    });
  };

  getFilteredEntries = ({ filter = "", props = this.props }) => {
    const datedEntries = this.getDatedEntries(props);
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
    const datedEntries = this.getDatedEntries();
    const incomesSum = Math.abs(
      getSumFromEntries(datedEntries[ENTRY_TYPES_PLURAL.INCOMES])
    );
    const expensesSum = Math.abs(
      getSumFromEntries(datedEntries[ENTRY_TYPES_PLURAL.EXPENSES])
    );
    const totalSum = incomesSum + expensesSum;
    const chartData = { incomes: incomesSum, expenses: expensesSum };
    return { data: chartData, totalSum };
  }

  getByEntryTypeChartData(filter = this.state.filter) {
    const datedEntries = this.getDatedEntries();
    const filteredEntries = datedEntries[filter];
    const entryTotalSum = Math.abs(getSumFromEntries(filteredEntries));
    const chartData = getEntriesToPercentagesByCategory({
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
