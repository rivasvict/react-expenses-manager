import React from "react";
import { Link } from "react-router-dom";

function ButtonLikeLink({ className = "", to, buttonTitle, ...props }) {
  return (
    <Link
      className={`btn btn-block vertical-standard-space ${className}`}
      to={to}
      {...props}
    >
      {buttonTitle}
    </Link>
  );
}

export default ButtonLikeLink;
