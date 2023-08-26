import axios from "axios";
import mockAdapter from "axios-mock-adapter";
import { config } from "../config";

const instance = axios.create();
const mock = new mockAdapter(instance);
const baseUrl = config.REACT_APP_API_HOST;

interface User {
  id: number;
  email: string;
  password: string;
}

const getUsers = (): User[] => {
  const users = localStorage.getItem("users");
  return users ? JSON.parse(users) : [];
};

mock.onGet(`${baseUrl}/api/user/login`).reply((config) => {
  const { body } = config;
  const { user: localUser } = JSON.parse(body);
  const { username: email, password } = localUser;
  const users = getUsers();
  const user = users.find(
    (mockedUser: User) => mockedUser.user.email === email && mockedUser.user.password === password
  );
  if (user) {
    const token = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    document.cookie = `token=${token};path=/;HttpOnly`;
    /** TODO: Look for the way to make this response compatible with what is expected */
    return [200, user.user];
  } else {
    return [401, { message: "Invalid email or passwords" }];
  }
});

const saveUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem("users", JSON.stringify(users));
};

mock.onPost(`${baseUrl}/api/user/sign-up`).reply((config) => {
  const newUser: User = JSON.parse(config.data);
  const users = getUsers();
  if (users.find((mockedUser: User) => mockedUser.email === newUser.email)) {
    return [409, { message: "User already exists with this email" }];
  }
  saveUser(newUser);
  return [201, { message: "User created successfully" }];
});

export const req = instance;