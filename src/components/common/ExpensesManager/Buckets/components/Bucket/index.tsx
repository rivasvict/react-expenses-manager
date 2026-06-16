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
  remainder,
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
              {" of "}
              <span data-testid={`${testId}-availability`}>
                {formatNumberForDisplay(availability)}
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
          <Row>
            <Col
              xs={12}
              className="usage-percentage"
            >{`${consuptionPercentage}%`}</Col>
          </Row>
          <Row className="bucket-carry-on">
            <Col
              xs={6}
              className="carry-on-detail"
              data-testid={`${testId}-carry-over`}
            >
              {`Allowance ${formatNumberForDisplay(allowance)} + carried ${formatNumberForDisplay(carryOver)}`}
            </Col>
            <Col
              xs={6}
              className="carry-on-detail remaining"
              data-testid={`${testId}-remaining`}
            >
              {`Remaining: ${formatNumberForDisplay(remainder)}`}
            </Col>
          </Row>
        </Col>
      </RowLink>
      <hr />
    </>
  );
};

export default Bucket;
