import React from 'react';
import { InlineIcon } from '@iconify/react';
import signOut from '@iconify-icons/codicon/sign-out';
import signIn from '@iconify-icons/codicon/sign-in';

const Icon = ({ inLine, icon }) => (
  <React.Fragment>
    {
      inLine ?
        <InlineIcon icon={icon} /> :
        <Icon icon={icon} />
    }
  </React.Fragment>
);

const IconSignOut = (props) => (
  <Icon {...props} icon={signOut} />
);

const IconSignIn = (props) => (
  <Icon {...props} icon={signIn} />
);

export { IconSignOut, IconSignIn };