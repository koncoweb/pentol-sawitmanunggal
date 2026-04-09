import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Truck, User, FileText, ChevronRight } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';

type SpbSummary = {
  id: string;
  nomor_spb: string;
  driver_name: string;
  truck_plate: string;
  status: string;
  created_at: string;
  total_janjang: number;
  total_weight: number;
};

export default function SpbListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [spbList, setSpbList] = useState<SpbSummary[]>([]);

  useEffect(() => {
    loadSpbList();
  }, []);

  const loadSpbList = async () => {
    try {
      const db = await getDbClient();
      const { rows } = await db.query(`
        SELECT 
          s.id,
          s.nomor_spb,
          s.driver_name,
          s.truck_plate,
          s.status,
          s.created_at,
          COALESCE(SUM(hr.jumlah_jjg), 0)::int as total_janjang,
          COALESCE(SUM(hr.hasil_panen_bjd), 0)::numeric as total_weight
        FROM spb s
        LEFT JOIN harvest_records hr ON s.id = hr.spb_id
        WHERE s.tanggal = CURRENT_DATE
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `);
      
      setSpbList(rows.map((row: any) => ({
        id: row.id,
        nomor_spb: row.nomor_spb,
        driver_name: row.driver_name,
        truck_plate: row.truck_plate,
        status: row.status,
        created_at: row.created_at,
        total_janjang: parseInt(row.total_janjang),
        total_weight: parseFloat(row.total_weight)
      })));
      
      await db.end();
    } catch (error) {
      console.error('Error loading SPB list:', error);
      Alert.alert('Error', 'Gagal memuat data SPB');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data SPB Hari Ini</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2d5016" style={{ marginTop: 20 }} />
        ) : spbList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada SPB dibuat hari ini</Text>
          </View>
        ) : (
          spbList.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => router.push({ pathname: '/spb-detail', params: { id: item.id } })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.spbNumber}>{item.nomor_spb}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'shipped' ? '#e8f5e9' : '#e3f2fd' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'shipped' ? '#2e7d32' : '#1565c0' }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.row}>
                  <User size={14} color="#666" style={styles.icon} />
                  <Text style={styles.text}>{item.driver_name}</Text>
                </View>
                <View style={styles.row}>
                  <Truck size={14} color="#666" style={styles.icon} />
                  <Text style={styles.text}>{item.truck_plate}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.statsText}>{item.total_janjang} Janjang • {item.total_weight} Kg</Text>
                <Text style={styles.timeText}>
                  {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2d5016',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  spbNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d5016',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
});
