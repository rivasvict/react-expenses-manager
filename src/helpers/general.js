function calculateTotal(...numbersToSum) {
  return numbersToSum.reduce((accumulated, currentNumber) => {
    accumulated = parseInt(accumulated) + parseInt(currentNumber);
    return accumulated;
  }, 0) || 0;
}

function isUserLoggedIn () {
  return sessionStorage.getItem('user');
};

function setObjectToSessionStorage(objectToSet) {
  const receivedType = typeof objectToSet;
  if (receivedType === 'object') {
    for(const key in objectToSet) {
      sessionStorage.setItem(key, objectToSet[key]);
    }
  } else {
    throw new Error(`setObjectToSessionStorage: MUST receive an object, it received ${receivedType} instead, please make sure to send an object to setObjectToSessionStorage function as a parameter`);
  }
}

export {
  calculateTotal,
  isUserLoggedIn,
  setObjectToSessionStorage
};