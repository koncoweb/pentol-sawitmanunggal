import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, Target, Package, AlertTriangle } from 'lucide-react-native';

export default function MonitoringScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monitoring Real-time</Text>
        <Text style={styles.subtitle}>Update terakhir: Belum ada data</Text>
      </View>

      <View style={styles.kpiSection}>
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#2d5016' }]}>
            <Target size={24} color="#fff" />
          </View>
          <View style={styles.kpiContent}>
            <Text style={styles.kpiLabel}>Achievement vs RKH</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>0%</Text>
              <Text style={styles.kpiTarget}>Target: 95%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%', backgroundColor: '#2d5016' }]} />
            </View>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#4a7c23' }]}>
            <Package size={24} color="#fff" />
          </View>
          <View style={styles.kpiContent}>
            <Text style={styles.kpiLabel}>Produktivitas (Ton/Ha)</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>0</Text>
              <Text style={styles.kpiTarget}>Target: 22 Ton/Ha</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%', backgroundColor: '#4a7c23' }]} />
            </View>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#6ba82e' }]}>
            <TrendingUp size={24} color="#fff" />
          </View>
          <View style={styles.kpiContent}>
            <Text style={styles.kpiLabel}>BJR (Berat Janjang Rata-rata)</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>0 Kg</Text>
              <Text style={styles.kpiTarget}>Standar: 15-20 Kg</Text>
            </View>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#f57c00' }]}>
            <AlertTriangle size={24} color="#fff" />
          </View>
          <View style={styles.kpiContent}>
            <Text style={styles.kpiLabel}>Losses & Quality</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>0%</Text>
              <Text style={styles.kpiTarget}>BMT Target: {'<'} 2%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%', backgroundColor: '#f57c00' }]} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Tentang Monitoring</Text>
        <Text style={styles.infoText}>
          Dashboard ini menampilkan data real-time dari seluruh aktivitas panen. Data akan
          diperbarui otomatis saat ada input baru dari lapangan.
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  kpiSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  kpiCard: {
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
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginRight: 12,
  },
  kpiTarget: {
    fontSize: 12,
    color: '#999',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoCard: {
    margin: 16,
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 20,
  },
});
