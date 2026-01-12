import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function RootLayoutNav() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isLoginPage = segments[0] === 'login';
    const isSetupPage = segments[0] === 'setup-users';

    if (!session && inAuthGroup) {
      router.replace('/login');
    } else if (session && (isLoginPage || isSetupPage)) {
      const roleRoute = getRoleRoute(profile?.role);
      router.replace(roleRoute);
    }
  }, [session, loading, segments, profile]);

  const getRoleRoute = (role: string | undefined) => {
    switch (role) {
      case 'krani_panen':
        return '/(tabs)';
      case 'krani_buah':
        return '/(tabs)/krani-buah';
      case 'mandor':
        return '/(tabs)/mandor';
      case 'asisten':
        return '/(tabs)/asisten';
      case 'estate_manager':
        return '/(tabs)/estate';
      case 'regional_gm':
        return '/(tabs)/regional';
      default:
        return '/(tabs)';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d5016" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="setup-users" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="input-panen" />
        <Stack.Screen name="report-detail" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
