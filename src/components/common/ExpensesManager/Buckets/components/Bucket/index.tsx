// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import { Row, Col } from "react-bootstrap";
import "./styles.scss";
import { formatNumberForDisplay } from "../../../../../../helpers/entriesHelper/entriesHelper";
import RowLink from "../../../../RowLink";
import { useTranslation } from "../../../../../../i18n";

const Bucket = ({
  category,
  allowance,
  carryOver,
  spending,
  remainder,
  consuptionPercentage,
}) => {
  const { t } = useTranslation();
  const colorClass =
    consuptionPercentage > 85
      ? "danger"
      : consuptionPercentage >= 65
        ? "warning"
        : "";

  const testId = `bucket-${category.toLowerCase().replace(/\s/g, "-")}`;

  // A carried-over debt is shown as "$0.00 (-$10.00)": nothing is available
  // from previous months, and the parenthesised amount makes the deficit clear.
  const formatCarried = (value) =>
    value < 0
      ? `${formatNumberForDisplay(0)} (${formatNumberForDisplay(value)})`
      : formatNumberForDisplay(value);

  return (
    <RowLink
      to={`edit-bucket/${category.toLowerCase().replace(/\s/g, "-")}`}
      title={t("bucket.edit", { category })}
      aria-label={t("bucket.edit", { category })}
      className="bucket-container"
      data-testid={testId}
    >
      <Col>
        <Row className="bucket-legend">
          <Col className="bucket-name">{category}</Col>
          <Col
            className={`usage-percentage ${colorClass}`}
            data-testid={`${testId}-percentage`}
          >{`${consuptionPercentage}%`}</Col>
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
        <Row className="bucket-figures">
          <Col data-testid={`${testId}-spending`}>
            {t("bucket.spent", { amount: formatNumberForDisplay(spending) })}
          </Col>
          <Col className="rest" data-testid={`${testId}-remaining`}>
            {t("bucket.remaining", {
              amount: formatNumberForDisplay(remainder),
            })}
          </Col>
        </Row>
        <Row className="bucket-carry-on">
          <Col xs={12} data-testid={`${testId}-carry-over`}>
            {t("bucket.carryOver", {
              allowance: formatNumberForDisplay(allowance),
              carried: formatCarried(carryOver),
            })}
          </Col>
        </Row>
      </Col>
    </RowLink>
  );
};

export default Bucket;
