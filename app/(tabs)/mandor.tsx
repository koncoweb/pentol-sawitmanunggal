import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getDbClient } from '@/lib/db';
import { CheckSquare, Target, Users, TrendingUp } from 'lucide-react-native';

export default function MandorDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    target: 1500,
    realization: 0,
    members: 0,
  });

  const loadStats = useCallback(async () => {
    if (!profile) return;
    
    const db = await getDbClient();
    try {
      // 1. Pending Approvals
      let pendingQuery = "SELECT COUNT(*) as count FROM harvest_records WHERE status = 'submitted'";
      const pendingParams: any[] = [];
      
      // 2. Realization Today
      let realQuery = "SELECT SUM(jumlah_jjg) as total FROM harvest_records WHERE tanggal = CURRENT_DATE";
      const realParams: any[] = [];

      // 3. Members
      let membersQuery = "SELECT COUNT(*) as count FROM pemanen WHERE status_aktif = true";
      const membersParams: any[] = [];

      // Filter by Divisi if available
      if (profile.divisi_id) {
        pendingQuery += " AND divisi_id = $1";
        pendingParams.push(profile.divisi_id);

        realQuery += " AND divisi_id = $1";
        realParams.push(profile.divisi_id);
        
        // For members, we need to join with gang to check divisi
        membersQuery = `
          SELECT COUNT(p.id) as count 
          FROM pemanen p 
          LEFT JOIN gang g ON p.gang_id = g.id 
          WHERE p.status_aktif = true AND g.divisi_id = $1
        `;
        membersParams.push(profile.divisi_id);
      }

      const [pendingRes, realRes, membersRes] = await Promise.all([
        db.query(pendingQuery, pendingParams),
        db.query(realQuery, realParams),
        db.query(membersQuery, membersParams)
      ]);

      setStats({
        pending: Number(pendingRes.rows[0]?.count || 0),
        target: 1500, // Mock target for now (should come from RKH)
        realization: Number(realRes.rows[0]?.total || 0),
        members: Number(membersRes.rows[0]?.count || 0),
      });

    } catch (error) {
      console.error('Error loading mandor stats:', error);
    } finally {
      await db.end();
    }
  }, [profile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const quickStats = [
    {
      label: 'Pending Approval',
      value: stats.pending.toString(),
      color: '#f57c00',
      icon: CheckSquare,
    },
    {
      label: 'Target Hari Ini',
      value: stats.target.toString(), // TODO: Fetch from RKH
      color: '#2d5016',
      icon: Target,
    },
    {
      label: 'Realisasi',
      value: stats.realization.toString(),
      color: '#4a7c23',
      icon: TrendingUp,
    },
    {
      label: 'Anggota Gang',
      value: stats.members.toString(),
      color: '#6ba82e',
      icon: Users,
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Selamat Datang,</Text>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>Mandor Panen</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {quickStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
              <stat.icon size={20} color="#fff" />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tugas Hari Ini</Text>

        <TouchableOpacity 
          style={styles.taskCard}
          onPress={() => router.push('/approval')}
        >
          <View style={styles.taskHeader}>
            <View style={[styles.taskBadge, { backgroundColor: '#f57c00' }]}>
              <Text style={styles.taskBadgeText}>Urgent</Text>
            </View>
            <Text style={styles.taskTime}>Hari ini</Text>
          </View>
          <Text style={styles.taskTitle}>Approval Data Panen</Text>
          <Text style={styles.taskDescription}>
            {stats.pending > 0 
              ? `Ada ${stats.pending} data panen menunggu validasi`
              : 'Validasi fisik buah di lapangan dan approve data dari Krani'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.taskCard}
          onPress={() => router.push('/gang-performance' as any)}
        >
          <View style={styles.taskHeader}>
            <View style={[styles.taskBadge, { backgroundColor: '#2d5016' }]}>
              <Text style={styles.taskBadgeText}>Target</Text>
            </View>
            <Text style={styles.taskTime}>Sebelum jam 15:00</Text>
          </View>
          <Text style={styles.taskTitle}>Monitoring Pencapaian Gang</Text>
          <Text style={styles.taskDescription}>
            Realisasi: {stats.realization} / {stats.target} Janjang 
            ({stats.target > 0 ? Math.round((stats.realization / stats.target) * 100) : 0}%)
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Catatan Penting</Text>
        <Text style={styles.infoText}>
          Approval harus dilakukan sebelum jam kerja berakhir. Pastikan kualitas grading sesuai
          dengan kondisi fisik buah di lapangan.
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
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  taskTime: {
    fontSize: 12,
    color: '#666',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  taskDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
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
