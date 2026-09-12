import React, { Component } from "react";
import { connect } from "react-redux";
import {
  clearEntryFilters,
  setEntryFilters,
} from "../../../../../redux/expensesManager/actionCreators";
import {
  formatNumberForDisplay,
  getEntryCategoryOption,
  getFilteredEntriesByCategory,
  getSumFromEntries,
} from "../../../../../helpers/entriesHelper/entriesHelper";
import {
  filterEntries,
  getActiveFilterDescriptors,
  getDefaultEntryFilters,
  sortEntries,
} from "../../../../../helpers/entriesHelper/filterSortHelper";
import { MainContentContainer } from "../../../MainContentContainer";
import ContentTileSection from "../../../ContentTitleSection";
import { capitalize } from "lodash";
import "./styles.scss";
import SummaryWithChart from "../../../SummaryWithChart";
import EntryListToolbar from "../../EntryListControls/EntryListToolbar";
import FilterSheet from "../../EntryListControls/FilterSheet";
import FilteredBanner from "../../EntryListControls/FilteredBanner";
import ListSectionHeader from "../../EntryListControls/ListSectionHeader";
import FilterEmptyState from "../../EntryListControls/FilterEmptyState";
import { Button, Col, Container, Row } from "react-bootstrap";
import { withRouter } from "react-router-dom";

class EntrySummaryWithFilter extends Component {
  state = { isFilterSheetOpen: false };

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

  goBack = () => {
    this?.props?.history?.goBack();
  };

  handleCancel = () => this.goBack();

  render() {
    const { entryFilters } = this.props;
    const categoryOptions = getEntryCategoryOption(
      this.props.entryType,
      this.props.buckets,
      this.props.unbudgetedCategories
    );
    const entryTypePlural = `${this.props.entryType}s`;
    const name = entryTypePlural;
    // Month extraction stays in the existing helper (category "" = no-op);
    // search/category/sort all come from the shared entryFilters state.
    const monthEntries = getFilteredEntriesByCategory({
      entries: this?.props?.entries,
      selectedDate: this.props.selectedDate,
      category: "",
      entryTypePlural: entryTypePlural,
    });
    const visibleEntries = sortEntries(
      filterEntries({
        entries: monthEntries,
        search: entryFilters.search,
        searchScope: entryFilters.searchScope,
        category: entryFilters.category,
      }),
      entryFilters.sortKey
    );
    const totalSum = getSumFromEntries({ entries: visibleEntries });
    const descriptors = getActiveFilterDescriptors({ entryFilters });
    const isFiltered = descriptors.length > 0;
    const activeFilterCount = descriptors.filter(
      (descriptor) => descriptor.key !== "search"
    ).length;
    return (
      <MainContentContainer
        className="entry-summary-with-filter"
        pageTitle="Monthly report"
      >
        <Container className="top-content" fluid>
          {!isFiltered && (
            <ContentTileSection
              title="Summary"
              className={`tile-tone--${this.props.entryType}`}
              label={`${capitalize(entryTypePlural)} total`}
              value={formatNumberForDisplay(totalSum)}
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
            resultCount={visibleEntries.length}
            entryFilters={entryFilters}
            categoryOptions={categoryOptions}
            name={entryTypePlural}
            onFiltersChange={this.props.onFiltersChange}
            onClearAll={this.props.onClearFilters}
            onClose={this.closeFilterSheet}
          />
          {/* Per the approved mock the banner sits BETWEEN the toolbar/panel
              and the matching rows (the tile it replaces is above the
              toolbar, but the filtered state keeps the toolbar on top). */}
          {isFiltered && (
            <FilteredBanner
              descriptors={descriptors}
              counts={{ shown: visibleEntries.length, total: monthEntries.length }}
              totalLabel="Filtered total"
              totalValue={formatNumberForDisplay(totalSum)}
              tone={this.props.entryType}
              onRemoveFilter={this.handleRemoveFilter}
              onClearAll={this.props.onClearFilters}
            />
          )}
          {isFiltered && visibleEntries.length === 0 ? (
            <FilterEmptyState onClearAll={this.props.onClearFilters} />
          ) : (
            <SummaryWithChart
              entries={visibleEntries}
              name={name}
              entryType={this.props.entryType}
              listHeader={
                <ListSectionHeader
                  label={
                    isFiltered
                      ? `Matching ${entryTypePlural}`
                      : capitalize(entryTypePlural)
                  }
                  count={visibleEntries.length}
                  tone={this.props.entryType}
                />
              }
            />
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
  entries: state.expensesManager.entries,
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
)(withRouter(EntrySummaryWithFilter));
