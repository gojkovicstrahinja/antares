import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Load Geist font and global web styles
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
  style.textContent = `
    *, *::before, *::after { font-family: 'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important; }
    /* Smooth scrolling everywhere */
    * { scroll-behavior: smooth; }
    /* Pointer cursor on all interactive elements */
    [role="button"], button, [tabindex] { cursor: pointer !important; }
    /* Remove tap highlight on mobile web */
    * { -webkit-tap-highlight-color: transparent; }
    /* Smooth scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }
    /* Selection color */
    ::selection { background: rgba(25,224,122,0.25); color: #fff; }
  `;
  document.head.appendChild(style);
}

const queryClient = new QueryClient();

function AuthGate() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  usePushNotifications();

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
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#050505' }, animation: 'fade' }}>
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="ride/[id]" options={{ animation: 'fade' }} />
          <Stack.Screen name="ride/active/[id]" options={{ animation: 'fade' }} />
          <Stack.Screen name="chat/[userId]" options={{ animation: 'fade' }} />
          <Stack.Screen name="profile/[id]" options={{ animation: 'fade' }} />
          <Stack.Screen name="my-rides" options={{ animation: 'fade' }} />
          <Stack.Screen name="my-bookings" options={{ animation: 'fade' }} />
          <Stack.Screen name="rate/[rideId]" options={{ animation: 'fade' }} />
          <Stack.Screen name="edit-profile" options={{ animation: 'fade' }} />
          <Stack.Screen name="verification" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
