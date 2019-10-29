import { CAST_HOLA } from '../actions/index';

export default (state = 'HOLA FROM STATE', action) => {
  //console.log(action)
  // console.log(CAST_HOLA)
  switch (action.type) {
    case CAST_HOLA:
      return action.greeting;
    default:
      return 'HOLA';
  }
}
