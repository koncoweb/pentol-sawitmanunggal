import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, MapPin, AlertCircle, Camera } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function KraniPanenDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;

      switch (profile.role) {
        case 'krani_buah':
          router.replace('/(tabs)/krani-buah');
          break;
        case 'mandor':
          router.replace('/(tabs)/mandor');
          break;
        case 'asisten':
        case 'senior_asisten':
          router.replace('/(tabs)/asisten');
          break;
        case 'estate_manager':
          router.replace('/(tabs)/estate');
          break;
        case 'regional_gm':
          router.replace('/(tabs)/regional');
          break;
        case 'administrator':
          router.replace('/(tabs)/admin');
          break;
      }
    }, [profile, router])
  );

  const handleMenuAction = (action: string) => {
    console.log('Menu action clicked:', action);
    switch (action) {
      case 'input-panen':
        console.log('Navigating to input-panen');
        router.push('/input-panen');
        break;
      case 'foto-tph':
        // Foto TPH sementara diarahkan ke input panen atau coming soon
        Alert.alert(t('common.info'), t('dashboard.krani.featureComingSoon'));
        break;
      case 'grading':
        Alert.alert(
          t('common.info'), 
          t('dashboard.krani.gradingIntegrated'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('dashboard.krani.goToInput'), onPress: () => router.push('/input-panen') }
          ]
        );
        break;
      case 'losses':
        Alert.alert(
          t('common.info'), 
          t('dashboard.krani.lossesIntegrated'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('dashboard.krani.goToInput'), onPress: () => router.push('/input-panen') }
          ]
        );
        break;
      default:
        console.log(action);
    }
  };

  const menuItems = [
    {
      id: '1',
      title: t('dashboard.menu.inputHarvest'),
      description: t('dashboard.menu.inputHarvestDesc'),
      icon: FileText,
      color: '#2d5016',
      action: 'input-panen',
    },
    {
      id: '2',
      title: t('dashboard.menu.photoTPH'),
      description: t('dashboard.menu.photoTPHDesc'),
      icon: Camera,
      color: '#4a7c23',
      action: 'foto-tph',
    },
    {
      id: '3',
      title: t('dashboard.menu.grading'),
      description: t('dashboard.menu.gradingDesc'),
      icon: AlertCircle,
      color: '#6ba82e',
      action: 'grading',
    },
    {
      id: '4',
      title: t('dashboard.menu.losses'),
      description: t('dashboard.menu.lossesDesc'),
      icon: MapPin,
      color: '#8ac449',
      action: 'losses',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('dashboard.welcome')}</Text>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>{t('roles.kraniPanen')}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>{t('dashboard.stats.todayData')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>{t('dashboard.stats.pendingApproval')}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>{t('dashboard.mainMenu')}</Text>
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
        <Text style={styles.infoTitle}>{t('common.information')}</Text>
        <Text style={styles.infoText}>
          {t('dashboard.infoText')}
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
