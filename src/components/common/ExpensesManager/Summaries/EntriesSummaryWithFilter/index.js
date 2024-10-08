import React, { Component } from "react";
import CategorySelector from "../../CategorySelector";
import { connect } from "react-redux";
import { categoryChange } from "../../../../../redux/expensesManager/actionCreators";
import {
  formatNumberForDisplay,
  getEntryCategoryOption,
  getFilteredEntriesByCategory,
  getSumFromEntries,
} from "../../../../../helpers/entriesHelper/entriesHelper";
import { MainContentContainer } from "../../../MainContentContainer";
import ContentTileSection from "../../../ContentTitleSection";
import { IconRemote } from "../../../Icons";
import { capitalize } from "lodash";
import "./styles.scss";
import SummaryWithChart from "../../../SummaryWithChart";
import { Button, Col, Container, Row } from "react-bootstrap";
import { withRouter } from "react-router-dom";

class EntrySummaryWithFilter extends Component {
  constructor(props) {
    super();

    this.onCategoryChange = props.onCategoryChange;
    this.selectedDate = props.selectedDate;
  }

  handleChange = (event) => {
    const { value } = event.currentTarget;
    this.onCategoryChange(value);
  };

  goBack = () => {
    this?.props?.history?.goBack();
  };

  handleCancel = () => this.goBack();

  render() {
    const categoryOptions = getEntryCategoryOption(this.props.entryType);
    const entryTypePlural = `${this.props.entryType}s`;
    const name = entryTypePlural;
    const entriesByCategory = getFilteredEntriesByCategory({
      entries: this?.props?.entries,
      selectedDate: this.selectedDate,
      category: this.props.category,
      entryTypePlural: entryTypePlural,
    });
    const totalSum = getSumFromEntries({ entries: entriesByCategory });
    return (
      <MainContentContainer
        className="entry-summary-with-filter"
        pageTitle="Monthly report"
      >
        <Container className="top-content" fluid>
          <ContentTileSection title="Summary">
            {`${capitalize(entryTypePlural)} `}
            <IconRemote inLine={true} />
            {` ${formatNumberForDisplay(totalSum)}`}
          </ContentTileSection>
          {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
          <CategorySelector
            name={entryTypePlural}
            value={this.props.category}
            handleChange={this.handleChange.bind(this)}
            categoryOptions={categoryOptions}
            className="category-select"
          />
          <SummaryWithChart
            entries={entriesByCategory}
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
  category: state.expensesManager.category,
  entries: state.expensesManager.entries,
});

const mapActionsToProps = (dispatch) => ({
  onCategoryChange: (event) => dispatch(categoryChange(event)),
});

export default connect(
  mapStateToProps,
  mapActionsToProps
)(withRouter(EntrySummaryWithFilter));
