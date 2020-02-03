function calculateTotal(...numbersToSum) {
  return numbersToSum.reduce((accumulated, currentNumber) => {
    accumulated = parseInt(accumulated) + parseInt(currentNumber);
    return accumulated;
  }, 0) || 0;
}

function isUserLoggedIn () {
  return localStorage.getItem('user');
};

export {
  calculateTotal,
  isUserLoggedIn
};