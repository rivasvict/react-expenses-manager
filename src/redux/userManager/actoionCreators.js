import { history } from '../../helpers/history';
import { ActionCreators } from './actions';

export const { createUser, userCreationFail, userCreationLoading, logIn } = ActionCreators(history);