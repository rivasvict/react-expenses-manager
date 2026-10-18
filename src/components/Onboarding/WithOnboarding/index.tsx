import React, { useState } from "react";
import { Redirect, useLocation } from "react-router-dom";
import {
  isNewUser,
  ONBOARDING_ROUTE,
} from "../../../onboarding/onboardingStatus";
import Onboarding from "..";

/**
 * Sends a new user to the first-run wizard and nobody else. Whether the user is
 * new is read once, on the first render, before the app's own loading writes
 * its default data; after the wizard ends the user goes to the dashboard and
 * `/welcome` is not reachable again.
 */
const WithOnboarding = ({ children }: { children: React.ReactNode }) => {
  const [active, setActive] = useState(isNewUser);
  const { pathname } = useLocation();
  const onWizardRoute = pathname === ONBOARDING_ROUTE;

  if (active) {
    return onWizardRoute ? (
      <Onboarding onDone={() => setActive(false)} />
    ) : (
      <Redirect to={ONBOARDING_ROUTE} />
    );
  }

  return onWizardRoute ? <Redirect to="/" /> : <>{children}</>;
};

export default WithOnboarding;
