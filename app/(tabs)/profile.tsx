import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { User, MapPin, Building2, Info, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      krani_panen: 'Krani Panen',
      krani_buah: 'Krani Buah / Transport',
      mandor: 'Mandor Panen',
      asisten: 'Asisten Divisi',
      estate_manager: 'Estate Manager',
      regional_gm: 'Regional / General Manager',
    };
    return roleMap[role] || role;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <User size={40} color="#fff" />
        </View>
        <Text style={styles.userName}>{profile?.full_name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleName(profile?.role || '')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Akun</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <User size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Building2 size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Divisi</Text>
              <Text style={styles.infoValue}>
                {profile?.divisi_id ? 'Terdaftar' : 'Belum terdaftar'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <MapPin size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gang</Text>
              <Text style={styles.infoValue}>
                {profile?.gang_id ? 'Terdaftar' : 'Tidak ada'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Info size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Versi Aplikasi</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Building2 size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nama Aplikasi</Text>
              <Text style={styles.infoValue}>Sawit Manunggal</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#d32f2f" />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    backgroundColor: '#2d5016',
    padding: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f5f5f5',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#d32f2f',
  },
});
