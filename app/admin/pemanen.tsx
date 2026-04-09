import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Edit2, Trash2, Plus, X } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import Dropdown from '@/components/Dropdown';

interface Pemanen {
  id: string;
  name: string;
  nik: string;
  gang_id: string;
  gang_name?: string;
  status_aktif: boolean;
}

interface Gang {
  id: string;
  name: string;
}

export default function PemanenMasterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Pemanen[]>([]);
  const [gangList, setGangList] = useState<Gang[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Pemanen | null>(null);
  const [form, setForm] = useState({ name: '', nik: '', gang_id: '', status_aktif: true });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const db = await getDbClient();
      
      const { rows: pemanenRows } = await db.query(`
        SELECT p.*, g.name as gang_name 
        FROM pemanen p 
        LEFT JOIN gang g ON p.gang_id = g.id 
        ORDER BY g.name, p.name
      `);
      
      const { rows: gangRows } = await db.query('SELECT id, name FROM gang ORDER BY name');
      
      await db.end();
      setList(pemanenRows as any[]);
      setGangList(gangRows as any[]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setForm({ name: '', nik: '', gang_id: '', status_aktif: true });
    setModalVisible(true);
  };

  const handleEdit = (item: Pemanen) => {
    setEditingItem(item);
    setForm({ 
      name: item.name, 
      nik: item.nik || '', 
      gang_id: item.gang_id,
      status_aktif: item.status_aktif
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Konfirmasi',
      'Yakin ingin menghapus data ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDbClient();
              await db.query('DELETE FROM pemanen WHERE id = $1', [id]);
              await db.end();
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus data (mungkin sedang digunakan)');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!form.name || !form.gang_id) {
      Alert.alert('Error', 'Nama Pemanen dan Gang wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const db = await getDbClient();

      if (editingItem) {
        await db.query(
          'UPDATE pemanen SET name = $1, nik = $2, gang_id = $3, status_aktif = $4 WHERE id = $5',
          [form.name, form.nik, form.gang_id, form.status_aktif, editingItem.id]
        );
      } else {
        await db.query(
          'INSERT INTO pemanen (name, nik, gang_id, status_aktif) VALUES ($1, $2, $3, $4)',
          [form.name, form.nik, form.gang_id, form.status_aktif]
        );
      }
      await db.end();
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Master Pemanen</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={list}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadData}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {!item.status_aktif && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>Non-Aktif</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSubtitle}>
                {item.gang_name} {item.nik ? `• NIK: ${item.nik}` : ''}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                <Edit2 size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                <Trash2 size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Pemanen' : 'Tambah Pemanen'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Dropdown
                  label="Gang"
                  placeholder="Pilih Gang"
                  value={form.gang_id}
                  items={gangList.map(g => ({ label: g.name, value: g.id }))}
                  onSelect={(v) => setForm(p => ({ ...p, gang_id: v }))}
                  searchable
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Pemanen</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(t) => setForm(p => ({ ...p, name: t }))}
                  placeholder="Nama Lengkap"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NIK (Opsional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.nik}
                  onChangeText={(t) => setForm(p => ({ ...p, nik: t }))}
                  placeholder="Nomor Induk Karyawan"
                />
              </View>
              <View style={[styles.inputGroup, styles.switchGroup]}>
                <Text style={styles.label}>Status Aktif</Text>
                <Switch
                  value={form.status_aktif}
                  onValueChange={(v) => setForm(p => ({ ...p, status_aktif: v }))}
                  trackColor={{ false: '#767577', true: '#81c784' }}
                  thumbColor={form.status_aktif ? '#2d5016' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  addButton: {
    backgroundColor: '#2d5016',
    padding: 8,
    borderRadius: 8,
  },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionButton: { padding: 4 },
  inactiveBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: { fontSize: 10, color: '#c62828', fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalBody: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#f5f5f5' },
  saveButton: { backgroundColor: '#2d5016' },
  cancelButtonText: { color: '#666', fontWeight: '600' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});
