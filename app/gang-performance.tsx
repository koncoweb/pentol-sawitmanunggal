import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getDbClient } from '@/lib/db';
import { Stack } from 'expo-router';

type GangMemberStat = {
  id: string;
  name: string;
  total_jjg: number;
  total_kg: number;
  total_mentah: number;
  losses_rate: number;
};

export default function GangPerformanceScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<GangMemberStat[]>([]);

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const db = await getDbClient();
      
      let query = `
        SELECT 
          p.id,
          p.name,
          COALESCE(SUM(hr.jumlah_jjg), 0) as total_jjg,
          COALESCE(SUM(hr.hasil_panen_bjd), 0) as total_kg,
          COALESCE(SUM(hr.buah_mentah), 0) as total_mentah
        FROM pemanen p
        LEFT JOIN harvest_records hr ON hr.pemanen_id = p.id AND hr.tanggal = CURRENT_DATE AND hr.status != 'rejected'
        LEFT JOIN gang g ON p.gang_id = g.id
        WHERE p.status_aktif = true
      `;
      
      const params = [];
      if (profile.divisi_id) {
        query += ` AND g.divisi_id = $1`;
        params.push(profile.divisi_id);
      }
      
      query += ` GROUP BY p.id, p.name ORDER BY total_jjg DESC`;
      
      const { rows } = await db.query(query, params);
      
      const formattedData: GangMemberStat[] = rows.map((row: any) => {
        const jjg = Number(row.total_jjg);
        const mentah = Number(row.total_mentah);
        return {
          id: row.id,
          name: row.name,
          total_jjg: jjg,
          total_kg: Number(row.total_kg),
          total_mentah: mentah,
          losses_rate: jjg > 0 ? (mentah / jjg) * 100 : 0
        };
      });

      setMembers(formattedData);
      
      await db.end();
    } catch (error) {
      console.error('Error loading gang performance:', error);
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

  const renderItem = ({ item }: { item: GangMemberStat }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder}>
            <Users size={20} color="#2d5016" />
          </View>
          <Text style={styles.userName}>{item.name}</Text>
        </View>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{item.total_jjg} JJG</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Output (Kg)</Text>
          <Text style={styles.statValue}>{item.total_kg.toFixed(0)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Buah Mentah</Text>
          <Text style={[styles.statValue, { color: item.total_mentah > 0 ? '#f57c00' : '#333' }]}>
            {item.total_mentah}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Losses Rate</Text>
          <Text style={[styles.statValue, { color: item.losses_rate > 2 ? '#d32f2f' : '#4a7c23' }]}>
            {item.losses_rate.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Performa Anggota Gang' }} />
      <View style={styles.container}>
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#2d5016" style={styles.loader} />
        ) : (
          <FlatList
            data={members}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Belum ada data panen hari ini</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rankBadge: {
    backgroundColor: '#2d5016',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});
