import { createAuthClient } from "better-auth/react";
import * as SecureStore from 'expo-secure-store';

const authUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL;

if (!authUrl) {
    console.warn("EXPO_PUBLIC_NEON_AUTH_URL is not defined in environment variables.");
}

export const authClient = createAuthClient({
    baseURL: authUrl || "http://localhost:3000", // Fallback to localhost to prevent crash, but will fail network requests
    storage: {
        get: async (key: string) => await SecureStore.getItemAsync(key),
        set: async (key: string, value: string) => await SecureStore.setItemAsync(key, value),
        delete: async (key: string) => await SecureStore.deleteItemAsync(key),
    },
    fetchOptions: {
        headers: {
            Origin: "https://pentol.sawitmanunggal.com"
        }
    }
});
