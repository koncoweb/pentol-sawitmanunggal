import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Filter, Image as ImageIcon, X, Download } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import ExportModal from '@/components/ExportModal';

type HarvestRecord = {
  id: string;
  tanggal: string;
  created_at: string;
  divisi_name: string;
  gang_name: string;
  blok_names: string[];
  pemanen_details: Array<{ operator_code: string; name: string }>;
  rotasi: number;
  nomor_panen: number;
  hasil_panen_jjg: number;
  nomor_tph: string;
  bjr: number;
  jumlah_brondolan_kg: number;
  buah_masak: number;
  buah_mentah: number;
  buah_mengkal: number;
  overripe: number;
  abnormal: number;
  buah_busuk: number;
  tangkai_panjang: number;
  jangkos: number;
  keterangan: string;
  foto_url: string | null;
  created_by_name: string;
};

export default function ReportDetailScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const params = useLocalSearchParams();
  const reportType = params.type as string;

  const [records, setRecords] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [filterDivisi, setFilterDivisi] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [reportType]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Calculate date range based on report type
      const today = new Date();
      let startDate = new Date();

      switch (reportType) {
        case 'daily':
          startDate.setDate(today.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(today.getMonth() - 1);
          break;
        default:
          startDate.setDate(today.getDate() - 7);
      }

      const db = await getDbClient();
      
      const query = `
        SELECT
          hr.id,
          hr.tanggal,
          hr.created_at,
          d.name as divisi_name,
          g.name as gang_name,
          b.name as blok_name,
          p.nik as operator_code,
          p.name as pemanen_name,
          hr.rotasi,
          hr.nomor_panen,
          hr.jumlah_jjg as hasil_panen_jjg,
          t.nomor_tph,
          hr.bjr,
          hr.hasil_panen_bjd as jumlah_brondolan_kg,
          hr.buah_masak,
          hr.buah_mentah,
          hr.buah_mengkal,
          hr.overripe,
          hr.abnormal,
          hr.buah_busuk,
          hr.tangkai_panjang,
          hr.jangkos,
          hr.keterangan,
          hr.foto_url,
          pr.full_name as created_by_name
        FROM harvest_records hr
        LEFT JOIN divisi d ON hr.divisi_id = d.id
        LEFT JOIN blok b ON hr.blok_id = b.id
        LEFT JOIN pemanen p ON hr.pemanen_id = p.id
        LEFT JOIN gang g ON p.gang_id = g.id
        LEFT JOIN tph t ON hr.tph_id = t.id
        LEFT JOIN profiles pr ON hr.created_by = pr.id
        WHERE hr.created_at >= $1
        ORDER BY hr.created_at DESC
        LIMIT 100
      `;

      const { rows } = await db.query(query, [startDate.toISOString()]);
      await db.end();

      const formattedRecords: HarvestRecord[] = rows.map((row: any) => ({
        id: row.id,
        tanggal: typeof row.tanggal === 'string' ? row.tanggal : new Date(row.tanggal).toISOString(),
        created_at: typeof row.created_at === 'string' ? row.created_at : new Date(row.created_at).toISOString(),
        divisi_name: row.divisi_name || '-',
        gang_name: row.gang_name || '-',
        blok_names: [row.blok_name || '-'],
        pemanen_details: [{ operator_code: row.operator_code || '-', name: row.pemanen_name || '-' }],
        rotasi: row.rotasi,
        nomor_panen: row.nomor_panen ? parseInt(row.nomor_panen) : 0,
        hasil_panen_jjg: row.hasil_panen_jjg || 0,
        nomor_tph: row.nomor_tph || '-',
        bjr: row.bjr || 0,
        jumlah_brondolan_kg: parseFloat(row.jumlah_brondolan_kg) || 0,
        buah_masak: row.buah_masak || 0,
        buah_mentah: row.buah_mentah || 0,
        buah_mengkal: row.buah_mengkal || 0,
        overripe: row.overripe || 0,
        abnormal: row.abnormal || 0,
        buah_busuk: row.buah_busuk || 0,
        tangkai_panjang: row.tangkai_panjang || 0,
        jangkos: row.jangkos || 0,
        keterangan: row.keterangan || '-',
        foto_url: row.foto_url,
        created_by_name: row.created_by_name || 'Unknown',
      }));

      setRecords(formattedRecords);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily':
        return 'Laporan Harian';
      case 'weekly':
        return 'Laporan Mingguan';
      case 'monthly':
        return 'Laporan Bulanan';
      default:
        return 'Laporan';
    }
  };

  const filteredRecords = records.filter(record => {
    if (filterDivisi && !record.divisi_name.toLowerCase().includes(filterDivisi.toLowerCase())) {
      return false;
    }
    if (filterDate && !formatDate(record.tanggal).includes(filterDate)) {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{getReportTitle()}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.input}
            placeholder="Filter Divisi..."
            value={filterDivisi}
            onChangeText={setFilterDivisi}
          />
          <TextInput
            style={styles.input}
            placeholder="Filter Tanggal (DD/MM/YYYY)..."
            value={filterDate}
            onChangeText={setFilterDate}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d5016" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {filteredRecords.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada data laporan</Text>
            </View>
          ) : (
            filteredRecords.map((record) => (
              <View key={record.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.date}>{formatDate(record.tanggal)}</Text>
                    <Text style={styles.time}>{formatTime(record.created_at)}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{record.divisi_name}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Gang:</Text>
                    <Text style={styles.value}>{record.gang_name}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Blok:</Text>
                    <Text style={styles.value}>{record.blok_names.join(', ')}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Pemanen:</Text>
                    <Text style={styles.value}>
                      {record.pemanen_details.map(p => p.name).join(', ')}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Janjang</Text>
                      <Text style={styles.statValue}>{record.hasil_panen_jjg}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>BJR</Text>
                      <Text style={styles.statValue}>{record.bjr}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Brondolan</Text>
                      <Text style={styles.statValue}>{record.jumlah_brondolan_kg} kg</Text>
                    </View>
                  </View>
                  
                  {record.foto_url && (
                    <TouchableOpacity
                      style={styles.photoButton}
                      onPress={() => setSelectedPhoto(record.foto_url)}
                    >
                      <ImageIcon size={20} color="#2d5016" />
                      <Text style={styles.photoButtonText}>Lihat Foto</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>Input oleh: {record.created_by_name}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowExportModal(true)}
      >
        <Download size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedPhoto(null)}
          >
            <X size={30} color="#fff" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <ExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportType={reportType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#2d5016',
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    gap: 8,
  },
  photoButtonText: {
    color: '#2d5016',
    fontWeight: '500',
  },
  cardFooter: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2d5016',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
