import React from 'react';
import { Link } from 'react-router-dom';

/**
 * A custom composed implementation of bootstrap row + react router link
 */
function RowLink(props) {
  return (
    <Link {...{ ...props, className: `${props.className} row` }}>
      {props.children}
    </Link>
  )
};

export default RowLink;