import React from "react";
import "./styles.scss";

interface CategoryLocationProps {
  /** The back link, then the category picker. */
  children: React.ReactNode;
}

/**
 * The one raised card that says where the user is: the back link as a quiet
 * strip over the category picker row.
 */
const CategoryLocation = ({ children }: CategoryLocationProps) => (
  <div className="category-location">{children}</div>
);

export default CategoryLocation;
