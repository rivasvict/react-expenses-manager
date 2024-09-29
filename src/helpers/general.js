function calculateTotal(...numbersToSum) {
  return (
    numbersToSum.reduce((accumulated, currentNumber) => {
      accumulated = parseFloat(accumulated) + parseFloat(currentNumber);
      return accumulated;
    }, 0) || 0
  );
}

function setObjectToSessionStorage(objectToSet) {
  const receivedType = typeof objectToSet;
  if (receivedType === "object") {
    for (const key in objectToSet) {
      sessionStorage.setItem(key, objectToSet[key]);
    }
  } else {
    throw new Error(
      `setObjectToSessionStorage: MUST receive an object, it received ${receivedType} instead, please make sure to send an object to setObjectToSessionStorage function as a parameter`
    );
  }
}

const postConfig = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

const postConfigAuthenticated = {
  ...postConfig,
  credentials: "include",
};

/**
 * Just a function that adds the viewport for mobile devices that considers
 * only the visible part. Thus avoiding cut of elements in mobile devices below
 * the browser bars.
 *
 * Use in conjunction with `height: calc(var(--vh, 1vh) * 100);` setting in css
 * Credit to: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
 */
const addViewHeightMobileConfig = () => {
  // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
  let vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

export {
  calculateTotal,
  setObjectToSessionStorage,
  postConfig,
  postConfigAuthenticated,
  addViewHeightMobileConfig,
};
