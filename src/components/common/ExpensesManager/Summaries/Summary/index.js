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
  getEntryCategoryOption,
  getSumFromEntries,
} from "../../../../../helpers/entriesHelper/entriesHelper";
import {
  filterEntries,
  getActiveFilterDescriptors,
  getDefaultEntryFilters,
  sortEntries,
} from "../../../../../helpers/entriesHelper/filterSortHelper";
import { getMonthNameDisplay } from "../../../../../helpers/date";
import "./styles.scss";
import SummaryChart from "./components/SummaryChart";
import SummaryWithChart from "../../../SummaryWithChart";
import EntryListToolbar from "../../EntryListControls/EntryListToolbar";
import FilterSheet from "../../EntryListControls/FilterSheet";
import FilteredBanner from "../../EntryListControls/FilteredBanner";
import ListSectionHeader from "../../EntryListControls/ListSectionHeader";
import FilterEmptyState from "../../EntryListControls/FilterEmptyState";
import {
  ENTRY_TYPES_PLURAL,
  ENTRY_TYPES_SINGULAR,
} from "../../../../../constants";
import ChartContainerRowWrapper from "../../../ChartContainerRowWrapper";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import {
  clearEntryFilters,
  setEntryFilters,
} from "../../../../../redux/expensesManager/actionCreators";
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
  // entry-type filter and the sheet visibility are state), so the screen also
  // works when entries arrive after mount — e.g. on a page refresh directly
  // on /summary.
  constructor(props) {
    super(props);
    this.state = {
      filter: "",
      isFilterSheetOpen: false,
    };
  }

  // Owned here so focus can return to the toolbar's Filters button when the
  // sheet closes (a11y requirement from the design brief).
  filtersButtonRef = React.createRef();

  openFilterSheet = () => this.setState({ isFilterSheetOpen: true });

  closeFilterSheet = () => {
    this.setState({ isFilterSheetOpen: false });
    this.filtersButtonRef.current?.focus();
  };

  // Dropping a chip resets just that filter back to its default value.
  handleRemoveFilter = (filterKey) => {
    const defaults = getDefaultEntryFilters();
    this.props.onFiltersChange({ [filterKey]: defaults[filterKey] });
  };

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

  // The ONE shared entryFilters state applied independently to each list —
  // both lists always narrow and sort together.
  getFilteredDatedEntries = (datedEntries) => {
    const { entryFilters } = this.props;
    const applyFiltersAndSort = (entriesOfType) =>
      sortEntries(
        filterEntries({
          entries: entriesOfType || [],
          search: entryFilters.search,
          searchScope: entryFilters.searchScope,
          category: entryFilters.category,
        }),
        entryFilters.sortKey
      );
    return {
      [ENTRY_TYPES_PLURAL.INCOMES]: applyFiltersAndSort(
        datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES]
      ),
      [ENTRY_TYPES_PLURAL.EXPENSES]: applyFiltersAndSort(
        datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES]
      ),
    };
  };

  getEntriesToSum = (datedEntries) => {
    const { filter } = this.state;
    return (
      datedEntries?.[filter] || [
        ...(datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES] || []),
        ...(datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES] || []),
      ]
    );
  };

  // While the shared filters are active each list gets a "Matching …" section
  // header with its per-list total; otherwise the built-in headers stay.
  getFilteredEntries = (datedEntries, isFiltered) => {
    const { filter } = this.state;
    const listHeaders = {
      incomes: isFiltered ? (
        <ListSectionHeader
          label="Matching incomes"
          tone={ENTRY_TYPES_SINGULAR.INCOME}
          totalText={formatNumberForDisplay(
            getSumFromEntries({
              entries: datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES] || [],
            })
          )}
        />
      ) : undefined,
      expenses: isFiltered ? (
        <ListSectionHeader
          label="Matching expenses"
          tone={ENTRY_TYPES_SINGULAR.EXPENSE}
          totalText={formatNumberForDisplay(
            getSumFromEntries({
              entries: datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES] || [],
            })
          )}
        />
      ) : undefined,
    };
    const entriesSummary = {
      incomes: !!filter ? (
        <SummaryWithChart
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES]}
          name={capitalize(ENTRY_TYPES_PLURAL.INCOMES)}
          showChart={!!filter}
          entryType={ENTRY_TYPES_SINGULAR.INCOME}
          listHeader={listHeaders.incomes}
        />
      ) : (
        <React.Fragment>
          {listHeaders.incomes}
          <EntriesSummary
            entries={datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES]}
            name={ENTRY_TYPES_PLURAL.INCOMES}
            entryType={ENTRY_TYPES_SINGULAR.INCOME}
            hideHeader={isFiltered}
          />
        </React.Fragment>
      ),
      expenses: !!filter ? (
        <SummaryWithChart
          entries={datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES]}
          name={capitalize(ENTRY_TYPES_PLURAL.EXPENSES)}
          showChart={!!filter}
          entryType={ENTRY_TYPES_SINGULAR.EXPENSE}
          listHeader={listHeaders.expenses}
        />
      ) : (
        <React.Fragment>
          {listHeaders.expenses}
          <EntriesSummary
            entries={datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES]}
            name={capitalize(ENTRY_TYPES_PLURAL.EXPENSES)}
            entryType={ENTRY_TYPES_SINGULAR.EXPENSE}
            hideHeader={isFiltered}
          />
        </React.Fragment>
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
    const { entryFilters } = this.props;
    // Derive the month's entries once per render; every figure below shares
    // the filtered/sorted view of them.
    const datedEntries = this.getDatedEntries();
    const filteredDatedEntries = this.getFilteredDatedEntries(datedEntries);
    const descriptors = getActiveFilterDescriptors({ entryFilters });
    const isFiltered = descriptors.length > 0;
    const activeFilterCount = descriptors.filter(
      (descriptor) => descriptor.key !== "search"
    ).length;
    const shownCount =
      filteredDatedEntries[ENTRY_TYPES_PLURAL.INCOMES].length +
      filteredDatedEntries[ENTRY_TYPES_PLURAL.EXPENSES].length;
    const totalCount =
      (datedEntries?.[ENTRY_TYPES_PLURAL.INCOMES] || []).length +
      (datedEntries?.[ENTRY_TYPES_PLURAL.EXPENSES] || []).length;
    const chartProps = this.getChartProps(filteredDatedEntries);
    const selectedEntries = this.getFilteredEntries(
      filteredDatedEntries,
      isFiltered
    );
    const totalSum = getSumFromEntries({
      entries: this.getEntriesToSum(filteredDatedEntries),
    });
    const selectedEntriesSum = formatNumberForDisplay(totalSum);
    // A zero total stays neutral — green would misread as "money in".
    const toneClass =
      totalSum < 0
        ? "tile-tone--expense"
        : totalSum > 0
          ? "tile-tone--income"
          : "";
    // Net filtered total across BOTH lists (regardless of the "Show" select):
    // filtered incomes minus filtered expenses, signed, green/rose by sign.
    const netSum = getSumFromEntries({
      entries: [
        ...filteredDatedEntries[ENTRY_TYPES_PLURAL.INCOMES],
        ...filteredDatedEntries[ENTRY_TYPES_PLURAL.EXPENSES],
      ],
    });
    const netDisplayValue =
      netSum > 0
        ? `+${formatNumberForDisplay(netSum)}`
        : formatNumberForDisplay(netSum);
    const netTone =
      netSum > 0
        ? ENTRY_TYPES_SINGULAR.INCOME
        : netSum < 0
          ? ENTRY_TYPES_SINGULAR.EXPENSE
          : "net";
    // One filter drives both lists, so the category picker offers both kinds.
    const categoryOptions = [
      ...getEntryCategoryOption(ENTRY_TYPES_SINGULAR.INCOME),
      ...getEntryCategoryOption(
        ENTRY_TYPES_SINGULAR.EXPENSE,
        this.props.buckets,
        this.props.unbudgetedCategories
      ),
    ];
    return (
      <MainContentContainer
        className="summary-container"
        pageTitle="Monthly Summary"
      >
        <Container fluid className="top-content">
          {!isFiltered && (
            <ContentTileSection
              title="Summary"
              className={toneClass}
              label={`${capitalize(getMonthNameDisplay(this.props.selectedDate.month))} total`}
              value={selectedEntriesSum}
            />
          )}
          {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
          <EntryListToolbar
            entryFilters={entryFilters}
            activeFilterCount={activeFilterCount}
            isFilterSheetOpen={this.state.isFilterSheetOpen}
            onFiltersChange={this.props.onFiltersChange}
            onOpenFilters={this.openFilterSheet}
            filtersButtonRef={this.filtersButtonRef}
          />
          <FilterSheet
            isOpen={this.state.isFilterSheetOpen}
            resultCount={shownCount}
            entryFilters={entryFilters}
            categoryOptions={categoryOptions}
            name="entries"
            onFiltersChange={this.props.onFiltersChange}
            onClearAll={this.props.onClearFilters}
            onClose={this.closeFilterSheet}
          />
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
          {/* Per the approved mock the banner sits BETWEEN the toolbar/panel
              and the matching rows; the toolbar stays on top while filtered. */}
          {isFiltered && (
            <FilteredBanner
              title="Filtered view · both lists"
              descriptors={descriptors}
              counts={{ shown: shownCount, total: totalCount }}
              totalLabel="Filtered total · net"
              totalValue={netDisplayValue}
              tone={netTone}
              onRemoveFilter={this.handleRemoveFilter}
              onClearAll={this.props.onClearFilters}
            />
          )}
          {isFiltered && shownCount === 0 ? (
            <FilterEmptyState onClearAll={this.props.onClearFilters} />
          ) : (
            <React.Fragment>
              {!this.state.filter && (
                <ChartContainerRowWrapper>
                  <SummaryChart {...chartProps} />
                </ChartContainerRowWrapper>
              )}
              {selectedEntries}
            </React.Fragment>
          )}
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

const mapStateToProps = (state) => ({
  entryFilters: state.expensesManager.entryFilters,
  buckets: state.expensesManager.buckets,
  unbudgetedCategories: state.expensesManager.unbudgetedCategories,
});

const mapActionsToProps = (dispatch) => ({
  onFiltersChange: (partialFilters) => dispatch(setEntryFilters(partialFilters)),
  onClearFilters: () => dispatch(clearEntryFilters()),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(withRouter(Summary));
