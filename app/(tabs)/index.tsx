import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, MapPin, AlertCircle, Camera } from 'lucide-react-native';

export default function KraniPanenDashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  const handleMenuAction = (action: string) => {
    console.log('Menu action clicked:', action);
    switch (action) {
      case 'input-panen':
        console.log('Navigating to input-panen');
        router.push('/input-panen');
        break;
      case 'foto-tph':
        console.log('Foto TPH - Coming soon');
        break;
      case 'grading':
        console.log('Grading - Coming soon');
        break;
      case 'losses':
        console.log('Losses - Coming soon');
        break;
      default:
        console.log(action);
    }
  };

  const menuItems = [
    {
      id: '1',
      title: 'Input Data Panen',
      description: 'Catat hasil panen per blok',
      icon: FileText,
      color: '#2d5016',
      action: 'input-panen',
    },
    {
      id: '2',
      title: 'Foto TPH',
      description: 'Dokumentasi TPH dengan GPS',
      icon: Camera,
      color: '#4a7c23',
      action: 'foto-tph',
    },
    {
      id: '3',
      title: 'Grading Buah',
      description: 'Klasifikasi kualitas buah',
      icon: AlertCircle,
      color: '#6ba82e',
      action: 'grading',
    },
    {
      id: '4',
      title: 'Losses Monitoring',
      description: 'Pencatatan denda lapangan',
      icon: MapPin,
      color: '#8ac449',
      action: 'losses',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Selamat Datang,</Text>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>Krani Panen</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Data Hari Ini</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Pending Approval</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => {
              console.log('TouchableOpacity pressed for:', item.action);
              handleMenuAction(item.action);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <item.icon size={24} color="#fff" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Informasi</Text>
        <Text style={styles.infoText}>
          Pastikan data panen dicatat sebelum jam kerja berakhir. Foto TPH harus diambil di
          lokasi dengan GPS aktif.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2d5016',
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#d4e5c7',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  roleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d5016',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#666',
  },
  infoCard: {
    margin: 16,
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d5016',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4a7c23',
    lineHeight: 20,
  },
});
