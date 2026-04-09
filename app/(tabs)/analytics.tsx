import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { getDbClient } from '@/lib/db';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dailyData, setDailyData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  });
  const [weeklyData, setWeeklyData] = useState({
    labels: ['No Data'],
    datasets: [{ data: [0] }],
  });
  const [monthlyData, setMonthlyData] = useState({
    labels: ['No Data'],
    datasets: [{ data: [0] }],
  });
  const [trends, setTrends] = useState([
    {
      label: 'Produksi Bulan Ini',
      value: '0 Ton',
      change: '+0%',
      trend: 'neutral',
      color: '#2d5016',
    },
    {
      label: 'Rata-rata Achievement',
      value: '0%',
      change: '+0%',
      trend: 'neutral',
      color: '#4a7c23',
    },
    {
      label: 'Quality Score',
      value: '0%',
      change: '0%',
      trend: 'neutral',
      color: '#6ba82e',
    },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const db = await getDbClient();
      
      // 1. Fetch Daily Production (Last 7 days)
      const dailyQuery = `
        SELECT 
          to_char(tanggal, 'Dy') as label,
          SUM(hasil_panen_bjd) as total_yield
        FROM harvest_records 
        WHERE tanggal >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY tanggal, label
        ORDER BY tanggal ASC
      `;
      const { rows: dailyRows } = await db.query(dailyQuery);

      if (dailyRows.length > 0) {
        setDailyData({
          labels: dailyRows.map((row: any) => row.label),
          datasets: [{ data: dailyRows.map((row: any) => parseFloat(row.total_yield) / 1000) }],
        });
      }

      // 2. Fetch Weekly Production (Last 8 weeks)
      const weeklyQuery = `
        SELECT 
          to_char(date_trunc('week', tanggal), 'DD/MM') as label,
          SUM(hasil_panen_bjd) as total_yield,
          date_trunc('week', tanggal) as week_start
        FROM harvest_records 
        WHERE tanggal >= CURRENT_DATE - INTERVAL '8 weeks'
        GROUP BY week_start, label
        ORDER BY week_start ASC
      `;
      const { rows: weeklyRows } = await db.query(weeklyQuery);

      if (weeklyRows.length > 0) {
        setWeeklyData({
           labels: weeklyRows.map((row: any) => row.label),
           datasets: [{ data: weeklyRows.map((row: any) => parseFloat(row.total_yield) / 1000) }],
        });
      }

      // 3. Fetch Monthly Production (Last 6 months)
      const monthlyQuery = `
        SELECT 
          to_char(date_trunc('month', tanggal), 'Mon') as label,
          SUM(hasil_panen_bjd) as total_yield,
          date_trunc('month', tanggal) as month_start
        FROM harvest_records 
        WHERE tanggal >= CURRENT_DATE - INTERVAL '5 months'
        GROUP BY month_start, label
        ORDER BY month_start ASC
      `;
      const { rows: monthlyRows } = await db.query(monthlyQuery);

      if (monthlyRows.length > 0) {
         setMonthlyData({
            labels: monthlyRows.map((row: any) => row.label),
            datasets: [{ data: monthlyRows.map((row: any) => parseFloat(row.total_yield) / 1000) }],
         });
      }

      // 4. Fetch Current Month Production for Trends
      const currentMonthQuery = `
        SELECT SUM(hasil_panen_bjd) as total_yield
        FROM harvest_records
        WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)
      `;
      const { rows: currentMonthRows } = await db.query(currentMonthQuery);
      const currentMonthYield = currentMonthRows[0]?.total_yield || 0;
      
      // Update trends state
      setTrends(prev => [
        {
          ...prev[0],
          value: `${(currentMonthYield / 1000).toFixed(1)} Ton`,
          trend: 'up', // Simplified logic
          change: '+5%', // Dummy change for now
        },
        prev[1],
        prev[2]
      ]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(45, 80, 22, ${opacity})`, // Primary green
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 1,
  };

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

      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>
            {period === 'daily' ? 'Produksi Harian (7 Hari)' :
             period === 'weekly' ? 'Produksi Mingguan (8 Minggu)' :
             'Produksi Bulanan (6 Bulan)'}
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, period === 'daily' && styles.activeTab]} 
            onPress={() => setPeriod('daily')}
          >
            <Text style={[styles.tabText, period === 'daily' && styles.activeTabText]}>Harian</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, period === 'weekly' && styles.activeTab]} 
            onPress={() => setPeriod('weekly')}
          >
            <Text style={[styles.tabText, period === 'weekly' && styles.activeTabText]}>Mingguan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, period === 'monthly' && styles.activeTab]} 
            onPress={() => setPeriod('monthly')}
          >
            <Text style={[styles.tabText, period === 'monthly' && styles.activeTabText]}>Bulanan</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
           <ActivityIndicator size="large" color="#2d5016" />
        ) : (
          <LineChart
            data={period === 'daily' ? dailyData : period === 'weekly' ? weeklyData : monthlyData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 14,
    color: '#757575',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendChange: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  trendValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  neutralLine: {
    width: 8,
    height: 2,
    backgroundColor: '#666',
    marginRight: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  chartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 12,
  },
  chartSubtext: {
    fontSize: 14,
    color: '#9e9e9e',
    marginTop: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
    marginTop: -12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  infoCard: {
    backgroundColor: '#e8f5e9',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#2d5016',
    lineHeight: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#2d5016',
  },
});
