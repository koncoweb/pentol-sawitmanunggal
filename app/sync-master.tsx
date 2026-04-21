import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Database, Download, CheckCircle2, AlertCircle } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';
import { runQuery, syncMasterData, useOfflineData } from '@/lib/offline';

export default function SyncMasterScreen() {
  const router = useRouter();
  const { clearCache } = useOfflineData();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [counts, setCounts] = useState({
    divisi: 0,
    gang: 0,
    blok: 0,
    tph: 0,
    pemanen: 0,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    loadCounts();
    return () => unsubscribe();
  }, []);

  const loadCounts = async () => {
    try {
      const divisi = await runQuery('SELECT COUNT(*) as count FROM divisi');
      const gang = await runQuery('SELECT COUNT(*) as count FROM gang');
      const blok = await runQuery('SELECT COUNT(*) as count FROM blok');
      const tph = await runQuery('SELECT COUNT(*) as count FROM tph');
      const pemanen = await runQuery('SELECT COUNT(*) as count FROM pemanen');

      setCounts({
        divisi: (divisi[0] as any).count || 0,
        gang: (gang[0] as any).count || 0,
        blok: (blok[0] as any).count || 0,
        tph: (tph[0] as any).count || 0,
        pemanen: (pemanen[0] as any).count || 0,
      });
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const handleSync = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Tidak ada koneksi internet. Pastikan Anda terhubung ke internet untuk mengunduh data master.');
      return;
    }

    setIsSyncing(true);
    try {
      await syncMasterData();
      // Clear cache after successful sync to ensure fresh data
      clearCache();
      await loadCounts();
      Alert.alert('Sukses', 'Data master berhasil disinkronisasi dan cache telah dibersihkan.');
    } catch (error: any) {
      console.error('Sync error:', error);
      Alert.alert('Error', `Gagal melakukan sinkronisasi: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const StatCard = ({ title, count, icon: Icon }: { title: string, count: number, icon: any }) => (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <Icon size={24} color="#2d5016" />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statCount}>{count} Data</Text>
      </View>
      {count > 0 ? (
        <CheckCircle2 size={20} color="#4caf50" />
      ) : (
        <AlertCircle size={20} color="#ff9800" />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sinkronisasi Data Master</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Halaman ini digunakan untuk mengunduh data master (Divisi, Gang, Blok, TPH, Pemanen) dari server ke penyimpanan lokal perangkat Anda. Data ini diperlukan agar formulir input panen tetap dapat digunakan saat tidak ada koneksi internet (Offline).
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Status Data Lokal (SQLite)</Text>
          <StatCard title="Divisi" count={counts.divisi} icon={Database} />
          <StatCard title="Gang" count={counts.gang} icon={Database} />
          <StatCard title="Blok & Tahun Tanam" count={counts.blok} icon={Database} />
          <StatCard title="TPH" count={counts.tph} icon={Database} />
          <StatCard title="Pemanen" count={counts.pemanen} icon={Database} />
        </View>

        <TouchableOpacity 
          style={[styles.syncButton, (!isConnected || isSyncing) && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={!isConnected || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Download size={24} color="#fff" />
              <Text style={styles.syncButtonText}>Unduh Data Master Sekarang</Text>
            </>
          )}
        </TouchableOpacity>

        {!isConnected && (
          <Text style={styles.offlineWarning}>
            Koneksi internet terputus. Anda tidak dapat mengunduh data saat ini.
          </Text>
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
    paddingTop: 48,
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
  content: {
    flex: 1,
    padding: 16,
  },
  infoBanner: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  infoText: {
    color: '#2e7d32',
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f8e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  syncButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  syncButtonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineWarning: {
    color: '#d32f2f',
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
});