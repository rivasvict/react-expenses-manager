import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import chevronLeft from "@iconify-icons/codicon/chevron-left";
import "./styles.scss";

interface BackLinkProps {
  to: string | { pathname: string; state?: unknown };
  label: string;
}

/** A gold "‹ All categories" link back to a list. */
const BackLink = ({ to, label }: BackLinkProps) => (
  <Link to={to} className="back-link">
    <Icon icon={chevronLeft} aria-hidden="true" />
    {label}
  </Link>
);

export default BackLink;
