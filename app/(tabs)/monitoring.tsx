import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { TrendingUp, Target, Package, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getDbClient } from '@/lib/db';

export default function MonitoringScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    achievement: 0,
    productivity: 0,
    bjr: 0,
    losses: 0,
    total_weight_kg: 0
  });

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const db = await getDbClient();
      
      // Construct query based on role
      let query = `
        SELECT 
          count(*) as total_records,
          sum(jumlah_jjg) as total_janjang,
          sum(hasil_panen_bjd) as total_weight,
          sum(buah_mentah) as total_mentah,
          sum(buah_busuk) as total_busuk,
          sum(jangkos) as total_jangkos,
          sum(tangkai_panjang) as total_tangkai_panjang
        FROM harvest_records
        WHERE date(tanggal) = current_date
        AND status IN ('submitted', 'approved')
      `;
      
      const params = [];
      if (profile.role === 'asisten' && profile.divisi_id) {
        query += ` AND divisi_id = $1`;
        params.push(profile.divisi_id);
      }
      
      const { rows } = await db.query(query, params);
      const data = rows[0];
      
      // Calculate KPIs
      const totalJanjang = parseFloat(data.total_janjang || '0');
      const totalWeight = parseFloat(data.total_weight || '0');
      
      // Productivity (Ton/Ha) - Need Area
      let areaQuery = `SELECT sum(luas_ha) as total_area FROM blok`;
      const areaParams = [];
      if (profile.role === 'asisten' && profile.divisi_id) {
        areaQuery += ` WHERE divisi_id = $1`;
        areaParams.push(profile.divisi_id);
      }
      const areaRes = await db.query(areaQuery, areaParams);
      const totalArea = parseFloat(areaRes.rows[0]?.total_area || '0');
      
      // Productivity in Ton/Ha
      const productivity = totalArea > 0 ? (totalWeight / 1000) / totalArea : 0;
      
      // BJR
      const bjr = totalJanjang > 0 ? totalWeight / totalJanjang : 0;
      
      // Losses (BMT %) - Assuming BMT = Buah Mentah
      const totalMentah = parseFloat(data.total_mentah || '0');
      const losses = totalJanjang > 0 ? (totalMentah / totalJanjang) * 100 : 0;
      
      // Achievement vs RKH
      // Assumption: Daily Target = 15 kg/Ha (Low) to 100 kg/Ha (Peak)
      // Using a placeholder daily target of 50 kg/Ha for calculation
      const dailyTargetKg = totalArea * 50; 
      const achievement = dailyTargetKg > 0 ? (totalWeight / dailyTargetKg) * 100 : 0;

      setStats({
        achievement,
        productivity,
        bjr,
        losses,
        total_weight_kg: totalWeight
      });
      
      await db.end();
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Monitoring Real-time</Text>
        <Text style={styles.subtitle}>
          Update terakhir: {new Date().toLocaleTimeString('id-ID')}
        </Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2d5016" style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.kpiSection}>
          <Text style={styles.sectionTitle}>Key Performance Indicators (Harian)</Text>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#2d5016' }]}>
              <Target size={24} color="#fff" />
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>Achievement vs Target Harian</Text>
              <View style={styles.kpiValueRow}>
                <Text style={styles.kpiValue}>{stats.achievement.toFixed(1)}%</Text>
                <Text style={styles.kpiTarget}>Target: 100%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill, 
                  { width: `${Math.min(stats.achievement, 100)}%`, backgroundColor: '#2d5016' }
                ]} />
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
                <Text style={styles.kpiValue}>{stats.productivity.toFixed(2)}</Text>
                <Text style={styles.kpiTarget}>Total: {(stats.total_weight_kg / 1000).toFixed(2)} Ton</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill, 
                  { width: `${Math.min((stats.productivity / 0.1) * 100, 100)}%`, backgroundColor: '#4a7c23' }
                ]} />
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
                <Text style={styles.kpiValue}>{stats.bjr.toFixed(1)} Kg</Text>
                <Text style={styles.kpiTarget}>Std: 15-20 Kg</Text>
              </View>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: '#f57c00' }]}>
              <AlertTriangle size={24} color="#fff" />
            </View>
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>Losses & Quality (BMT)</Text>
              <View style={styles.kpiValueRow}>
                <Text style={styles.kpiValue}>{stats.losses.toFixed(1)}%</Text>
                <Text style={styles.kpiTarget}>Target: {'<'} 2%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill, 
                  { width: `${Math.min((stats.losses / 5) * 100, 100)}%`, backgroundColor: '#f57c00' }
                ]} />
              </View>
            </View>
          </View>
        </View>
      )}

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
