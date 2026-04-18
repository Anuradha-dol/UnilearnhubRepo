// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8081", // Spring Boot backend
         
  withCredentials: true, // allow cookies
});

export default api;
