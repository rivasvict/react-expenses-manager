export const IS_FETCHING = "IS_FETCHING";
export const FAILED_FETCH = "FAILED_FETCH";

export const IsFetching = () => (isFetching) => ({
  type: IS_FETCHING,
  payload: isFetching,
});

export const FailedFetch = () => (hasFailed) => ({
  type: FAILED_FETCH,
  payload: hasFailed,
});

export const ActionCreators = () => ({
  failedFetch: FailedFetch(),
  isFetching: IsFetching(),
});
