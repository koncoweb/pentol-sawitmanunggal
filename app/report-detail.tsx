import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { ArrowLeft, Calendar, Filter, Image as ImageIcon, X, Download, ChevronDown, ChevronUp, WifiOff } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { runQuery, useOfflineData, syncHarvestQueue } from '@/lib/offline';
import ExportModal from '@/components/ExportModal';
import * as FileSystem from 'expo-file-system';

type HarvestRecord = {
  id: string;
  tanggal: string;
  created_at: string;
  divisi_name: string;
  estate_name: string;
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
  is_local?: boolean;
};

const HarvestImage = ({ url, onPress }: { url: string | null, onPress: () => void }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (url) console.log('Rendering HarvestImage with URL:', url);
  }, [url]);

  if (!url) {
    return (
      <View style={[styles.thumbnail, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
        <Text style={{ fontSize: 10, color: '#999' }}>No Img</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.thumbnail, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffebee' }]}>
        <ImageIcon size={20} color="#e53935" />
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress}>
      <Image 
        source={{ uri: url }} 
        style={[styles.thumbnail, { borderWidth: 1, borderColor: '#ccc' }]} 
        resizeMode="cover"
        onError={(e) => {
          console.log('Image load error:', url);
          setHasError(true);
        }}
      />
    </TouchableOpacity>
  );
};

export default function ReportDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { profile } = useAuth();
  const params = useLocalSearchParams();
  const reportType = params.type as string;

  const [records, setRecords] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDivisi, setFilterDivisi] = useState<string>('');
  
  // New Filter States
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null means all months
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // null means all days
  
  const [showFilters, setShowFilters] = useState(false);
  const [activePicker, setActivePicker] = useState<'year' | 'month' | 'day' | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HarvestRecord | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = [2024, 2025, 2026, 2027];

  useEffect(() => {
    console.log('ReportDetailScreen mounted v3 (Enhanced Filters)');
    loadReportData();
  }, [reportType, selectedYear, selectedMonth, selectedDay]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      let allRecords: HarvestRecord[] = [];

      // 1. Fetch Local Pending Records (SQLite)
      try {
        const localRows = await runQuery(`
          SELECT 
            q.*, 
            d.name as divisi_name, 
            d.estate_name,
            b.name as blok_name,
            p.operator_code,
            p.name as pemanen_name,
            t.nomor_tph
          FROM harvest_records_queue q
          LEFT JOIN divisi d ON q.divisi_id = d.id
          LEFT JOIN blok b ON q.blok_id = b.id
          LEFT JOIN pemanen p ON q.pemanen_id = p.id
          LEFT JOIN tph t ON q.tph_id = t.id
          WHERE q.status != 'synced'
        `);

        const formattedLocal: HarvestRecord[] = localRows.map((row: any) => ({
          id: `local-${row.local_id}`,
          tanggal: row.tanggal,
          created_at: row.created_at || new Date().toISOString(),
          divisi_name: row.divisi_name || 'Local Divisi',
          estate_name: row.estate_name || 'Local Estate',
          gang_name: '-',
          blok_names: [row.blok_name || '-'],
          pemanen_details: [{ operator_code: row.operator_code || '-', name: row.pemanen_name || '-' }],
          rotasi: row.rotasi,
          nomor_panen: row.nomor_panen ? parseInt(row.nomor_panen) : 0,
          hasil_panen_jjg: row.jumlah_jjg || 0,
          nomor_tph: row.nomor_tph || row.nomor_panen || '-',
          bjr: row.bjr || 0,
          jumlah_brondolan_kg: row.jumlah_brondolan_kg || 0,
          buah_masak: row.buah_masak || 0,
          buah_mentah: row.buah_mentah || 0,
          buah_mengkal: row.buah_mengkal || 0,
          overripe: row.overripe || 0,
          abnormal: row.abnormal || 0,
          buah_busuk: row.buah_busuk || 0,
          tangkai_panjang: row.tangkai_panjang || 0,
          jangkos: row.jangkos || 0,
          keterangan: row.keterangan || '-',
          foto_url: row.foto_path || null,
          created_by_name: 'Me (Offline)',
          is_local: true,
        }));
        allRecords = [...formattedLocal];
      } catch (localErr) {
        console.error('Error fetching local records:', localErr);
      }

      // 2. Fetch Remote Records (NeonDB)
      try {
        const db = await getDbClient();
        
        let whereClause = 'WHERE 1=1';
        const queryParams: any[] = [];
        let paramIdx = 1;

        // Filter by Year
        whereClause += ` AND EXTRACT(YEAR FROM hr.tanggal) = $${paramIdx++}`;
        queryParams.push(selectedYear);

        // Filter by Month (if selected)
        if (selectedMonth !== null) {
          whereClause += ` AND EXTRACT(MONTH FROM hr.tanggal) = $${paramIdx++}`;
          queryParams.push(selectedMonth + 1);
        }

        // Filter by Day (if selected)
        if (selectedDay !== null) {
          whereClause += ` AND EXTRACT(DAY FROM hr.tanggal) = $${paramIdx++}`;
          queryParams.push(selectedDay);
        }

        if (selectedMonth === null && selectedDay === null) {
          if (reportType === 'daily') {
            whereClause += ` AND hr.tanggal = CURRENT_DATE`;
          } else if (reportType === 'weekly') {
            whereClause += ` AND hr.tanggal >= CURRENT_DATE - INTERVAL '7 days'`;
          } else if (reportType === 'monthly') {
            whereClause += ` AND EXTRACT(MONTH FROM hr.tanggal) = EXTRACT(MONTH FROM CURRENT_DATE)`;
          }
        }
        
        const query = `
          SELECT
            hr.id, hr.tanggal, hr.created_at, d.name as divisi_name, d.estate_name,
            g.name as gang_name, b.name as blok_name, p.nik as operator_code,
            p.name as pemanen_name, hr.rotasi, hr.nomor_panen, hr.jumlah_jjg as hasil_panen_jjg,
            t.name as nomor_tph, hr.bjr, hr.jumlah_brondolan_kg, hr.buah_masak,
            hr.buah_mentah, hr.buah_mengkal, hr.overripe, hr.abnormal, hr.buah_busuk,
            hr.tangkai_panjang, hr.jangkos, hr.keterangan, hr.foto_url,
            pr.full_name as created_by_name
          FROM harvest_records hr
          LEFT JOIN divisi d ON hr.divisi_id = d.id
          LEFT JOIN blok b ON hr.blok_id = b.id
          LEFT JOIN pemanen p ON hr.pemanen_id = p.id
          LEFT JOIN gang g ON p.gang_id = g.id
          LEFT JOIN tph t ON hr.tph_id = t.id
          LEFT JOIN profiles pr ON hr.created_by = pr.id
          ${whereClause}
          ORDER BY hr.tanggal DESC, hr.created_at DESC
          LIMIT 1000
        `;

        const { rows } = await db.query(query, queryParams);

        // Process photos
        const photoIds = rows
          .map((r: any) => r.foto_url)
          .filter((url: string | null) => url && url.startsWith('db-photo://'))
          .map((url: string) => url.replace('db-photo://', ''));

        const photoMap = new Map<string, string>();
        if (photoIds.length > 0) {
          const photoQuery = `SELECT id, photo_data FROM harvest_photos WHERE id = ANY($1::uuid[])`;
          const photoResult = await db.query(photoQuery, [photoIds]);
          photoResult.rows.forEach((row: any) => {
            if (row.photo_data) {
              const prefix = row.photo_data.startsWith('data:') ? '' : 'data:image/jpeg;base64,';
              photoMap.set(row.id, `${prefix}${row.photo_data}`);
            }
          });
        }

        await db.end();

        const formattedRemote: HarvestRecord[] = rows.map((row: any) => {
          let finalPhotoUrl = row.foto_url;
          if (finalPhotoUrl && finalPhotoUrl.startsWith('db-photo://')) {
              const id = finalPhotoUrl.replace('db-photo://', '');
              finalPhotoUrl = photoMap.get(id) || null;
          }

          return {
            id: row.id,
            tanggal: typeof row.tanggal === 'string' ? row.tanggal : new Date(row.tanggal).toISOString(),
            created_at: typeof row.created_at === 'string' ? row.created_at : new Date(row.created_at).toISOString(),
            divisi_name: row.divisi_name || '-',
            estate_name: row.estate_name || 'Unknown Estate',
            gang_name: row.gang_name || '-',
            blok_names: [row.blok_name || '-'],
            pemanen_details: [{ operator_code: row.operator_code || '-', name: row.pemanen_name || '-' }],
            rotasi: row.rotasi,
            nomor_panen: row.nomor_panen ? parseInt(row.nomor_panen) : 0,
            hasil_panen_jjg: row.hasil_panen_jjg || 0,
            nomor_tph: row.nomor_tph || row.nomor_panen || '-',
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
            foto_url: finalPhotoUrl,
            created_by_name: row.created_by_name || 'Unknown',
            is_local: false,
          };
        });

        allRecords = [...allRecords, ...formattedRemote];
      } catch (remoteErr: any) {
        console.log('Remote fetch failed (probably offline):', remoteErr.message);
        // If we have no records at all and remote failed, show error
        if (allRecords.length === 0) {
            setError('Gagal memuat data dari server. Menampilkan data lokal jika ada.');
        }
      }

      setRecords(allRecords);
    } catch (error: any) {
      console.error('Error loading report data:', error);
      setError(error.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncHarvestQueue();
      await loadReportData();
    } catch (err) {
      console.error('Manual refresh sync failed:', err);
    } finally {
      setRefreshing(false);
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

  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/reports');
    }
  };

  const filteredRecords = records.filter((record: HarvestRecord) => {
    if (filterDivisi && !record.divisi_name.toLowerCase().includes(filterDivisi.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totals = useMemo(() => {
    return filteredRecords.reduce((acc: any, record: HarvestRecord) => ({
      hasil_panen_jjg: acc.hasil_panen_jjg + (record.hasil_panen_jjg || 0),
      jumlah_brondolan_kg: acc.jumlah_brondolan_kg + (record.jumlah_brondolan_kg || 0),
      buah_masak: acc.buah_masak + (record.buah_masak || 0),
      buah_mentah: acc.buah_mentah + (record.buah_mentah || 0),
      buah_mengkal: acc.buah_mengkal + (record.buah_mengkal || 0),
      overripe: acc.overripe + (record.overripe || 0),
      abnormal: acc.abnormal + (record.abnormal || 0),
      buah_busuk: acc.buah_busuk + (record.buah_busuk || 0),
      tangkai_panjang: acc.tangkai_panjang + (record.tangkai_panjang || 0),
      jangkos: acc.jangkos + (record.jangkos || 0),
    }), {
      hasil_panen_jjg: 0,
      jumlah_brondolan_kg: 0,
      buah_masak: 0,
      buah_mentah: 0,
      buah_mengkal: 0,
      overripe: 0,
      abnormal: 0,
      buah_busuk: 0,
      tangkai_panjang: 0,
      jangkos: 0,
    });
  }, [filteredRecords]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
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
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter Laporan</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <ChevronUp size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Divisi</Text>
          <TextInput
            style={styles.input}
            placeholder="Ketik nama divisi..."
            value={filterDivisi}
            onChangeText={setFilterDivisi}
          />

          <View style={styles.dropdownRow}>
            <View style={styles.dropdownCol}>
              <Text style={styles.filterLabel}>Tahun</Text>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => setActivePicker('year')}
              >
                <Text style={styles.dropdownButtonText}>{selectedYear}</Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.dropdownCol}>
              <Text style={styles.filterLabel}>Bulan</Text>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => setActivePicker('month')}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedMonth !== null ? months[selectedMonth] : 'Semua'}
                </Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.dropdownCol}>
              <Text style={styles.filterLabel}>Tanggal</Text>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => setActivePicker('day')}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedDay !== null ? selectedDay : 'Semua'}
                </Text>
                <ChevronDown size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              setSelectedYear(new Date().getFullYear());
              setSelectedMonth(null);
              setSelectedDay(null);
              setFilterDivisi('');
            }}
          >
            <Text style={styles.resetButtonText}>Reset Filter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Picker Modal */}
      <Modal
        visible={activePicker !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity 
          style={styles.pickerModalOverlay} 
          activeOpacity={1} 
          onPress={() => setActivePicker(null)}
        >
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>
                Pilih {activePicker === 'year' ? 'Tahun' : activePicker === 'month' ? 'Bulan' : 'Tanggal'}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {activePicker === 'year' && years.map(year => (
                <TouchableOpacity 
                  key={year} 
                  style={[styles.pickerItem, selectedYear === year && styles.pickerItemActive]}
                  onPress={() => { setSelectedYear(year); setActivePicker(null); }}
                >
                  <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextActive]}>{year}</Text>
                </TouchableOpacity>
              ))}
              {activePicker === 'month' && (
                <>
                  <TouchableOpacity 
                    style={[styles.pickerItem, selectedMonth === null && styles.pickerItemActive]}
                    onPress={() => { setSelectedMonth(null); setActivePicker(null); }}
                  >
                    <Text style={[styles.pickerItemText, selectedMonth === null && styles.pickerItemTextActive]}>Semua Bulan</Text>
                  </TouchableOpacity>
                  {months.map((month, idx) => (
                    <TouchableOpacity 
                      key={month} 
                      style={[styles.pickerItem, selectedMonth === idx && styles.pickerItemActive]}
                      onPress={() => { setSelectedMonth(idx); setActivePicker(null); }}
                    >
                      <Text style={[styles.pickerItemText, selectedMonth === idx && styles.pickerItemTextActive]}>{month}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {activePicker === 'day' && (
                <>
                  <TouchableOpacity 
                    style={[styles.pickerItem, selectedDay === null && styles.pickerItemActive]}
                    onPress={() => { setSelectedDay(null); setActivePicker(null); }}
                  >
                    <Text style={[styles.pickerItemText, selectedDay === null && styles.pickerItemTextActive]}>Semua Tanggal</Text>
                  </TouchableOpacity>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <TouchableOpacity 
                      key={day} 
                      style={[styles.pickerItem, selectedDay === day && styles.pickerItemActive]}
                      onPress={() => { setSelectedDay(day); setActivePicker(null); }}
                    >
                      <Text style={[styles.pickerItemText, selectedDay === day && styles.pickerItemTextActive]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d5016" />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: '#e53935', marginBottom: 16 }]}>{error}</Text>
          <TouchableOpacity 
            onPress={loadReportData} 
            style={{ 
              paddingVertical: 10, 
              paddingHorizontal: 20, 
              backgroundColor: '#2d5016', 
              borderRadius: 8 
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 100 }]}>Tanggal</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120 }]}>Divisi</Text>
                  <Text style={[styles.tableHeaderCell, { width: 100 }]}>Gang</Text>
                  <Text style={[styles.tableHeaderCell, { width: 100 }]}>Blok</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>TPH</Text>
                  <Text style={[styles.tableHeaderCell, { width: 150 }]}>Pemanen</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80, textAlign: 'right' }]}>Janjang</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80, textAlign: 'right' }]}>Brd (kg)</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60, textAlign: 'right' }]}>Masak</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60, textAlign: 'right' }]}>Mentah</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60, textAlign: 'right' }]}>Mengkal</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60, textAlign: 'right' }]}>Over</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60, textAlign: 'right' }]}>Abn</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60, textAlign: 'right' }]}>Busuk</Text>
                  <Text style={[styles.tableHeaderCell, { width: 70, textAlign: 'right' }]}>T. Pjg</Text>
                  <Text style={[styles.tableHeaderCell, { width: 70, textAlign: 'right' }]}>Jangkos</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80, textAlign: 'center' }]}>Foto</Text>
                </View>

                {filteredRecords.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Tidak ada data laporan</Text>
                  </View>
                ) : (
                  <>
                    {filteredRecords.map((record, index) => (
                      <View key={record.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt, record.is_local && { backgroundColor: '#fffde7' }]}>
                        <View style={[styles.tableCell, { width: 100, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 12 }}>{formatDate(record.tanggal)}</Text>
                          {record.is_local && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                              <WifiOff size={10} color="#f57c00" />
                              <Text style={{ fontSize: 8, color: '#f57c00', fontWeight: 'bold', marginLeft: 2 }}>PENDING SYNC</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.tableCell, { width: 120 }]}>{record.divisi_name}</Text>
                        <Text style={[styles.tableCell, { width: 100 }]}>{record.gang_name}</Text>
                        <Text style={[styles.tableCell, { width: 100 }]}>{record.blok_names.join(', ')}</Text>
                        <Text style={[styles.tableCell, { width: 80 }]}>{record.nomor_tph}</Text>
                        <Text style={[styles.tableCell, { width: 150 }]}>
                          {record.pemanen_details.map(p => p.name).join(', ')}
                        </Text>
                        <Text style={[styles.tableCell, { width: 80, textAlign: 'right' }]}>{record.hasil_panen_jjg}</Text>
                        <Text style={[styles.tableCell, { width: 80, textAlign: 'right' }]}>{record.jumlah_brondolan_kg}</Text>
                        <Text style={[styles.tableCell, { width: 60, textAlign: 'right' }]}>{record.buah_masak}</Text>
                        <Text style={[styles.tableCell, { width: 60, textAlign: 'right' }]}>{record.buah_mentah}</Text>
                        <Text style={[styles.tableCell, { width: 60, textAlign: 'right' }]}>{record.buah_mengkal}</Text>
                        <Text style={[styles.tableCell, { width: 60, textAlign: 'right' }]}>{record.overripe}</Text>
                        <Text style={[styles.tableCell, { width: 60, textAlign: 'right' }]}>{record.abnormal}</Text>
                        <Text style={[styles.tableCell, { width: 60, textAlign: 'right' }]}>{record.buah_busuk}</Text>
                        <Text style={[styles.tableCell, { width: 70, textAlign: 'right' }]}>{record.tangkai_panjang}</Text>
                        <Text style={[styles.tableCell, { width: 70, textAlign: 'right' }]}>{record.jangkos}</Text>
                        <View style={[styles.tableCell, { width: 80, alignItems: 'center', justifyContent: 'center' }]}>
                          <HarvestImage 
                            url={record.foto_url} 
                            onPress={() => record.foto_url && setSelectedRecord(record)}
                          />
                        </View>
                      </View>
                    ))}
                    {/* Total Row */}
                    <View style={[styles.tableRow, { backgroundColor: '#e8f5e9', borderTopWidth: 2, borderTopColor: '#2d5016' }]}>
                      <Text style={[styles.tableCell, { width: 100, fontWeight: 'bold' }]}>TOTAL</Text>
                      <Text style={[styles.tableCell, { width: 120 }]}></Text>
                      <Text style={[styles.tableCell, { width: 100 }]}></Text>
                      <Text style={[styles.tableCell, { width: 100 }]}></Text>
                      <Text style={[styles.tableCell, { width: 80 }]}></Text>
                      <Text style={[styles.tableCell, { width: 150 }]}></Text>
                      <Text style={[styles.tableCell, { width: 80, textAlign: 'right', fontWeight: 'bold' }]}>{totals.hasil_panen_jjg}</Text>
                      <Text style={[styles.tableCell, { width: 80, textAlign: 'right', fontWeight: 'bold' }]}>{totals.jumlah_brondolan_kg.toFixed(2)}</Text>
                      <Text style={[styles.tableCell, { width: 60, textAlign: 'right', fontWeight: 'bold' }]}>{totals.buah_masak}</Text>
                      <Text style={[styles.tableCell, { width: 60, textAlign: 'right', fontWeight: 'bold' }]}>{totals.buah_mentah}</Text>
                      <Text style={[styles.tableCell, { width: 60, textAlign: 'right', fontWeight: 'bold' }]}>{totals.buah_mengkal}</Text>
                      <Text style={[styles.tableCell, { width: 60, textAlign: 'right', fontWeight: 'bold' }]}>{totals.overripe}</Text>
                      <Text style={[styles.tableCell, { width: 60, textAlign: 'right', fontWeight: 'bold' }]}>{totals.abnormal}</Text>
                      <Text style={[styles.tableCell, { width: 60, textAlign: 'right', fontWeight: 'bold' }]}>{totals.buah_busuk}</Text>
                      <Text style={[styles.tableCell, { width: 70, textAlign: 'right', fontWeight: 'bold' }]}>{totals.tangkai_panjang}</Text>
                      <Text style={[styles.tableCell, { width: 70, textAlign: 'right', fontWeight: 'bold' }]}>{totals.jangkos}</Text>
                      <View style={[styles.tableCell, { width: 80 }]}></View>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowExportModal(true)}
      >
        <Download size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={!!selectedRecord}
        transparent={true}
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedRecord(null)}
          >
            <X size={30} color="#fff" />
          </TouchableOpacity>
          {selectedRecord && selectedRecord.foto_url && (
            <View style={styles.fullImageContainer}>
              <Image
                source={{ uri: selectedRecord.foto_url }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              <View style={styles.timestampOverlay}>
                <Image 
                  source={require('@/assets/images/lg-aep-cmyk-300dpi.jpg')} 
                  style={styles.timestampLogo} 
                  resizeMode="contain" 
                />
                <View>
                  <Text style={styles.timestampText}>
                    {selectedRecord.estate_name}
                  </Text>
                  <Text style={styles.timestampText}>
                    Divisi: {selectedRecord.divisi_name}
                  </Text>
                  <Text style={styles.timestampText}>
                    {new Date(selectedRecord.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, Waktu: {new Date(selectedRecord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </Text>
                  <Text style={styles.timestampText}>
                    TPH: {selectedRecord.nomor_tph}
                  </Text>
                </View>
              </View>
            </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    marginTop: 4,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dropdownCol: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownButtonText: {
    fontSize: 13,
    color: '#333',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerList: {
    padding: 10,
  },
  pickerItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: '#e8f5e9',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextActive: {
    color: '#2d5016',
    fontWeight: 'bold',
  },
  resetButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ffebee',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#e53935',
    fontWeight: 'bold',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 150, // Menambah jarak bawah agar baris TOTAL tidak tertutup tombol download
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2d5016',
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 4,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  tableCell: {
    fontSize: 11,
    color: '#333',
    paddingHorizontal: 4,
    textAlign: 'left',
  },
  thumbnail: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  noData: {
    fontSize: 12,
    color: '#999',
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
  fullImageContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  timestampOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 10,
  },
  timestampLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  timestampText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
