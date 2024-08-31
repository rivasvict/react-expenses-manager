import React, { Component, useEffect, useRef } from "react";
import EntriesSummary from "../EntriesSummary";
import CategorySelector from "../../CategorySelector";
import { connect } from "react-redux";
import { categoryChange } from "../../../../../redux/expensesManager/actionCreators";
import {
  formatNumberForDisplay,
  getEntryCategoryOption,
  getSumFromEntries,
} from "../../../../../helpers/entriesHelper/entriesHelper";
import { MainContentContainer } from "../../../MainContentContainer";
import ContentTileSection from "../../../ContentTitleSection";
import { IconRemote } from "../../../Icons";
import { capitalize } from "lodash";
import "./styles.scss";
import { Col, Row } from "react-bootstrap";
import { Chart } from "chart.js";

const DoughnutChart = ({ chartLabel, data }) => {
  const { labels, chartData } = data;
  const chartRef = useRef(null);
  useEffect(() => {
    if (chartRef.current) {
      const chart = new Chart(chartRef.current, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              label: chartLabel,
              data: chartData,
              hoverOffset: 4,
              backgroundColor: [
                "rgb(240 185 11)", // Yellowish
                "rgb(112 122 138)", // Grayish-blue
                "rgb(135, 60, 95)", // A reddish-pink color
                "rgb(30, 150, 190)", // A light blue color
                "rgb(60, 180, 75)", // A green color
                "rgb(255, 105, 180)", // Hot pink
                "rgb(190, 75, 220)", // Purple
                "rgb(255, 140, 0)", // Dark orange
                "rgb(0, 128, 128)", // Teal
                "rgb(75, 0, 130)", // Indigo
                "rgb(255, 69, 0)", // Red-orange
                "rgb(0, 255, 127)", // Spring green
                "rgb(0, 100, 0)", // Dark green
                "rgb(255, 20, 147)", // Deep pink
                "rgb(64, 224, 208)", // Turquoise
              ],
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: true,
              labels: {
                color: "white",
              },
            },
          },
        },
      });
      return () => {
        chart.destroy();
      };
    }
  }, [labels, chartData, chartLabel]);

  return <canvas ref={chartRef} />;
};

const EntriesSummaryChart = ({ data }) => {
  const summarizedEntriesByCategory = data.reduce(
    (summarizedEntries, entry) => {
      return {
        ...summarizedEntries,
        [entry.categories_path]: summarizedEntries[entry.categories_path]
          ? summarizedEntries[entry.categories_path] + parseFloat(entry.amount)
          : parseFloat(entry.amount),
      };
    },
    {}
  );
  const labels = Object.keys(summarizedEntriesByCategory);
  const chartData = Object.values(summarizedEntriesByCategory);
  return (
    <DoughnutChart
      chartLabel="entry"
      data={{
        labels: labels.map((label) => capitalize(label.split(",")[1])),
        chartData,
      }}
    />
  );
};

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

  getFilteredEntriesByCategory = ({ category, entryNamePlural }) => {
    const selectedYear = this.selectedDate.year;
    const selectedMonth = this.selectedDate.month;
    const entries =
      this?.props?.entries?.[selectedYear]?.[selectedMonth]?.[entryNamePlural];
    return category.length
      ? entries.filter((entry) => entry.categories_path.match(category))
      : entries || [];
  };

  render() {
    const categoryOptions = getEntryCategoryOption(this.props.entryType);
    const entryNamePlural = `${this.props.entryType}s`;
    const name = entryNamePlural;
    const entriesByCategory = this.getFilteredEntriesByCategory({
      category: this.props.category,
      entryNamePlural,
    });
    const totalSum = getSumFromEntries(entriesByCategory);
    return (
      <MainContentContainer className="entry-summary-with-filter">
        <ContentTileSection title="Summary">
          {`${capitalize(entryNamePlural)} `}
          <IconRemote inLine={true} />
          {` ${formatNumberForDisplay(totalSum)}`}
        </ContentTileSection>
        {/* TODO: Add the selectedDate display here for letting the user know which year and month he is looking or working at */}
        <CategorySelector
          name="category"
          value={this.props.category}
          handleChange={this.handleChange.bind(this)}
          categoryOptions={categoryOptions}
          className="category-select"
        />
        <Row className="chart-container">
          <Col xs={6}>
            <EntriesSummaryChart data={entriesByCategory} />
          </Col>
        </Row>
        <EntriesSummary entries={entriesByCategory} name={name} />
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
)(EntrySummaryWithFilter);
