import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getDbClient } from '@/lib/db';

type PendingApproval = {
  id: string;
  krani: string;
  blok: string;
  janjang: number;
  timestamp: string;
  buah_masak: number;
  buah_mentah: number;
  buah_busuk: number;
};

export default function ApprovalScreen() {
  const { profile } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedTodayCount, setApprovedTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const canApprove = useMemo(() => {
    if (!profile?.role) return false;
    return ['mandor', 'asisten', 'estate_manager', 'regional_gm'].includes(profile.role);
  }, [profile?.role]);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    const db = await getDbClient();
    try {
      const [pendingRes, statsRes] = await Promise.all([
        db.query(
          `
            SELECT 
              hr.id,
              COALESCE(pr.full_name, 'Unknown') AS krani,
              COALESCE(b.name, '-') AS blok,
              COALESCE(hr.jumlah_jjg, 0) AS janjang,
              hr.created_at
            FROM harvest_records hr
            LEFT JOIN profiles pr ON pr.id = hr.created_by
            LEFT JOIN blok b ON b.id = hr.blok_id
            WHERE hr.status = 'submitted'
            ORDER BY hr.created_at DESC
            LIMIT 100
          `
        ),
        db.query(
          `
            SELECT
              COUNT(*) FILTER (WHERE status = 'submitted')::int AS pending_count,
              COUNT(*) FILTER (
                WHERE status = 'approved'
                  AND approved_by = $1
                  AND updated_at::date = CURRENT_DATE
              )::int AS approved_today_count
            FROM harvest_records
          `,
          [profile.id]
        ),
      ]);

      const formattedPending: PendingApproval[] = (pendingRes.rows as any[]).map((row) => ({
        id: row.id,
        krani: row.krani,
        blok: row.blok,
        janjang: Number(row.janjang) || 0,
        timestamp: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-',
        buah_masak: Number(row.buah_masak) || 0,
        buah_mentah: Number(row.buah_mentah) || 0,
        buah_busuk: Number(row.buah_busuk) || 0,
      }));

      setPendingApprovals(formattedPending);
      setPendingCount(statsRes.rows?.[0]?.pending_count ?? 0);
      setApprovedTodayCount(statsRes.rows?.[0]?.approved_today_count ?? 0);
    } finally {
      await db.end();
    }
  }, [profile?.id]);

  useEffect(() => {
    (async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        await loadData();
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Gagal memuat data approval');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadData, profile?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Gagal refresh');
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const updateStatus = useCallback(
    async (id: string, nextStatus: 'approved' | 'rejected') => {
      if (!profile?.id) return;
      if (!canApprove) {
        Alert.alert('Akses ditolak', 'Role Anda tidak memiliki izin approval');
        return;
      }

      setProcessingId(id);
      const db = await getDbClient();
      try {
        const res = await db.query(
          `
            UPDATE harvest_records
            SET status = $1,
                approved_by = $2,
                updated_at = now()
            WHERE id = $3
              AND status = 'submitted'
            RETURNING id
          `,
          [nextStatus, profile.id, id]
        );

        if (!res.rows?.length) {
          Alert.alert('Gagal', 'Data sudah berubah atau tidak ditemukan');
        }
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Gagal update status');
      } finally {
        await db.end();
        setProcessingId(null);
      }

      await loadData();
    },
    [canApprove, loadData, profile?.id]
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Data Menunggu Approval</Text>
        <Text style={styles.subtitle}>Validasi data panen dari Krani</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderLeftColor: '#f57c00' }]}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#2d5016' }]}>
          <Text style={styles.statNumber}>{approvedTodayCount}</Text>
          <Text style={styles.statLabel}>Approved Hari Ini</Text>
        </View>
      </View>

      <View style={styles.section}>
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#2d5016" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        )}

        {!loading &&
          pendingApprovals.map((item) => (
          <View key={item.id} style={styles.approvalCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.kraniName}>{item.krani}</Text>
                <Text style={styles.blokInfo}>Blok {item.blok}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#fff3e0' }]}>
                <Clock size={14} color="#f57c00" />
                <Text style={[styles.statusText, { color: '#f57c00' }]}>Pending</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Janjang</Text>
                <Text style={styles.infoValue}>{item.janjang}</Text>
              </View>
              <View style={styles.detailRow}>
                 <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Masak</Text>
                    <Text style={[styles.detailValue, { color: '#2d5016' }]}>{item.buah_masak}</Text>
                 </View>
                 <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Mentah</Text>
                    <Text style={[styles.detailValue, { color: '#f57c00' }]}>{item.buah_mentah}</Text>
                 </View>
                 <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Busuk</Text>
                    <Text style={[styles.detailValue, { color: '#d32f2f' }]}>{item.buah_busuk}</Text>
                 </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Waktu Input</Text>
                <Text style={styles.infoValue}>{item.timestamp}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.rejectButton, (processingId === item.id || !canApprove) && styles.buttonDisabled]}
                disabled={processingId === item.id || !canApprove}
                onPress={() => {
                  Alert.alert('Tolak data?', 'Status akan menjadi rejected.', [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Tolak', style: 'destructive', onPress: () => updateStatus(item.id, 'rejected') },
                  ]);
                }}
              >
                <XCircle size={18} color="#d32f2f" />
                <Text style={styles.rejectText}>Tolak</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveButton, (processingId === item.id || !canApprove) && styles.buttonDisabled]}
                disabled={processingId === item.id || !canApprove}
                onPress={() => updateStatus(item.id, 'approved')}
              >
                <CheckCircle size={18} color="#fff" />
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!loading && pendingApprovals.length === 0 && (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada data pending</Text>
            <Text style={styles.emptySubtext}>
              Semua data panen sudah di-approve
            </Text>
          </View>
        )}
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
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
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
  approvalCard: {
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  kraniName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  blokInfo: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d32f2f',
    gap: 6,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2d5016',
    gap: 6,
  },
  approveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  loadingBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
