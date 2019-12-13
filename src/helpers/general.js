function calculateTotal(...numbersToSum) {
  return numbersToSum.reduce((accumulated, currentNumber) => {
    accumulated = parseInt(accumulated) + parseInt(currentNumber);
    return accumulated;
  }, 0) || 0;
}

export {
  calculateTotal
};