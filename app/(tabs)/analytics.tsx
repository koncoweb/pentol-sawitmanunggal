import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react-native';

export default function AnalyticsScreen() {
  const trends = [
    {
      label: 'Produksi Bulan Ini',
      value: '0 Ton',
      change: '+0%',
      trend: 'up',
      color: '#2d5016',
    },
    {
      label: 'Rata-rata Achievement',
      value: '0%',
      change: '+0%',
      trend: 'up',
      color: '#4a7c23',
    },
    {
      label: 'Quality Score',
      value: '0%',
      change: '0%',
      trend: 'neutral',
      color: '#6ba82e',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Analisis performa dan tren</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trend Analysis</Text>
        {trends.map((item, index) => (
          <View key={index} style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Text style={styles.trendLabel}>{item.label}</Text>
              <View style={styles.trendBadge}>
                {item.trend === 'up' ? (
                  <TrendingUp size={16} color="#2d5016" />
                ) : item.trend === 'down' ? (
                  <TrendingDown size={16} color="#d32f2f" />
                ) : (
                  <View style={styles.neutralLine} />
                )}
                <Text
                  style={[
                    styles.trendChange,
                    {
                      color:
                        item.trend === 'up'
                          ? '#2d5016'
                          : item.trend === 'down'
                            ? '#d32f2f'
                            : '#666',
                    },
                  ]}
                >
                  {item.change}
                </Text>
              </View>
            </View>
            <Text style={[styles.trendValue, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chartPlaceholder}>
        <BarChart3 size={48} color="#ccc" />
        <Text style={styles.chartText}>Grafik akan muncul di sini</Text>
        <Text style={styles.chartSubtext}>Setelah data panen tersedia</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Tentang Analytics</Text>
        <Text style={styles.infoText}>
          Halaman ini menampilkan analisis mendalam tentang tren produktivitas, perbandingan
          periode, dan insights untuk pengambilan keputusan strategis.
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
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  trendCard: {
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
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendLabel: {
    fontSize: 14,
    color: '#666',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  neutralLine: {
    width: 16,
    height: 2,
    backgroundColor: '#666',
  },
  trendValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  chartPlaceholder: {
    margin: 16,
    backgroundColor: '#fff',
    padding: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  chartSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
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
