import { CREATE_USER_ERROR, CREATE_USER_SUCCESS, SET_APP_LOADING, USER_LOG_IN_ERROR, USER_LOG_IN_SUCCESS, SET_USER_LOADING } from "./actions";
const defaultState = {
  user: {
    email: null,
    firstName: null,
    lastName: null,
    isLoading: true
  },
  token: null,
  validationErrors: {
    validation: []
  },
  isLoading: false,
  error: null,
  userCreated: false
}

const handleError = (error, state) => {
  if (error && error.name === 'ValidationError') {
    return {
      ...state,
      validationErrors: {
        validation: error.validation
      }
    }
  }

  console.error(error);
  return {
    ...state,
    error
  }
};

export const reducer = (state = defaultState, action) => {
  const { type, payload } = action;

  switch (type) {
    case CREATE_USER_ERROR: return handleError(payload, state);
    case CREATE_USER_SUCCESS: return {
      ...state,
      userCreated: payload
    };
    case SET_USER_LOADING: return {
      ...state,
      user: {
        ...state.user,
        isLoading: payload.isUserLoading
      }
    }
    //TODO: REVISIT USER_LOG_IN REDUCERS
    case USER_LOG_IN_ERROR: return handleError(payload, state);
    case USER_LOG_IN_SUCCESS: return {
      ...state,
      user: {
        ...state.user,
        ...payload
      }
    }
    case SET_APP_LOADING: return {
      ...state,
      isLoading: payload.isLoading
    };
    default: return state;
  }
}