export const IS_FETCHING = 'IS_FETCHING';
export const FAILED_FETCH = 'FAILED_FETCH';

export const isFetching = isFetching => ({
  type: IS_FETCHING,
  payload: isFetching
});

export const failedFetch =  hasFailed => ({
  type: FAILED_FETCH,
  payload: hasFailed
});