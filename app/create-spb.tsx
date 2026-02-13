import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft,
  Plus,
  Trash2,
  Printer,
  Save,
  CheckSquare,
  Square,
  X
} from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import Dropdown from '@/components/Dropdown';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useAuth } from '@/contexts/AuthContext';
import { generateSpbHtml } from '@/lib/spb-printer';

interface MasterData {
  id: string;
  name?: string;
  fleet_number?: string;
  plate_number?: string;
}

interface SpbItem {
  blok_id: string;
  tahun_tanam: string;
  jumlah_janjang: string;
  keterangan: string;
  harvest_record_ids?: string[]; // IDs of harvest records linked to this item
}

interface RestanGroup {
  key: string; // Unique key for list
  estate_id: string;
  estate_name: string;
  divisi_id: string;
  divisi_name: string;
  blok_id: string;
  blok_name: string;
  tahun_tanam: string;
  total_janjang: number;
  harvest_ids: string[];
}

export default function CreateSpbScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Restan Selection State
  const [restanModalVisible, setRestanModalVisible] = useState(false);
  const [restanGroups, setRestanGroups] = useState<RestanGroup[]>([]);
  const [selectedRestanKeys, setSelectedRestanKeys] = useState<string[]>([]);
  const [loadingRestan, setLoadingRestan] = useState(false);

  const yearOptions = Array.from({ length: 2045 - 1998 + 1 }, (_, i) => {
    const y = 1998 + i;
    return { label: String(y), value: String(y) };
  });
  
  // Master Data Lists
  const [estates, setEstates] = useState<any[]>([]);
  const [divisi, setDivisi] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loaders, setLoaders] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  // Form State
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    estate_id: '',
    divisi_id: '',
    driver_id: '',
    vehicle_id: '',
    loader_ids: [] as string[],
    km_awal: '',
    km_akhir: '',
    nomor_spb: '', // Auto-generated or manual? Let's make it auto or manual input.
  });

  const [items, setItems] = useState<SpbItem[]>([
    { blok_id: '', tahun_tanam: '', jumlah_janjang: '', keterangan: '' }
  ]);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const db = await getDbClient();
      
      const [estRes, divRes, drvRes, vehRes, ldrRes, blkRes] = await Promise.all([
        db.query('SELECT * FROM estates ORDER BY name'),
        db.query('SELECT * FROM divisi ORDER BY name'),
        db.query("SELECT * FROM drivers WHERE status = 'active' ORDER BY name"),
        db.query("SELECT * FROM vehicles WHERE status = 'active' ORDER BY fleet_number"),
        db.query("SELECT * FROM loaders WHERE status = 'active' ORDER BY name"),
        db.query('SELECT * FROM blok ORDER BY name'),
      ]);

      setEstates(estRes.rows);
      setDivisi(divRes.rows);
      setDrivers(drvRes.rows);
      setVehicles(vehRes.rows);
      setLoaders(ldrRes.rows);
      setBlocks(blkRes.rows);
      
      await db.end();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat master data');
    } finally {
      setLoading(false);
    }
  };

  const loadRestan = async () => {
    setLoadingRestan(true);
    setRestanModalVisible(true);
    try {
      const db = await getDbClient();
      // Fetch approved harvest records that are not yet in SPB
      const { rows } = await db.query(`
        SELECT 
          hr.id,
          hr.jumlah_jjg,
          b.id as blok_id,
          b.name as blok_name,
          b.tahun_tanam,
          d.id as divisi_id,
          d.name as divisi_name,
          d.estate_name
        FROM harvest_records hr
        JOIN blok b ON hr.blok_id = b.id
        JOIN divisi d ON hr.divisi_id = d.id
        WHERE hr.status = 'approved' 
          AND hr.spb_id IS NULL
          AND hr.tanggal = CURRENT_DATE
      `);
      
      const groups: Record<string, RestanGroup> = {};
      
      for (const row of rows) {
        // Find estate_id from loaded estates
        const estateObj = estates.find(e => e.name === row.estate_name);
        const estateId = estateObj?.id || '';
        
        const key = `${estateId}_${row.divisi_id}_${row.blok_id}`;
        
        if (!groups[key]) {
          groups[key] = {
            key,
            estate_id: estateId,
            estate_name: row.estate_name || '-',
            divisi_id: row.divisi_id,
            divisi_name: row.divisi_name,
            blok_id: row.blok_id,
            blok_name: row.blok_name,
            tahun_tanam: String(row.tahun_tanam),
            total_janjang: 0,
            harvest_ids: []
          };
        }
        
        groups[key].total_janjang += parseInt(row.jumlah_jjg || 0);
        groups[key].harvest_ids.push(row.id);
      }
      
      setRestanGroups(Object.values(groups));
      await db.end();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data restan');
    } finally {
      setLoadingRestan(false);
    }
  };

  const toggleRestanSelection = (key: string) => {
    if (selectedRestanKeys.includes(key)) {
      setSelectedRestanKeys(selectedRestanKeys.filter(k => k !== key));
    } else {
      setSelectedRestanKeys([...selectedRestanKeys, key]);
    }
  };

  const confirmRestanSelection = () => {
    if (selectedRestanKeys.length === 0) {
      setRestanModalVisible(false);
      return;
    }

    const selectedGroups = restanGroups.filter(g => selectedRestanKeys.includes(g.key));
    
    // Auto-fill header info from first selected group if not set
    const firstGroup = selectedGroups[0];
    if (firstGroup) {
      if (!form.estate_id && firstGroup.estate_id) {
        setForm(f => ({ ...f, estate_id: firstGroup.estate_id }));
      }
      if (!form.divisi_id && firstGroup.divisi_id) {
        setForm(f => ({ ...f, divisi_id: firstGroup.divisi_id }));
      }
    }

    // Convert groups to SPB items
    const newItems: SpbItem[] = selectedGroups.map(g => ({
      blok_id: g.blok_id,
      tahun_tanam: g.tahun_tanam,
      jumlah_janjang: String(g.total_janjang),
      keterangan: 'Dari Panen Hari Ini',
      harvest_record_ids: g.harvest_ids
    }));

    // Replace empty initial item if exists
    if (items.length === 1 && !items[0].blok_id) {
      setItems(newItems);
    } else {
      setItems([...items, ...newItems]);
    }

    setRestanModalVisible(false);
    setSelectedRestanKeys([]);
  };

  const addItem = () => {
    setItems([...items, { blok_id: '', tahun_tanam: '', jumlah_janjang: '', keterangan: '' }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof SpbItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handlePrint = async () => {
    try {
      const estateName = estates.find(e => e.id === form.estate_id)?.name || '-';
      const divisiName = divisi.find(d => d.id === form.divisi_id)?.name || '-';
      const driverName = drivers.find(d => d.id === form.driver_id)?.name || '-';
      const vehicle = vehicles.find(v => v.id === form.vehicle_id);
      const vehicleNo = vehicle?.fleet_number || '-';
      const vehiclePlate = vehicle?.plate_number || '-';
      const loaderNames = loaders
        .filter(l => form.loader_ids.includes(l.id))
        .map(l => l.name)
        .join(', ') || '-';

      const html = generateSpbHtml({
        nomor_spb: form.nomor_spb || '(Draft)',
        tanggal: form.tanggal,
        estate_name: estateName,
        divisi_name: divisiName,
        driver_name: driverName,
        vehicle_no: vehicleNo,
        vehicle_plate: vehiclePlate,
        loader_names: loaderNames,
        km_awal: parseFloat(form.km_awal) || 0,
        km_akhir: parseFloat(form.km_akhir) || 0,
        items: items.map(item => ({
          blok_name: blocks.find(b => b.id === item.blok_id)?.name || '-',
          tahun_tanam: item.tahun_tanam,
          jumlah_janjang: parseFloat(item.jumlah_janjang) || 0,
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
          console.warn('PrintToFile returned no URI, falling back to printAsync');
          await Print.printAsync({ html });
        }
      } catch (printErr) {
        console.warn('PrintToFile failed, falling back to printAsync:', printErr);
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memproses dokumen');
    }
  };

  const handleSave = async () => {
    if (!form.divisi_id || !form.driver_id || !form.vehicle_id) {
      Alert.alert('Error', 'Mohon lengkapi data utama');
      return;
    }
    if (!profile?.id) {
      Alert.alert('Error', 'Profil user tidak ditemukan. Silakan login ulang.');
      return;
    }

    setSubmitting(true);
    try {
      const db = await getDbClient();
      await db.query('BEGIN');

      // Generate SPB Number if empty (simple logic for now: SPB/YYYYMMDD/Random)
      const spbNo = form.nomor_spb || `SPB/${form.tanggal.replace(/-/g, '')}/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // Insert SPB
      const spbRes = await db.query(
        `INSERT INTO spb (
          nomor_spb, tanggal, divisi_id, estate_id, driver_id, vehicle_id, loader_id, 
          km_awal, km_akhir, status, driver_name, truck_plate, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'created', $10, $11, $12) RETURNING id`,
        [
          spbNo,
          form.tanggal,
          form.divisi_id,
          form.estate_id,
          form.driver_id,
          form.vehicle_id,
          form.loader_ids[0] || null,
          parseFloat(form.km_awal) || 0,
          parseFloat(form.km_akhir) || 0,
          drivers.find(d => d.id === form.driver_id)?.name || '', // Fallback text
          vehicles.find(v => v.id === form.vehicle_id)?.plate_number || '', // Fallback text
          profile.id
        ]
      );

      const spbId = spbRes.rows[0].id;

      // Insert loaders mapping if any
      if (form.loader_ids.length > 0) {
        for (const lid of form.loader_ids) {
          await db.query(
            `INSERT INTO spb_loaders (spb_id, loader_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [spbId, lid]
          );
        }
      }
      // Insert Items
      for (const item of items) {
        if (item.blok_id && item.jumlah_janjang) {
          const spbItemRes = await db.query(
            `INSERT INTO spb_items (spb_id, blok_id, tahun_tanam, jumlah_janjang, keterangan)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
              spbId,
              item.blok_id,
              item.tahun_tanam ? parseInt(item.tahun_tanam, 10) : null,
              parseFloat(item.jumlah_janjang),
              item.keterangan
            ]
          );

          // Update harvest_records with this spb_id if they came from restan
          if (item.harvest_record_ids && item.harvest_record_ids.length > 0) {
            for (const hrId of item.harvest_record_ids) {
              await db.query(
                `UPDATE harvest_records SET spb_id = $1 WHERE id = $2`,
                [spbId, hrId]
              );
            }
          }
        }
      }

      await db.query('COMMIT');
      await db.end();

      Alert.alert(
        'Sukses',
        'SPB berhasil disimpan',
        [
          { text: 'Cetak PDF', onPress: handlePrint },
          { text: 'Selesai', onPress: () => router.back() }
        ]
      );

    } catch (error) {
      await getDbClient().then(client => client.query('ROLLBACK'));
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan SPB');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat SPB</Text>
        <TouchableOpacity onPress={handlePrint} style={styles.printButton}>
          <Printer size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Umum</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Tanggal</Text>
              <TextInput
                style={styles.input}
                value={form.tanggal}
                onChangeText={text => setForm({ ...form, tanggal: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Nomor SPB (Opsional)</Text>
              <TextInput
                style={styles.input}
                value={form.nomor_spb}
                onChangeText={text => setForm({ ...form, nomor_spb: text })}
                placeholder="Auto Generate"
              />
            </View>
          </View>

          <Dropdown
            label="Estate"
            placeholder="Pilih Estate"
            value={form.estate_id}
            items={estates.map(e => ({ label: e.name, value: e.id }))}
            onSelect={val => setForm({ ...form, estate_id: val })}
            searchable
          />

          <Dropdown
            label="Divisi"
            placeholder="Pilih Divisi"
            value={form.divisi_id}
            items={divisi.map(d => ({ label: d.name, value: d.id }))}
            onSelect={val => setForm({ ...form, divisi_id: val })}
            searchable
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transport & Pemuat</Text>
          
          <Dropdown
            label="Driver / Operator"
            placeholder="Pilih Driver"
            value={form.driver_id}
            items={drivers.map(d => ({ label: d.name, value: d.id }))}
            onSelect={val => setForm({ ...form, driver_id: val })}
            searchable
          />

          <Dropdown
            label="Kendaraan"
            placeholder="Pilih Kendaraan"
            value={form.vehicle_id}
            items={vehicles.map(v => ({ label: `${v.fleet_number} - ${v.plate_number}`, value: v.id }))}
            onSelect={val => setForm({ ...form, vehicle_id: val })}
            searchable
          />

          <MultiSelectDropdown
            label="Pemuat"
            placeholder="Pilih Pemuat"
            value={form.loader_ids}
            items={loaders.map(l => ({ label: l.name, value: l.id }))}
            onSelect={vals => setForm({ ...form, loader_ids: vals })}
            searchable
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>KM/HM Awal</Text>
              <TextInput
                style={styles.input}
                value={form.km_awal}
                onChangeText={text => setForm({ ...form, km_awal: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>KM/HM Akhir</Text>
              <TextInput
                style={styles.input}
                value={form.km_akhir}
                onChangeText={text => setForm({ ...form, km_akhir: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
              
              <View style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 13, color: '#333' }}>
                  Selisih KM Perjalanan: {(() => {
                    const awal = parseFloat(form.km_awal);
                    const akhir = parseFloat(form.km_akhir);
                    if (isNaN(awal) || isNaN(akhir)) return '0';
                    const diff = Math.max(0, akhir - awal);
                    return String(diff);
                  })()}
                </Text>
              </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daftar Blok</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={loadRestan} style={[styles.addItemButton, { backgroundColor: '#FF9800' }]}>
                <Text style={styles.addItemText}>Ambil Restan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addItem} style={styles.addItemButton}>
                <Plus size={20} color="#fff" />
                <Text style={styles.addItemText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Baris {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Trash2 size={20} color="#F44336" />
                  </TouchableOpacity>
                )}
              </View>

              <Dropdown
                label="Blok"
                placeholder="Pilih Blok"
                value={item.blok_id}
                items={blocks.map(b => ({ label: b.name, value: b.id }))}
                onSelect={val => updateItem(index, 'blok_id', val)}
                searchable
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Tahun Tanam</Text>
                  <Dropdown
                    label=""
                    placeholder="Pilih Tahun"
                    value={item.tahun_tanam}
                    items={yearOptions}
                    onSelect={val => updateItem(index, 'tahun_tanam', val)}
                    searchable
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Jumlah Janjang</Text>
                  <TextInput
                    style={styles.input}
                    value={item.jumlah_janjang}
                    onChangeText={text => updateItem(index, 'jumlah_janjang', text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              <Text style={styles.label}>Keterangan</Text>
              <TextInput
                style={styles.input}
                value={item.keterangan}
                onChangeText={text => updateItem(index, 'keterangan', text)}
                placeholder="Keterangan (Opsional)"
              />
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, submitting && styles.disabledButton]} 
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.saveContent}>
                <Save size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Simpan SPB</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={restanModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRestanModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Restan Hari Ini</Text>
              <TouchableOpacity onPress={() => setRestanModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {loadingRestan ? (
              <ActivityIndicator size="large" color="#2d5016" style={{ margin: 20 }} />
            ) : restanGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Tidak ada restan approved hari ini.</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {restanGroups.map(group => {
                  const isSelected = selectedRestanKeys.includes(group.key);
                  return (
                    <TouchableOpacity 
                      key={group.key} 
                      style={[styles.restanItem, isSelected && styles.restanItemSelected]}
                      onPress={() => toggleRestanSelection(group.key)}
                    >
                      <View style={styles.checkbox}>
                        {isSelected ? <CheckSquare size={24} color="#2d5016" /> : <Square size={24} color="#ccc" />}
                      </View>
                      <View style={styles.restanInfo}>
                        <Text style={styles.restanTitle}>{group.blok_name} (TT: {group.tahun_tanam})</Text>
                        <Text style={styles.restanSubtitle}>
                          {group.estate_name} - {group.divisi_name}
                        </Text>
                        <Text style={styles.restanDetail}>
                          Total: {group.total_janjang} Janjang
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.saveButton, { opacity: selectedRestanKeys.length > 0 ? 1 : 0.5 }]}
                onPress={confirmRestanSelection}
                disabled={selectedRestanKeys.length === 0}
              >
                <Text style={styles.saveButtonText}>Tambahkan Terpilih ({selectedRestanKeys.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalList: {
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  restanItem: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  restanItemSelected: {
    borderColor: '#2d5016',
    backgroundColor: '#f0f9eb',
  },
  checkbox: {
    marginRight: 12,
  },
  restanInfo: {
    flex: 1,
  },
  restanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  restanSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  restanDetail: {
    fontSize: 14,
    color: '#2d5016',
    fontWeight: '500',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  header: {
    backgroundColor: '#2d5016',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  backButton: {
    padding: 4,
  },
  printButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addItemButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  footer: {
    marginBottom: 48,
  },
  saveButton: {
    backgroundColor: '#2d5016',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
