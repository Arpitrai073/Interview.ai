import axios from "axios"

export const ServerUrl = "https://interview-ai-backend-j0sr.onrender.com"

// Every backend call is cookie authenticated against ServerUrl.
const api = axios.create({
    baseURL: ServerUrl,
    withCredentials: true,
})

export default api
