import { CREATE_USER_ERROR, CREATE_USER_SUCCESS, CREATE_USER_LOADING } from "./actions";
const defaultState = { user: {}, validationErrors: { validation: []}, isLoading: false }

export const reducer = (state = defaultState, action) => {
  const { type, payload } = action;
  switch (type) {
    case CREATE_USER_ERROR: return {
      ...state,
      validationErrors: payload
    };
    case CREATE_USER_SUCCESS: return {
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