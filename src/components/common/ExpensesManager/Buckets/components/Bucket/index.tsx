import React from "react";
import { Row, Col } from "react-bootstrap";
import "./styles.scss";
import { formatNumberForDisplay } from "../../../../../../helpers/entriesHelper/entriesHelper";
import RowLink from "../../../../RowLink";

const Bucket = ({
  category,
  allowance,
  carryOver,
  availability,
  spending,
  consuptionPercentage,
}) => {
  const colorMapClass = {
    warning: consuptionPercentage >= 65,
    danger: consuptionPercentage > 85,
  };
  const colorClass = Object.keys(colorMapClass).reduceRight(
    (selectedColor, mapKey) => {
      if (selectedColor) return selectedColor;
      const condition = colorMapClass[mapKey];
      if (condition) return mapKey;
      return selectedColor;
    },
    ""
  );

  const testId = `bucket-${category.toLowerCase().replace(/\s/g, "-")}`;

  // A negative (debt) amount is shown as "$0.00 (-$10.00)": nothing is
  // available, and the parenthesised amount makes the deficit clear. Used for
  // both the carried-over balance and the resulting availability.
  const formatWithDeficit = (value) =>
    value < 0
      ? `${formatNumberForDisplay(0)} (${formatNumberForDisplay(value)})`
      : formatNumberForDisplay(value);

  return (
    <>
      <RowLink
        to={`edit-bucket/${category.toLowerCase().replace(/\s/g, "-")}`}
        title={`Edit ${category}`}
        className="bucket-container"
        data-testid={testId}
      >
        <Col>
          <Row className="bucket-legend">
            <Col>{category}</Col>
            <Col className="rest">
              <span data-testid={`${testId}-spending`}>
                {formatNumberForDisplay(spending)}
              </span>
              {" of "}
              <span data-testid={`${testId}-availability`}>
                {formatWithDeficit(availability)}
              </span>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <progress
                value={consuptionPercentage}
                max={100}
                className={colorClass}
              />
            </Col>
          </Row>
          <Row className="bucket-carry-on">
            <Col
              xs={8}
              className="carry-on-detail"
              data-testid={`${testId}-carry-over`}
            >
              {`Allowance ${formatNumberForDisplay(allowance)} + carried ${formatWithDeficit(carryOver)}`}
            </Col>
            <Col
              xs={4}
              className="usage-percentage"
              data-testid={`${testId}-percentage`}
            >{`${consuptionPercentage}%`}</Col>
          </Row>
        </Col>
      </RowLink>
      <hr />
    </>
  );
};

export default Bucket;
