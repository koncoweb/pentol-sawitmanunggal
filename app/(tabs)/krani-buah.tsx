import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Truck, ClipboardCheck, AlertTriangle } from 'lucide-react-native';

export default function KraniBuahDashboard() {
  const { profile } = useAuth();

  const menuItems = [
    {
      id: '1',
      title: 'Buat SPB',
      description: 'Generate Surat Pengantar Barang',
      icon: FileText,
      color: '#2d5016',
      action: 'create-spb',
    },
    {
      id: '2',
      title: 'Data Truk',
      description: 'Input nomor polisi & driver',
      icon: Truck,
      color: '#4a7c23',
      action: 'truck-data',
    },
    {
      id: '3',
      title: 'Validasi Muatan',
      description: 'Hitung janjang per blok',
      icon: ClipboardCheck,
      color: '#6ba82e',
      action: 'validate-load',
    },
    {
      id: '4',
      title: 'Cek Restan',
      description: 'Monitoring buah tertinggal',
      icon: AlertTriangle,
      color: '#f57c00',
      action: 'check-restan',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Selamat Datang,</Text>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>Krani Buah / Transport</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>SPB Hari Ini</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Truk Terkirim</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Restan</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => console.log(item.action)}
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

      <View style={styles.alertCard}>
        <AlertTriangle size={20} color="#f57c00" />
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>Perhatian!</Text>
          <Text style={styles.alertText}>
            Pastikan semua janjang yang sudah di-approve dibuatkan SPB sebelum akhir hari untuk
            menghindari restan.
          </Text>
        </View>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#2d5016',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
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
  alertCard: {
    margin: 16,
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 32,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f57c00',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#e65100',
    lineHeight: 20,
  },
});
