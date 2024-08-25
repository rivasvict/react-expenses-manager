import React from "react";
import { Link } from "react-router-dom";

function ButtonLikeLink({ className = "", to, buttonTitle }) {
  return (
    <Link
      className={`btn btn-block vertical-standard-space ${className}`}
      to={to}
    >
      {buttonTitle}
    </Link>
  );
}

export default ButtonLikeLink;
