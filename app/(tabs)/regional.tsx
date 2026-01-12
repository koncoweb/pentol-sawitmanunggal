import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, TrendingUp, Building2, BarChart3, Award, AlertCircle } from 'lucide-react-native';

export default function RegionalDashboard() {
  const { profile } = useAuth();

  const regionalStats = [
    {
      label: 'Total Produksi Regional',
      value: '0',
      unit: 'Ton',
      trend: '+0%',
      color: '#2d5016',
      icon: TrendingUp,
    },
    {
      label: 'Total Estate',
      value: '2',
      unit: 'Aktif',
      trend: 'Regional',
      color: '#4a7c23',
      icon: Building2,
    },
    {
      label: 'Avg Achievement',
      value: '0%',
      unit: 'Target 95%',
      trend: 'Seluruh Estate',
      color: '#6ba82e',
      icon: Award,
    },
    {
      label: 'Quality Score',
      value: '0%',
      unit: 'BMT',
      trend: 'Target < 2%',
      color: '#8ac449',
      icon: BarChart3,
    },
  ];

  const estateComparison = [
    {
      name: 'Estate Manunggal 1',
      region: 'Region Sumatra',
      achievement: 0,
      production: 0,
      quality: 0,
      status: 'good',
    },
    {
      name: 'Estate Manunggal 2',
      region: 'Region Kalimantan',
      achievement: 0,
      production: 0,
      quality: 0,
      status: 'warning',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Selamat Datang,</Text>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>Regional / General Manager</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {regionalStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
              <stat.icon size={20} color="#fff" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>
                {stat.value}
                <Text style={styles.statUnit}> {stat.unit}</Text>
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statTrend}>{stat.trend}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Perbandingan Estate</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>Detail</Text>
          </TouchableOpacity>
        </View>

        {estateComparison.map((estate, index) => (
          <TouchableOpacity key={index} style={styles.estateCard}>
            <View style={styles.estateHeader}>
              <View style={styles.estateInfo}>
                <Text style={styles.estateName}>{estate.name}</Text>
                <Text style={styles.estateRegion}>{estate.region}</Text>
              </View>
              <View style={styles.estateStatus}>
                {estate.status === 'good' ? (
                  <Award size={20} color="#2d5016" />
                ) : (
                  <AlertCircle size={20} color="#f57c00" />
                )}
              </View>
            </View>

            <View style={styles.estateMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{estate.achievement}%</Text>
                <Text style={styles.metricLabel}>Achievement</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{estate.production}</Text>
                <Text style={styles.metricLabel}>Produksi (Ton)</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{estate.quality}%</Text>
                <Text style={styles.metricLabel}>Quality</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Analytics & Reports</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <BarChart3 size={24} color="#2d5016" />
            <Text style={styles.actionText}>Regional Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MapPin size={24} color="#4a7c23" />
            <Text style={styles.actionText}>Estate Map</Text>
          </TouchableOpacity>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statTrend: {
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
  viewAll: {
    fontSize: 14,
    color: '#2d5016',
    fontWeight: '500',
  },
  estateCard: {
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
  estateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  estateInfo: {
    flex: 1,
  },
  estateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  estateRegion: {
    fontSize: 12,
    color: '#666',
  },
  estateStatus: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  estateMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d5016',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  actionSection: {
    padding: 16,
    paddingBottom: 32,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
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
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
