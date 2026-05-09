import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export function usePushNotifications() {
  const { user } = useAuthStore();
  const registered = useRef(false);

  useEffect(() => {
    if (!user || registered.current || Platform.OS === 'web') return;
    registered.current = true;

    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        await supabase
          .from('profiles')
          .update({ expo_push_token: token })
          .eq('id', user.id);

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      } catch {
        // Push notifications not available in this environment
      }
    })();
  }, [user]);
}
