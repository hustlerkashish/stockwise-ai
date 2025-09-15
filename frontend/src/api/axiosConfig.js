// /frontend/src/api/axiosConfig.js

import axios from 'axios';
import { auth } from './firebase';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000',
});

// This automatically adds the user's ID token to every request
apiClient.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;