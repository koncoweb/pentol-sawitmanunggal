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

interface TPH {
  id: string;
  name: string;
  blok_id: string;
  blok_name?: string;
  divisi_name?: string;
}

interface Blok {
  id: string;
  name: string;
  divisi_name?: string;
}

export default function TPHMasterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<TPH[]>([]);
  const [blokList, setBlokList] = useState<Blok[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TPH | null>(null);
  const [form, setForm] = useState({ name: '', blok_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const db = await getDbClient();
      
      const { rows: tphRows } = await db.query(`
        SELECT t.*, b.name as blok_name, d.name as divisi_name
        FROM tph t 
        LEFT JOIN blok b ON t.blok_id = b.id
        LEFT JOIN divisi d ON b.divisi_id = d.id
        ORDER BY d.name, b.name, t.name
      `);
      
      const { rows: blokRows } = await db.query(`
        SELECT b.id, b.name, d.name as divisi_name
        FROM blok b
        LEFT JOIN divisi d ON b.divisi_id = d.id
        ORDER BY d.name, b.name
      `);
      
      await db.end();
      setList(tphRows as any[]);
      setBlokList(blokRows as any[]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setForm({ name: '', blok_id: '' });
    setModalVisible(true);
  };

  const handleEdit = (item: TPH) => {
    setEditingItem(item);
    setForm({ name: item.name, blok_id: item.blok_id });
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
              await db.query('DELETE FROM tph WHERE id = $1', [id]);
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
    if (!form.name || !form.blok_id) {
      Alert.alert('Error', 'Nama TPH dan Blok wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const db = await getDbClient();
      if (editingItem) {
        await db.query(
          'UPDATE tph SET name = $1, blok_id = $2 WHERE id = $3',
          [form.name, form.blok_id, editingItem.id]
        );
      } else {
        await db.query(
          'INSERT INTO tph (name, blok_id) VALUES ($1, $2)',
          [form.name, form.blok_id]
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
        <Text style={styles.headerTitle}>Master TPH</Text>
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
              <Text style={styles.cardSubtitle}>
                {item.divisi_name} • Blok {item.blok_name}
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
                {editingItem ? 'Edit TPH' : 'Tambah TPH'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Dropdown
                  label="Blok"
                  placeholder="Pilih Blok"
                  value={form.blok_id}
                  items={blokList.map(b => ({ 
                    label: `${b.name} (${b.divisi_name})`, 
                    value: b.id 
                  }))}
                  onSelect={(v) => setForm(p => ({ ...p, blok_id: v }))}
                  searchable
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama TPH</Text>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(t) => setForm(p => ({ ...p, name: t }))}
                  placeholder="Contoh: 1, 2, A, B"
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
