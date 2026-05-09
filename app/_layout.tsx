import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

// Load Geist font on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://fonts.googleapis.com';
  document.head.appendChild(link);
  const link2 = document.createElement('link');
  link2.rel = 'stylesheet';
  link2.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap';
  document.head.appendChild(link2);
  const style = document.createElement('style');
  style.textContent = `*, *::before, *::after { font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important; }`;
  document.head.appendChild(style);
}

const queryClient = new QueryClient();

function AuthGate() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      if (!profile?.ime) {
        router.replace('/(auth)/onboarding/1');
      } else {
        router.replace('/(tabs)');
      }
    } else if (session && !inAuthGroup && profile && !profile.ime) {
      router.replace('/(auth)/onboarding/1');
    }
  }, [session, loading, profile, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#050505' } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="ride/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="ride/active/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="chat/[userId]" options={{ presentation: 'card' }} />
          <Stack.Screen name="profile/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="my-rides" options={{ presentation: 'card' }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
          <Stack.Screen name="verification" options={{ presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
