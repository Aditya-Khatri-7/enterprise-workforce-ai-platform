import axios from 'axios';

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const baseURL = `http://${hostname}:3000/api`;

const publicApi = axios.create({ baseURL });

export default publicApi;
