import React from 'react';
import { Link } from 'react-router-dom';

const totalItemStyle = {
  padding: '20px 20px',
  border: 'solid 1px black'
};

function TotalItem({ name, ammount, url }) {
  return (
    <Link to={`${url}`}><div style={totalItemStyle}>{name}<br/>{ammount}</div></Link>
  );
}

export default TotalItem;
