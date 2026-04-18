import { createAuthClient } from "better-auth/react";
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const defaultAuthUrl = 'https://ep-morning-shadow-a1p4v4nw.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth';
const authUrlFromExtra = (Constants.expoConfig?.extra as { neonAuthUrl?: string } | undefined)?.neonAuthUrl;
const authUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL || authUrlFromExtra || defaultAuthUrl;

if (!process.env.EXPO_PUBLIC_NEON_AUTH_URL) {
    console.warn("EXPO_PUBLIC_NEON_AUTH_URL is not defined. Using fallback auth URL for mobile runtime.");
}

export const authClient = createAuthClient({
    baseURL: authUrl,
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
