import React from 'react';

const totalItemStyle = {
  padding: '20px 20px',
  border: 'solid 1px black'
};

function TotalItem({ name, ammount }) {
  return (
    <div style={totalItemStyle}>{name}<br/>{ammount}</div>
  );
}

export default TotalItem;
