import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { 
  ChevronLeft, 
  RefreshCw, 
  Trash2, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Database
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { runQuery, runCommand, syncHarvestQueue, syncMasterData } from '@/lib/offline';
import { HarvestRecordQueueItem } from '@/lib/offline/types';
import NetInfo from '@react-native-community/netinfo';

export default function SyncManagerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const [pendingItems, setPendingItems] = useState<HarvestRecordQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPendingItems = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await runQuery(`
        SELECT 
          q.*, 
          d.name as divisi_name, 
          b.name as blok_name,
          p.name as pemanen_name
        FROM harvest_records_queue q
        LEFT JOIN divisi d ON q.divisi_id = d.id
        LEFT JOIN blok b ON q.blok_id = b.id
        LEFT JOIN pemanen p ON q.pemanen_id = p.id
        WHERE q.status != 'synced'
        ORDER BY q.created_at DESC
      `);
      setPendingItems(rows as any[]);
    } catch (error) {
      console.error('Error loading pending items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingItems();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    
    return () => unsubscribe();
  }, [loadPendingItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingItems();
    setRefreshing(false);
  };

  const handleSyncNow = async () => {
    if (!isConnected) {
      Alert.alert(t('common.error'), 'Tidak ada koneksi internet');
      return;
    }

    if (pendingItems.length === 0) {
      Alert.alert('Info', 'Tidak ada data yang perlu disinkronisasi');
      return;
    }

    setIsSyncing(true);
    try {
      await syncHarvestQueue();
      await syncMasterData();
      await loadPendingItems();
      Alert.alert('Sukses', 'Sinkronisasi selesai');
    } catch (error: any) {
      console.error('Sync failed:', error);
      Alert.alert('Error', `Sinkronisasi gagal: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteItem = (localId: number) => {
    Alert.alert(
      'Hapus Data',
      'Apakah Anda yakin ingin menghapus data antrean ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              await runCommand('DELETE FROM harvest_records_queue WHERE local_id = ?', [localId]);
              await loadPendingItems();
            } catch (error) {
              console.error('Error deleting item:', error);
            }
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    if (pendingItems.length === 0) return;

    Alert.alert(
      'Hapus Semua',
      'Apakah Anda yakin ingin menghapus SEMUA data antrean?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus Semua', 
          style: 'destructive',
          onPress: async () => {
            try {
              await runCommand("DELETE FROM harvest_records_queue WHERE status != 'synced'");
              await loadPendingItems();
            } catch (error) {
              console.error('Error clearing queue:', error);
            }
          }
        }
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#f57c00" />;
      case 'error': return <AlertCircle size={16} color="#d32f2f" />;
      default: return <CheckCircle2 size={16} color="#2e7d32" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manajer Sinkronisasi</Text>
        <View style={styles.connectionStatus}>
          {isConnected ? (
            <Wifi size={20} color="#4caf50" />
          ) : (
            <WifiOff size={20} color="#f44336" />
          )}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Database size={24} color="#2d5016" />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Total Antrean</Text>
            <Text style={styles.summaryValue}>{pendingItems.length} Record</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.syncButton, (!isConnected || isSyncing) && styles.syncButtonDisabled]}
          onPress={handleSyncNow}
          disabled={!isConnected || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <RefreshCw size={18} color="#fff" />
              <Text style={styles.syncButtonText}>Sinkron Sekarang</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Daftar Antrean</Text>
        {pendingItems.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Hapus Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2d5016" style={{ marginTop: 40 }} />
        ) : pendingItems.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle2 size={64} color="#ccc" />
            <Text style={styles.emptyText}>Semua data sudah tersinkronisasi</Text>
          </View>
        ) : (
          pendingItems.map((item: any) => (
            <View key={item.local_id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemStatus}>
                  {getStatusIcon(item.status)}
                  <Text style={[styles.statusText, { color: item.status === 'error' ? '#d32f2f' : '#f57c00' }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.itemDate}>{formatDate(item.created_at || '')}</Text>
              </View>

              <View style={styles.itemBody}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemMainInfo}>{item.divisi_name} - {item.blok_name}</Text>
                  <Text style={styles.itemSubInfo}>Pemanen: {item.pemanen_name}</Text>
                  <Text style={styles.itemSubInfo}>Hasil: {item.jumlah_jjg} Janjang</Text>
                  {item.sync_error && (
                    <Text style={styles.errorText}>Error: {item.sync_error}</Text>
                  )}
                </View>
                
                <View style={styles.itemActions}>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => item.local_id && handleDeleteItem(item.local_id)}
                  >
                    <Trash2 size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionStatus: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  syncButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#999',
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clearAllText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f57c00',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemDate: {
    fontSize: 11,
    color: '#999',
  },
  itemBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemMainInfo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemSubInfo: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 11,
    color: '#d32f2f',
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemActions: {
    marginLeft: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
