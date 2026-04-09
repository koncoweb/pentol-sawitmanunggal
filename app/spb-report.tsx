import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Printer, Search, Calendar, Filter } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import Dropdown from '@/components/Dropdown';
import { generateSpbHtml } from '@/lib/spb-printer';

interface SpbSummary {
  id: string;
  nomor_spb: string;
  tanggal: string;
  estate_name: string;
  divisi_name: string;
  driver_name: string;
  truck_plate: string;
  total_janjang: number;
  status: string;
}

export default function SpbReportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [spbList, setSpbList] = useState<SpbSummary[]>([]);
  const [estates, setEstates] = useState<any[]>([]);
  
  // Filters
  const [filterEstateId, setFilterEstateId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadMasterData();
    loadSpbData();
  }, []);

  const loadMasterData = async () => {
    try {
      const db = await getDbClient();
      const { rows } = await db.query('SELECT * FROM estates ORDER BY name');
      setEstates(rows);
      await db.end();
    } catch (error) {
      console.error(error);
    }
  };

  const loadSpbData = async () => {
    setLoading(true);
    try {
      const db = await getDbClient();
      
      let query = `
        SELECT 
          s.id,
          s.nomor_spb,
          TO_CHAR(s.tanggal, 'YYYY-MM-DD') as tanggal,
          e.name as estate_name,
          d.name as divisi_name,
          s.driver_name,
          s.truck_plate,
          s.status,
          COALESCE((SELECT SUM(jumlah_janjang) FROM spb_items si WHERE si.spb_id = s.id), 0) as total_janjang
        FROM spb s
        LEFT JOIN estates e ON s.estate_id = e.id
        LEFT JOIN divisi d ON s.divisi_id = d.id
        WHERE s.tanggal BETWEEN $1 AND $2
      `;
      
      const params = [startDate, endDate];
      
      if (filterEstateId) {
        query += ` AND s.estate_id = $3`;
        params.push(filterEstateId);
      }
      
      query += ` ORDER BY s.tanggal DESC, s.created_at DESC`;

      const { rows } = await db.query(query, params);
      setSpbList(rows);
      await db.end();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data SPB');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (spbId: string) => {
    setLoading(true);
    try {
      const db = await getDbClient();
      
      // Fetch SPB Details
      const spbRes = await db.query(`
        SELECT 
          s.*,
          TO_CHAR(s.tanggal, 'YYYY-MM-DD') as tanggal,
          e.name as estate_name,
          d.name as divisi_name,
          v.fleet_number as vehicle_no
        FROM spb s
        LEFT JOIN estates e ON s.estate_id = e.id
        LEFT JOIN divisi d ON s.divisi_id = d.id
        LEFT JOIN vehicles v ON s.vehicle_id = v.id
        WHERE s.id = $1
      `, [spbId]);
      
      if (spbRes.rows.length === 0) {
        Alert.alert('Error', 'Data SPB tidak ditemukan');
        return;
      }
      
      const spbData = spbRes.rows[0];

      // Fetch Items
      const itemsRes = await db.query(`
        SELECT 
          si.*,
          b.name as blok_name
        FROM spb_items si
        LEFT JOIN blok b ON si.blok_id = b.id
        WHERE si.spb_id = $1
        ORDER BY b.name
      `, [spbId]);

      // Fetch Loaders
      const loadersRes = await db.query(`
        SELECT l.name 
        FROM spb_loaders sl
        JOIN loaders l ON sl.loader_id = l.id
        WHERE sl.spb_id = $1
      `, [spbId]);

      await db.end();

      const html = generateSpbHtml({
        nomor_spb: spbData.nomor_spb,
        tanggal: spbData.tanggal,
        estate_name: spbData.estate_name,
        divisi_name: spbData.divisi_name,
        driver_name: spbData.driver_name,
        vehicle_no: spbData.vehicle_no,
        vehicle_plate: spbData.truck_plate,
        loader_names: loadersRes.rows.map((l: any) => l.name).join(', '),
        km_awal: parseFloat(spbData.km_awal) || 0,
        km_akhir: parseFloat(spbData.km_akhir) || 0,
        items: itemsRes.rows.map((item: any) => ({
          blok_name: item.blok_name,
          tahun_tanam: item.tahun_tanam,
          jumlah_janjang: parseFloat(item.jumlah_janjang),
          keterangan: item.keterangan
        }))
      });

      console.log('HTML generated, length:', html.length);

      try {
        const result = await Print.printToFileAsync({ html });
        console.log('PrintToFile result:', result);
        
        if (result && result.uri) {
          await shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } else {
          // If file generation fails/returns empty, fallback to direct print
          console.warn('PrintToFile returned no URI, falling back to printAsync');
          await Print.printAsync({ html });
        }
      } catch (printErr) {
        console.warn('PrintToFile failed, falling back to printAsync:', printErr);
        // Fallback to direct print if file generation throws
        await Print.printAsync({ html });
      }

    } catch (error) {
      console.error('Final print error:', error);
      Alert.alert('Error', 'Gagal memproses dokumen');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: SpbSummary }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.spbNumber}>{item.nomor_spb}</Text>
          <Text style={styles.date}>{item.tanggal}</Text>
        </View>
        <View style={[styles.statusTag, { backgroundColor: item.status === 'shipped' ? '#e8f5e9' : '#fff3e0' }]}>
          <Text style={[styles.statusText, { color: item.status === 'shipped' ? '#2d5016' : '#f57c00' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Lokasi:</Text>
          <Text style={styles.value}>{item.estate_name} - {item.divisi_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Transport:</Text>
          <Text style={styles.value}>{item.truck_plate} ({item.driver_name})</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Total Muatan:</Text>
          <Text style={styles.valueHighlight}>{item.total_janjang} Janjang</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.printButton}
        onPress={() => handlePrint(item.id)}
      >
        <Printer size={20} color="#2d5016" />
        <Text style={styles.printButtonText}>Cetak / Lihat PDF</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan SPB</Text>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filter Data</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>Dari</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.dateInput}>
            <Text style={styles.dateLabel}>Sampai</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        <Dropdown
          label="Estate (Opsional)"
          placeholder="Semua Estate"
          value={filterEstateId}
          items={estates.map(e => ({ label: e.name, value: e.id }))}
          onSelect={setFilterEstateId}
        />

        <TouchableOpacity style={styles.searchButton} onPress={loadSpbData}>
          <Search size={20} color="#fff" />
          <Text style={styles.searchButtonText}>Tampilkan Data</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={spbList}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Tidak ada data SPB ditemukan</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadSpbData}
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
    backgroundColor: '#2d5016',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  spbNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#666',
    fontSize: 14,
  },
  value: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  valueHighlight: {
    color: '#2d5016',
    fontSize: 14,
    fontWeight: 'bold',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  printButtonText: {
    color: '#2d5016',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
