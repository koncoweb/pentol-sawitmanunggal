import { Tabs, useRouter } from 'expo-router';
import { Home, FileText, CheckSquare, BarChart3, Building2, MapPin } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const getTabsForRole = () => {
    switch (profile?.role) {
      case 'krani_panen':
        return ['index', 'profile'];
      case 'krani_buah':
        return ['krani-buah', 'profile'];
      case 'mandor':
        return ['mandor', 'approval', 'profile'];
      case 'asisten':
        return ['asisten', 'monitoring', 'profile'];
      case 'estate_manager':
        return ['estate', 'reports', 'monitoring', 'profile'];
      case 'regional_gm':
        return ['regional', 'reports', 'analytics', 'profile'];
      default:
        return ['index', 'profile'];
    }
  };

  const visibleTabs = getTabsForRole();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2d5016',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#2d5016',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Keluar</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard Krani Panen',
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          href: visibleTabs.includes('index') ? '/(tabs)' : null,
        }}
      />
      <Tabs.Screen
        name="krani-buah"
        options={{
          title: 'Dashboard Krani Buah',
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ size, color }) => <FileText size={size} color={color} />,
          href: visibleTabs.includes('krani-buah') ? '/(tabs)/krani-buah' : null,
        }}
      />
      <Tabs.Screen
        name="mandor"
        options={{
          title: 'Dashboard Mandor',
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          href: visibleTabs.includes('mandor') ? '/(tabs)/mandor' : null,
        }}
      />
      <Tabs.Screen
        name="approval"
        options={{
          title: 'Approval',
          tabBarLabel: 'Approval',
          tabBarIcon: ({ size, color }) => <CheckSquare size={size} color={color} />,
          href: visibleTabs.includes('approval') ? '/(tabs)/approval' : null,
        }}
      />
      <Tabs.Screen
        name="asisten"
        options={{
          title: 'Dashboard Asisten',
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
          href: visibleTabs.includes('asisten') ? '/(tabs)/asisten' : null,
        }}
      />
      <Tabs.Screen
        name="estate"
        options={{
          title: 'Dashboard Estate Manager',
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ size, color }) => <Building2 size={size} color={color} />,
          href: visibleTabs.includes('estate') ? '/(tabs)/estate' : null,
        }}
      />
      <Tabs.Screen
        name="regional"
        options={{
          title: 'Dashboard Regional',
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ size, color }) => <MapPin size={size} color={color} />,
          href: visibleTabs.includes('regional') ? '/(tabs)/regional' : null,
        }}
      />
      <Tabs.Screen
        name="monitoring"
        options={{
          title: 'Monitoring',
          tabBarLabel: 'Monitoring',
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
          href: visibleTabs.includes('monitoring') ? '/(tabs)/monitoring' : null,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Laporan',
          tabBarLabel: 'Laporan',
          tabBarIcon: ({ size, color }) => <FileText size={size} color={color} />,
          href: visibleTabs.includes('reports') ? '/(tabs)/reports' : null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
          href: visibleTabs.includes('analytics') ? '/(tabs)/analytics' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          href: visibleTabs.includes('profile') ? '/(tabs)/profile' : null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
