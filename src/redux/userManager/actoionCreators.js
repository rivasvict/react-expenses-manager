import { history } from '../../helpers/history';
import { ActionCreators } from './actions';

export const { createUser, userCreationFail, userCreationLoading } = ActionCreators(history);