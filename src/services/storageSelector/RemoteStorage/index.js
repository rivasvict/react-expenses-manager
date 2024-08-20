import { config } from "../../../config";
import { postConfigAuthenticated } from "../../../helpers/general";
const baseUrl = config.REACT_APP_API_HOST

const HttpStorage = () => ({
  getBalance: async () => {
    try {
      const url = `${baseUrl}/api/balance`;
      const rawResponse = await fetch(url, {
        credentials: 'include'
      });
      return await rawResponse.json();
    } catch (error) {
      console.log(error);
    }
  }, 
  setRecord: async (entry) => {
    try {
      const url = `${baseUrl}/api/balance`;
      const body = JSON.stringify(entry);
      await fetch(url, { body, ...postConfigAuthenticated });
    } catch (error) {
      console.log(error);
    }
  }
});

export default HttpStorage;
