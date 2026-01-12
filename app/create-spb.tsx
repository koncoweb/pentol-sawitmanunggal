import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Truck, User, FileText, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getDbClient } from '@/lib/db';

type HarvestItem = {
  id: string;
  blok_name: string;
  jumlah_jjg: number;
  total_weight: number;
  created_at: string;
  selected: boolean;
};

export default function CreateSpbScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [harvests, setHarvests] = useState<HarvestItem[]>([]);
  
  const [driverName, setDriverName] = useState('');
  const [truckPlate, setTruckPlate] = useState('');

  useEffect(() => {
    loadApprovedHarvests();
  }, []);

  const loadApprovedHarvests = async () => {
    try {
      const db = await getDbClient();
      const { rows } = await db.query(`
        SELECT 
          hr.id,
          b.name as blok_name,
          hr.jumlah_jjg,
          hr.hasil_panen_bjd as total_weight,
          hr.created_at
        FROM harvest_records hr
        JOIN blok b ON hr.blok_id = b.id
        WHERE hr.status = 'approved' 
        AND hr.spb_id IS NULL
        ORDER BY hr.created_at ASC
      `);
      
      setHarvests(rows.map((row: any) => ({
        id: row.id,
        blok_name: row.blok_name,
        jumlah_jjg: row.jumlah_jjg,
        total_weight: parseFloat(row.total_weight),
        created_at: row.created_at,
        selected: false
      })));
      
      await db.end();
    } catch (error) {
      console.error('Error loading harvests:', error);
      Alert.alert('Error', 'Gagal memuat data panen');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setHarvests(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleSubmit = async () => {
    if (!driverName || !truckPlate) {
      Alert.alert('Error', 'Mohon lengkapi data Driver dan Plat Nomor Truk');
      return;
    }

    const selectedHarvests = harvests.filter(h => h.selected);
    if (selectedHarvests.length === 0) {
      Alert.alert('Error', 'Pilih minimal satu data panen');
      return;
    }

    setSubmitting(true);
    try {
      const db = await getDbClient();
      await db.query('BEGIN');

      // Generate SPB Number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const nomorSpb = `SPB/${dateStr}/${randomSuffix}`;

      // Create SPB
      const spbRes = await db.query(`
        INSERT INTO spb (nomor_spb, driver_name, truck_plate, created_by, status)
        VALUES ($1, $2, $3, $4, 'created')
        RETURNING id
      `, [nomorSpb, driverName, truckPlate, profile?.id]);

      const spbId = spbRes.rows[0].id;

      // Update Harvest Records
      for (const item of selectedHarvests) {
        await db.query(`
          UPDATE harvest_records 
          SET spb_id = $1 
          WHERE id = $2
        `, [spbId, item.id]);
      }

      await db.query('COMMIT');
      await db.end();

      Alert.alert('Berhasil', `SPB ${nomorSpb} berhasil dibuat`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      await getDbClient().then(client => client.query('ROLLBACK')); // Attempt rollback
      console.error('Error creating SPB:', error);
      Alert.alert('Error', 'Gagal membuat SPB');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = harvests.filter(h => h.selected).length;
  const totalWeight = harvests.filter(h => h.selected).reduce((sum, item) => sum + item.total_weight, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat SPB Baru</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Data Transport</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Driver</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama driver"
                value={driverName}
                onChangeText={setDriverName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Plat Nomor Truk</Text>
            <View style={styles.inputContainer}>
              <Truck size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contoh: BK 1234 AB"
                value={truckPlate}
                onChangeText={setTruckPlate}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Pilih Data Panen (Approved)</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#2d5016" />
          ) : harvests.length === 0 ? (
            <Text style={styles.emptyText}>Tidak ada data panen yang siap angkut</Text>
          ) : (
            harvests.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.harvestCard, item.selected && styles.harvestCardSelected]}
                onPress={() => toggleSelection(item.id)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.blokName}>Blok {item.blok_name}</Text>
                  {item.selected && <CheckCircle size={20} color="#2d5016" />}
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>{item.jumlah_jjg} Janjang</Text>
                  <Text style={styles.detailText}>{item.total_weight} Kg</Text>
                  <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{selectedCount} Item Dipilih</Text>
          <Text style={styles.summaryWeight}>Total: {totalWeight} Kg</Text>
        </View>
        <TouchableOpacity 
          style={[styles.submitButton, (submitting || selectedCount === 0) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitting || selectedCount === 0}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FileText size={20} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitText}>Buat SPB</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  listSection: {
    marginBottom: 80, // Space for footer
  },
  harvestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  harvestCardSelected: {
    borderColor: '#2d5016',
    backgroundColor: '#f1f8e9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  blokName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summary: {
    flex: 1,
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
  },
  summaryWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d5016',
  },
  submitButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
