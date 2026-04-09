import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { User, MapPin, Building2, Info, LogOut, Database } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      krani_panen: t('roles.kraniPanen'),
      krani_buah: t('roles.kraniBuah'),
      mandor: t('roles.mandor'),
      asisten: t('roles.asisten'),
      senior_asisten: t('roles.seniorAsisten'),
      estate_manager: t('roles.estateManager'),
      regional_gm: t('roles.regionalGm'),
      administrator: t('roles.administrator'),
    };
    return roleMap[role] || role;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          {profile?.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={styles.avatarImage} />
          ) : (
            <User size={40} color="#fff" />
          )}
        </View>
        <Text style={styles.userName}>{profile?.full_name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleName(profile?.role || '')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('common.accountInfo')}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <User size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('auth.email')}</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Building2 size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('common.division')}</Text>
              <Text style={styles.infoValue}>
                {profile?.divisi_id ? t('common.registered') : t('common.notRegistered')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <MapPin size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('common.gang')}</Text>
              <Text style={styles.infoValue}>
                {profile?.gang_id ? t('common.registered') : t('common.none')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('common.settings')}</Text>
        <View style={styles.infoCard}>
          <LanguageSelector />
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.infoRow}
            onPress={() => router.push('/sync-master')}
          >
            <View style={styles.infoIcon}>
              <Database size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Data Offline</Text>
              <Text style={styles.infoValue}>Sinkronisasi Data Master</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('common.aboutApp')}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Info size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('common.appVersion')}</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Building2 size={20} color="#2d5016" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('common.appName')}</Text>
              <Text style={styles.infoValue}>HMS - AEP Nusantara Plantations</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#d32f2f" />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
