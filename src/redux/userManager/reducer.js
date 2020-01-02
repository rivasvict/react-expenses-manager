import { HAS_ERRORED, HAS_USER_BEEN_CREATED, CREATE_USER_LOADING } from "../actions";
const defaultState = { user: {}, validationErrors: { validation: []}, isLoading: false }

export const reducer = (state = defaultState, action) => {
  const { type, payload } = action;
  switch (type) {
    case HAS_ERRORED: return {
      ...state,
      validationErrors: payload
    };
    case HAS_USER_BEEN_CREATED: return {
      ...state,
      user: payload.user
    };
    case CREATE_USER_LOADING: return {
      ...state,
      isLoading: payload.isLoading
    };
    default: return state;
  }
}