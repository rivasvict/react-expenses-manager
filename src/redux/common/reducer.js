import { IS_FETCHING } from "./actions";
const initialState = { isFetching: true };

export const reducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case IS_FETCHING:
      return { ...state, isFetching: payload };
    default:
      return state;
  }
};
