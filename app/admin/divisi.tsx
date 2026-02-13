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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Edit2, Trash2, Plus, X } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import Dropdown from '@/components/Dropdown';

interface Divisi {
  id: string;
  name: string;
  code: string;
  estate_name: string;
  rayon_id: string | null;
  rayon_name?: string;
}

interface Rayon {
  id: string;
  name: string;
}

interface Estate {
  id: string;
  name: string;
}

export default function DivisiMasterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Divisi[]>([]);
  const [rayonList, setRayonList] = useState<Rayon[]>([]);
  const [estateList, setEstateList] = useState<Estate[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Divisi | null>(null);
  const [form, setForm] = useState({ name: '', code: '', estate_name: '', rayon_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const db = await getDbClient();
      
      const { rows: divisiRows } = await db.query(`
        SELECT d.*, r.name as rayon_name 
        FROM divisi d
        LEFT JOIN rayon r ON d.rayon_id = r.id
        ORDER BY d.name
      `);
      
      const { rows: rayonRows } = await db.query('SELECT * FROM rayon ORDER BY name');
      const { rows: estateRows } = await db.query('SELECT * FROM estates ORDER BY name');
      
      await db.end();
      setList(divisiRows as any[]);
      setRayonList(rayonRows as any[]);
      setEstateList(estateRows as any[]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setForm({ name: '', code: '', estate_name: '', rayon_id: '' });
    setModalVisible(true);
  };

  const handleEdit = (item: Divisi) => {
    setEditingItem(item);
    setForm({ 
      name: item.name, 
      code: item.code,
      estate_name: item.estate_name || '',
      rayon_id: item.rayon_id || ''
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
              await db.query('DELETE FROM divisi WHERE id = $1', [id]);
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
    if (!form.name || !form.code) {
      Alert.alert('Error', 'Nama Divisi dan Kode wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const db = await getDbClient();
      if (editingItem) {
        await db.query(
          'UPDATE divisi SET name = $1, code = $2, estate_name = $3, rayon_id = $4 WHERE id = $5',
          [form.name, form.code, form.estate_name, form.rayon_id || null, editingItem.id]
        );
      } else {
        await db.query(
          'INSERT INTO divisi (name, code, estate_name, rayon_id) VALUES ($1, $2, $3, $4)',
          [form.name, form.code, form.estate_name, form.rayon_id || null]
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
        <Text style={styles.headerTitle}>Master Divisi</Text>
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
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>Rayon: {item.rayon_name || '-'}</Text>
              <Text style={styles.cardSubtitle}>Estate: {item.estate_name || '-'}</Text>
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
                {editingItem ? 'Edit Divisi' : 'Tambah Divisi'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kode Divisi</Text>
                <TextInput
                  style={styles.input}
                  value={form.code}
                  onChangeText={(t) => setForm(p => ({ ...p, code: t }))}
                  placeholder="Contoh: DIV1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Divisi</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(t) => setForm(p => ({ ...p, name: t }))}
                  placeholder="Contoh: Divisi 1"
                />
              </View>
              
              <View style={{ marginBottom: 16 }}>
                <Dropdown
                  label="Rayon"
                  placeholder="Pilih Rayon"
                  value={form.rayon_id}
                  items={rayonList.map(r => ({ label: r.name, value: r.id }))}
                  onSelect={(value) => setForm(p => ({ ...p, rayon_id: value }))}
                  searchable
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Dropdown
                  label="Estate"
                  placeholder="Pilih Estate"
                  value={form.estate_name}
                  items={estateList.map(e => ({ label: e.name, value: e.name }))}
                  onSelect={(value) => setForm(p => ({ ...p, estate_name: value }))}
                  searchable
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
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionButton: { padding: 4 },
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
