import React, { Component } from "react";
import CategorySelector from "../../CategorySelector";
import { connect } from "react-redux";
import { setEntryFilters } from "../../../../../redux/expensesManager/actionCreators";
import {
  formatNumberForDisplay,
  getEntryCategoryOption,
  getFilteredEntriesByCategory,
  getSumFromEntries,
} from "../../../../../helpers/entriesHelper/entriesHelper";
import {
  filterEntries,
  sortEntries,
} from "../../../../../helpers/entriesHelper/filterSortHelper";
import { MainContentContainer } from "../../../MainContentContainer";
import ContentTileSection from "../../../ContentTitleSection";
import { capitalize } from "lodash";
import "./styles.scss";
import SummaryWithChart from "../../../SummaryWithChart";
import EntryListToolbar from "../../EntryListControls/EntryListToolbar";
import { Button, Col, Container, Row } from "react-bootstrap";
import { withRouter } from "react-router-dom";

class EntrySummaryWithFilter extends Component {
  handleCategoryChange = (event) => {
    const { value } = event.currentTarget;
    this.props.onFiltersChange({ category: value });
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
    return (
      <MainContentContainer
        className="entry-summary-with-filter"
        pageTitle="Monthly report"
      >
        <Container className="top-content" fluid>
          <ContentTileSection
            title="Summary"
            className={`tile-tone--${this.props.entryType}`}
          >
            {`${capitalize(entryTypePlural)} total: ${formatNumberForDisplay(totalSum)}`}
          </ContentTileSection>
          {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
          <EntryListToolbar
            entryFilters={entryFilters}
            onFiltersChange={this.props.onFiltersChange}
          />
          <label
            className="form-label"
            htmlFor="category-filter"
            id="category-filter-label"
          >
            Filter by category
          </label>
          <CategorySelector
            id="category-filter"
            name={entryTypePlural}
            value={entryFilters.category}
            handleChange={this.handleCategoryChange}
            categoryOptions={categoryOptions}
            className="category-select"
          />
          <SummaryWithChart
            entries={visibleEntries}
            name={name}
            entryType={this.props.entryType}
          />
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
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(withRouter(EntrySummaryWithFilter));
