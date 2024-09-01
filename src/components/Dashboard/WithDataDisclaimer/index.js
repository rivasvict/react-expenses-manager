import React, { useState } from "react";
import DataDisclaimerModal from "./components/DataDisclaimer";
import everShowDataDisclaimerStorage from "./utils/everShowDataDisclaimerStorage";

const WithDataDisclaimer = ({ children }) => {
  const everShowDataDisclaimer = everShowDataDisclaimerStorage.get();

  const [showDataDisclaimer, setShowDataDisclaimer] = useState(
    everShowDataDisclaimer
  );

  const hideDataDisclaimer = ({ everShowDataDisclaimer }) => {
    everShowDataDisclaimerStorage.set(everShowDataDisclaimer);
    setShowDataDisclaimer(false);
  };

  return (
    <>
      <DataDisclaimerModal
        show={showDataDisclaimer}
        onHide={hideDataDisclaimer}
      />
      {children}
    </>
  );
};

export default WithDataDisclaimer;
