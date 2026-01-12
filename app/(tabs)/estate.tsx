import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, TrendingUp, Package, Users, FileText, BarChart3 } from 'lucide-react-native';

export default function EstateManagerDashboard() {
  const { profile } = useAuth();

  const summaryCards = [
    {
      label: 'Total Produksi',
      value: '0',
      unit: 'Ton',
      change: '+0%',
      color: '#2d5016',
      icon: Package,
    },
    {
      label: 'Achievement',
      value: '0%',
      unit: 'vs RKH',
      change: 'Target 95%',
      color: '#4a7c23',
      icon: TrendingUp,
    },
    {
      label: 'Total Divisi',
      value: '3',
      unit: 'Aktif',
      change: 'Estate',
      color: '#6ba82e',
      icon: Building2,
    },
    {
      label: 'Total Pekerja',
      value: '0',
      unit: 'Orang',
      change: 'Aktif Hari Ini',
      color: '#8ac449',
      icon: Users,
    },
  ];

  const divisiPerformance = [
    { name: 'Divisi A', achievement: 0, production: 0, quality: 0 },
    { name: 'Divisi B', achievement: 0, production: 0, quality: 0 },
    { name: 'Divisi C', achievement: 0, production: 0, quality: 0 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Selamat Datang,</Text>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>Estate Manager</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {summaryCards.map((card, index) => (
          <View key={index} style={styles.summaryCard}>
            <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
              <card.icon size={20} color="#fff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardValue}>
                {card.value}
                <Text style={styles.cardUnit}> {card.unit}</Text>
              </Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardChange}>{card.change}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performa Divisi</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {divisiPerformance.map((divisi, index) => (
          <TouchableOpacity key={index} style={styles.divisiCard}>
            <View style={styles.divisiHeader}>
              <Text style={styles.divisiName}>{divisi.name}</Text>
              <View
                style={[
                  styles.achievementBadge,
                  {
                    backgroundColor:
                      divisi.achievement >= 95
                        ? '#e8f5e9'
                        : divisi.achievement >= 80
                          ? '#fff3e0'
                          : '#ffebee',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.achievementText,
                    {
                      color:
                        divisi.achievement >= 95
                          ? '#2d5016'
                          : divisi.achievement >= 80
                            ? '#f57c00'
                            : '#d32f2f',
                    },
                  ]}
                >
                  {divisi.achievement}%
                </Text>
              </View>
            </View>
            <View style={styles.divisiStats}>
              <View style={styles.divisiStat}>
                <Text style={styles.divisiStatLabel}>Produksi</Text>
                <Text style={styles.divisiStatValue}>{divisi.production} Ton</Text>
              </View>
              <View style={styles.divisiStat}>
                <Text style={styles.divisiStatLabel}>Quality</Text>
                <Text style={styles.divisiStatValue}>{divisi.quality}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionCard}>
          <FileText size={24} color="#2d5016" />
          <Text style={styles.actionLabel}>Laporan Harian</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <BarChart3 size={24} color="#4a7c23" />
          <Text style={styles.actionLabel}>Analytics</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    width: '48%',
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
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    gap: 2,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  cardUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
  },
  cardChange: {
    fontSize: 11,
    color: '#999',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#2d5016',
    fontWeight: '500',
  },
  divisiCard: {
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
  divisiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  divisiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  achievementBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  achievementText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divisiStats: {
    flexDirection: 'row',
    gap: 16,
  },
  divisiStat: {
    flex: 1,
  },
  divisiStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  divisiStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});
