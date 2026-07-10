import React from "react";
import { Col, Row } from "react-bootstrap";
import { Icon } from "@iconify/react";
import chevronRight from "@iconify-icons/codicon/chevron-right";
import RowLink from "./RowLink";
import "./ContentTitleSelection.scss";

const RowContent = ({ eyebrow, isLink, children }) => (
  <Col xs={12} className="tile-inner">
    <div className="tile-text">
      {eyebrow && <span className="tile-eyebrow">{eyebrow}</span>}
      <span className="tile-content">{children}</span>
    </div>
    {isLink && (
      <Icon icon={chevronRight} className="tile-chevron" aria-hidden="true" />
    )}
  </Col>
);

/**
 * A card-shaped section tile. With `to` it becomes a tappable link (chevron
 * affordance included); without it, it is a static heading card. The `title`
 * doubles as the small eyebrow label and the HTML title attribute.
 */
const ContentTileSection = ({ title = "", to, className = "", children }) => (
  <React.Fragment>
    {to ? (
      <RowLink
        title={title}
        to={to}
        className={`content-title-selection ${className}`}
      >
        <RowContent eyebrow={title} isLink>
          {children}
        </RowContent>
      </RowLink>
    ) : (
      <Row title={title} className={`content-title-selection ${className}`}>
        <RowContent eyebrow={title}>{children}</RowContent>
      </Row>
    )}
  </React.Fragment>
);

export default ContentTileSection;
