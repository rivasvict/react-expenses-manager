import React from "react";
import { InlineIcon, Icon as SimpleIcon } from "@iconify/react";
import arrowDown from "@iconify-icons/codicon/arrow-small-down";
import arrowUp from "@iconify-icons/codicon/arrow-small-up";

const Icon = ({ inLine, icon }) => (
  <React.Fragment>
    {inLine ? <InlineIcon icon={icon} /> : <SimpleIcon icon={icon} />}
  </React.Fragment>
);

// Money movement: incoming (income) and outgoing (expense).
const IconMoneyIn = (props) => <Icon {...props} icon={arrowDown} />;

const IconMoneyOut = (props) => <Icon {...props} icon={arrowUp} />;

export { IconMoneyIn, IconMoneyOut };
