import { HAS_ERRORED, HAS_USER_BEEN_CREATED } from "../actions/";
const defaultState = { user: {}, hasError: false }

export const authenticationReducer = (state = defaultState, action) => {
  const { type, payload } = action;
  switch (type) {
    case HAS_ERRORED: return {
      ...state,
      hasError: true
    };
    case HAS_USER_BEEN_CREATED: return {
      ...state,
      user: payload.user
    };
    default: return state;
  }
}