import axios from "axios";

// Shared Axios instance for all external HTTP requests
export const http = axios.create({
    timeout: 15000,
    headers: {
        "Content-Type": "application/json"
    }
});

// Helper to extract error message from Axios errors
export function getErrorMessage(error) {
    if (error.response) {
        return `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    }
    if (error.request) {
        return "No response received from server";
    }
    return error.message;
}

export default http;