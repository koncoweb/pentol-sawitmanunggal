import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, TrendingUp, AlertTriangle, Award } from 'lucide-react-native';

export default function AsistenDashboard() {
  const { profile } = useAuth();

  const kpiCards = [
    {
      label: 'Achievement vs RKH',
      value: '0%',
      target: 'Target: 95%',
      color: '#2d5016',
      icon: TrendingUp,
      status: 'pending',
    },
    {
      label: 'Quality Score',
      value: '0%',
      target: 'BMT < 2%',
      color: '#4a7c23',
      icon: Award,
      status: 'good',
    },
    {
      label: 'Losses Rate',
      value: '0%',
      target: 'Target: < 1%',
      color: '#f57c00',
      icon: AlertTriangle,
      status: 'warning',
    },
  ];

  const gangPerformance = [
    { gang: 'Gang 1', achievement: 0, quality: 0, status: 'pending' },
    { gang: 'Gang 2', achievement: 0, quality: 0, status: 'pending' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Selamat Datang,</Text>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>Asisten Divisi</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KPI Divisi</Text>
        {kpiCards.map((kpi, index) => (
          <View key={index} style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: kpi.color }]}>
                <kpi.icon size={20} color="#fff" />
              </View>
              <View style={styles.kpiContent}>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={styles.kpiTarget}>{kpi.target}</Text>
              </View>
              <View>
                <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performa Gang</Text>
        {gangPerformance.map((gang, index) => (
          <TouchableOpacity key={index} style={styles.gangCard}>
            <View style={styles.gangHeader}>
              <Text style={styles.gangName}>{gang.gang}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: gang.status === 'pending' ? '#f5f5f5' : '#e8f5e9' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: gang.status === 'pending' ? '#666' : '#2d5016' },
                  ]}
                >
                  {gang.status === 'pending' ? 'Belum Ada Data' : 'Aktif'}
                </Text>
              </View>
            </View>
            <View style={styles.gangStats}>
              <View style={styles.gangStat}>
                <Text style={styles.gangStatValue}>{gang.achievement}%</Text>
                <Text style={styles.gangStatLabel}>Achievement</Text>
              </View>
              <View style={styles.gangStat}>
                <Text style={styles.gangStatValue}>{gang.quality}%</Text>
                <Text style={styles.gangStatLabel}>Quality</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
        <TouchableOpacity style={styles.actionButton}>
          <BarChart3 size={20} color="#2d5016" />
          <Text style={styles.actionText}>Lihat Laporan Detail</Text>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  kpiCard: {
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
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  kpiTarget: {
    fontSize: 12,
    color: '#666',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  gangCard: {
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
  gangHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gangName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gangStats: {
    flexDirection: 'row',
    gap: 16,
  },
  gangStat: {
    flex: 1,
  },
  gangStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d5016',
    marginBottom: 4,
  },
  gangStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionSection: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
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
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d5016',
  },
});
