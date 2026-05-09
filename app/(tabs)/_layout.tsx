import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

function OfferTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.offerIcon, focused && styles.offerIconActive]}>
      <Plus size={22} stroke={focused ? Colors.black : Colors.text} strokeWidth={2.4} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(8,8,10,0.96)',
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 12,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Početna',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} stroke={color} strokeWidth={focused ? 2.2 : 1.7} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Pretraga',
          tabBarIcon: ({ color, focused }) => (
            <Search size={22} stroke={color} strokeWidth={focused ? 2.2 : 1.7} />
          ),
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: 'Ponudi',
          tabBarIcon: ({ focused }) => <OfferTabIcon focused={focused} />,
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.gray400,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Poruke',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle size={22} stroke={color} strokeWidth={focused ? 2.2 : 1.7} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} stroke={color} strokeWidth={focused ? 2.2 : 1.7} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  offerIcon: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: Colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  offerIconActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
