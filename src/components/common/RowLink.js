import React from 'react';
import { Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

/**
 * A custom composed implementation of bootstrap row + react router link
 */
function RowLink(props) {
  return (
    <Row as={Link} {...{ ...props, className: `${props.className}` }}>
      {props.children}
    </Row>
  )
};

export default RowLink;