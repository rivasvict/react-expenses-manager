import React from 'react';

const addLinkStyle = {
  cursor: 'pointer',
  border: 0,
  padding: 0
};

function AddLink(props) {
  return (
    <button style={addLinkStyle}>{props.children}</button>
  );
}

export default AddLink;
