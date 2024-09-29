import React from "react";
import { Row, Col } from "react-bootstrap";
import "./styles.scss";
import { formatNumberForDisplay } from "../../../../../../helpers/entriesHelper/entriesHelper";

const Bucket = ({
  category,
  currentValue,
  limitAmount,
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

  return (
    <>
      <Row className="bucket-container">
        <Col>
          <Row className="bucket-legend">
            <Col>{category}</Col>
            <Col className="rest">{`${formatNumberForDisplay(currentValue)} of ${formatNumberForDisplay(limitAmount)}`}</Col>
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
        </Col>
      </Row>
      <hr />
    </>
  );
};

export default Bucket;
