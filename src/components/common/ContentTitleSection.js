import React from "react";
import { Col, Row } from "react-bootstrap";
import { Icon } from "@iconify/react";
import chevronRight from "@iconify-icons/codicon/chevron-right";
import RowLink from "./RowLink";
import "./ContentTitleSelection.scss";

const RowContent = ({ isLink, children, label, value }) => {
  // Two-tier money tile (candidate 8): a muted label and a large, tone-colored
  // value, so the number is read first and its caption second — instead of one
  // undifferentiated colored line.
  const isTotal = label !== undefined && value !== undefined;
  return (
    <Col xs={12} className={`tile-inner${isTotal ? " tile-inner--total" : ""}`}>
      {isTotal ? (
        <React.Fragment>
          <span className="tile-total__label">{label}</span>
          <span className="tile-total__value">{value}</span>
        </React.Fragment>
      ) : (
        <span className="tile-content">{children}</span>
      )}
      {isLink && (
        <Icon icon={chevronRight} className="tile-chevron" aria-hidden="true" />
      )}
    </Col>
  );
};

/**
 * A card-shaped section tile. With `to` it becomes a tappable link (chevron
 * affordance included); without it, it is a static heading card. The `title`
 * becomes the HTML title attribute (some tests locate tiles by it).
 *
 * Passing `label` + `value` renders the two-tier "total" variant (muted label
 * left, prominent tone-colored value right, on a softly tinted card); the tone
 * comes from a `tile-tone--income` / `tile-tone--expense` className, and a
 * neutral (zero) total keeps the default surface.
 *
 * `label` and `value` carry explicit `= undefined` defaults on purpose. This
 * file is untyped JS, so TypeScript infers prop optionality from whether a
 * destructured parameter has a default; without one it treats both as
 * *required*, and every `.tsx` caller rendering the plain (non-total) variant
 * fails with TS2739. The defaults are runtime-neutral — an omitted prop is
 * `undefined` either way — and `isTotal` below still tells the variants apart.
 */
const ContentTileSection = ({
  title = "",
  to,
  className = "",
  label = undefined,
  value = undefined,
  children,
}) => {
  const isTotal = label !== undefined && value !== undefined;
  const composedClassName = `content-title-selection${
    isTotal ? " content-title-selection--total" : ""
  } ${className}`.trim();
  return (
    <React.Fragment>
      {to ? (
        <RowLink title={title} to={to} className={composedClassName}>
          <RowContent isLink label={label} value={value}>
            {children}
          </RowContent>
        </RowLink>
      ) : (
        <Row title={title} className={composedClassName}>
          <RowContent label={label} value={value}>
            {children}
          </RowContent>
        </Row>
      )}
    </React.Fragment>
  );
};

export default ContentTileSection;
