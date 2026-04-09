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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Edit2, Trash2, Plus, X } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';

interface Vehicle {
  id: string;
  fleet_number: string;
  plate_number: string;
  status: string;
}

export default function VehicleMasterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Vehicle[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({ fleet_number: '', plate_number: '', status: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const db = await getDbClient();
      const { rows } = await db.query('SELECT * FROM vehicles ORDER BY fleet_number ASC');
      setList(rows);
      await db.end();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data kendaraan');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setForm({ fleet_number: '', plate_number: '', status: true });
    setModalVisible(true);
  };

  const handleEdit = (item: Vehicle) => {
    setEditingItem(item);
    setForm({ 
      fleet_number: item.fleet_number || '', 
      plate_number: item.plate_number || '',
      status: item.status === 'active' 
    });
    setModalVisible(true);
  };

  const handleDelete = (item: Vehicle) => {
    Alert.alert(
      'Konfirmasi',
      `Hapus kendaraan ${item.fleet_number} (${item.plate_number})?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDbClient();
              await db.query('DELETE FROM vehicles WHERE id = $1', [item.id]);
              await db.end();
              loadData();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Gagal menghapus data');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!form.fleet_number.trim() && !form.plate_number.trim()) {
      Alert.alert('Error', 'Nomor Kendaraan atau Plat harus diisi');
      return;
    }

    setSaving(true);
    try {
      const db = await getDbClient();
      const status = form.status ? 'active' : 'inactive';
      
      if (editingItem) {
        await db.query(
          'UPDATE vehicles SET fleet_number = $1, plate_number = $2, status = $3 WHERE id = $4',
          [form.fleet_number, form.plate_number, status, editingItem.id]
        );
      } else {
        await db.query(
          'INSERT INTO vehicles (fleet_number, plate_number, status) VALUES ($1, $2, $3)',
          [form.fleet_number, form.plate_number, status]
        );
      }
      
      await db.end();
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Vehicle }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.fleet_number}</Text>
        <Text style={styles.cardSubtitle}>{item.plate_number}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'active' ? '#e8f5e9' : '#ffebee' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'active' ? '#2e7d32' : '#c62828' }
          ]}>
            {item.status === 'active' ? 'Aktif' : 'Non-Aktif'}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Edit2 size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <Trash2 size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Master Kendaraan</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2d5016" />
        </View>
      ) : (
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Belum ada data kendaraan</Text>
          }
        />
      )}

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
                {editingItem ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nomor Kendaraan (Lambung)</Text>
                <TextInput
                  style={styles.input}
                  value={form.fleet_number}
                  onChangeText={text => setForm(prev => ({ ...prev, fleet_number: text }))}
                  placeholder="Contoh: DT-01"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nomor Plat</Text>
                <TextInput
                  style={styles.input}
                  value={form.plate_number}
                  onChangeText={text => setForm(prev => ({ ...prev, plate_number: text }))}
                  placeholder="Contoh: BK 1234 AB"
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={styles.label}>Status Aktif</Text>
                <Switch
                  value={form.status}
                  onValueChange={value => setForm(prev => ({ ...prev, status: value }))}
                  trackColor={{ false: '#767577', true: '#81c784' }}
                  thumbColor={form.status ? '#2d5016' : '#f4f3f4'}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.disabledButton]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan</Text>
                )}
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
  addButton: {
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  saveButton: {
    backgroundColor: '#2d5016',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});