import React from "react";
import { Col, Row } from "react-bootstrap";
import { Icon } from "@iconify/react";
import chevronRight from "@iconify-icons/codicon/chevron-right";
import RowLink from "./RowLink";
import "./ContentTitleSelection.scss";

const RowContent = ({ isLink, children }) => (
  <Col xs={12} className="tile-inner">
    <span className="tile-content">{children}</span>
    {isLink && (
      <Icon icon={chevronRight} className="tile-chevron" aria-hidden="true" />
    )}
  </Col>
);

/**
 * A card-shaped section tile. With `to` it becomes a tappable link (chevron
 * affordance included); without it, it is a static heading card. The `title`
 * becomes the HTML title attribute (some tests locate tiles by it).
 */
const ContentTileSection = ({ title = "", to, className = "", children }) => (
  <React.Fragment>
    {to ? (
      <RowLink
        title={title}
        to={to}
        className={`content-title-selection ${className}`}
      >
        <RowContent isLink>{children}</RowContent>
      </RowLink>
    ) : (
      <Row title={title} className={`content-title-selection ${className}`}>
        <RowContent>{children}</RowContent>
      </Row>
    )}
  </React.Fragment>
);

export default ContentTileSection;
