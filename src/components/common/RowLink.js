import React from 'react';
import { Link } from 'react-router-dom';

function RowLink(props) {
  return (
    <Link {...{ ...props, className: `${props.className} row` }}>
      {props.children}
    </Link>
  )
};

export default RowLink;