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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Edit2, Search, X, Plus, User as UserIcon, Camera } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import Dropdown from '@/components/Dropdown';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { Switch, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  gang_id: string | null;
  gang_name?: string;
  photo_url: string | null;
  banned?: boolean;
  estate_names?: string;
  estate_ids: string[];
  rayon_names?: string;
  rayon_ids: string[];
  divisi_names?: string;
  divisi_ids: string[];
  created_by_name?: string;
}

interface Divisi {
  id: string;
  name: string;
  rayon_id?: string | null;
}

interface Gang {
  id: string;
  name: string;
}

interface Rayon {
  id: string;
  name: string;
}

interface Estate {
  id: string;
  name: string;
}

export default function UserManagementScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  
  // Master data for dropdowns
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [gangList, setGangList] = useState<Gang[]>([]);
  const [rayonList, setRayonList] = useState<Rayon[]>([]);
  const [estateList, setEstateList] = useState<Estate[]>([]);
  
  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: '',
    gang_id: '',
    estate_ids: [] as string[],
    rayon_ids: [] as string[],
    divisi_ids: [] as string[],
    photo_url: '',
    is_active: true,
  });

  const roles = [
    { label: 'Administrator', value: 'administrator' },
    { label: 'Estate Manager', value: 'estate_manager' },
    { label: 'Senior Asisten', value: 'senior_asisten' },
    { label: 'Asisten', value: 'asisten' },
    { label: 'Mandor', value: 'mandor' },
    { label: 'Krani Buah', value: 'krani_buah' },
    { label: 'Krani Panen', value: 'krani_panen' },
    { label: 'Regional GM', value: 'regional_gm' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const db = await getDbClient();
    
    try {
      console.log('Fetching master data...');
      
      // Load Master Data independently to ensure dropdowns work even if user query fails
      try {
        const { rows: divisiRows } = await db.query('SELECT id, name FROM divisi ORDER BY name');
        setDivisiList(divisiRows as any[]);
      } catch (e) {
        console.error('Error loading divisi:', e);
      }

      try {
        const { rows: gangRows } = await db.query('SELECT id, name FROM gang ORDER BY name');
        setGangList(gangRows as any[]);
      } catch (e) {
        console.error('Error loading gang:', e);
      }

      try {
        const { rows: rayonRows } = await db.query('SELECT id, name FROM rayon ORDER BY name');
        setRayonList(rayonRows as any[]);
      } catch (e) {
        console.error('Error loading rayon:', e);
      }

      try {
        const { rows: estateRows } = await db.query('SELECT id, name FROM estates ORDER BY name');
        setEstateList(estateRows as any[]);
      } catch (e) {
        console.error('Error loading estates:', e);
      }

      console.log('Fetching user data...');
      // Load Users with joined data from junction tables
      const usersQuery = `
        SELECT 
          p.id, p.email, p.full_name, p.role, p.gang_id, p.photo_url,
          g.name as gang_name,
          u.banned,
          p.assigned_estate as estate_names,
          CASE WHEN p.assigned_estate IS NOT NULL THEN ARRAY[p.assigned_estate] ELSE ARRAY[]::text[] END as estate_ids,
          p.assigned_rayon as rayon_names,
          CASE WHEN p.assigned_rayon IS NOT NULL THEN ARRAY[p.assigned_rayon] ELSE ARRAY[]::text[] END as rayon_ids,
          d.name as divisi_names,
          CASE WHEN p.divisi_id IS NOT NULL THEN ARRAY[p.divisi_id] ELSE ARRAY[]::uuid[] END as divisi_ids
        FROM profiles p
        JOIN neon_auth.user u ON p.id = u.id
        LEFT JOIN gang g ON p.gang_id = g.id
        LEFT JOIN divisi d ON p.divisi_id = d.id
        GROUP BY p.id, p.email, p.full_name, p.role, p.gang_id, p.photo_url, g.name, u.banned, p.assigned_estate, p.assigned_rayon, d.name, p.divisi_id
        ORDER BY p.full_name
      `;
      const { rows: userRows } = await db.query(usersQuery);
      setUsers(userRows as any[]);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setEditForm({
      email: '',
      password: '',
      full_name: '',
      role: '',
      gang_id: '',
      estate_ids: [],
      rayon_ids: [],
      divisi_ids: [],
      photo_url: '',
      is_active: true,
    });
    setModalVisible(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEditForm(prev => ({ ...prev, photo_url: base64Img }));
    }
  };

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      password: '', // Password not editable directly here, only for new users
      full_name: user.full_name,
      role: user.role || '',
      gang_id: user.gang_id || '',
      estate_ids: user.estate_ids || [],
      rayon_ids: user.rayon_ids || [],
      divisi_ids: user.divisi_ids || [],
      photo_url: user.photo_url || '',
      is_active: !user.banned,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const db = await getDbClient();
      let userId = selectedUser?.id;

      if (selectedUser) {
        // Update existing user profile
        await db.query(
          'UPDATE profiles SET role = $1, gang_id = $2, full_name = $3, photo_url = $4, updated_at = NOW() WHERE id = $5',
          [
            editForm.role,
            editForm.gang_id || null,
            editForm.full_name,
            editForm.photo_url || null,
            selectedUser.id
          ]
        );
        
        // Update banned status and name in auth
        await db.query(
            'UPDATE neon_auth.user SET banned = $1, name = $2 WHERE id = $3',
            [!editForm.is_active, editForm.full_name, selectedUser.id]
        );

      } else {
        // Create new user logic
        if (!editForm.email || !editForm.password || !editForm.full_name || !editForm.role) {
          Alert.alert('Error', 'Mohon lengkapi semua field wajib');
          setLoading(false);
          return;
        }

        const authUrl = process.env.EXPO_PUBLIC_NEON_AUTH_URL;
        if (!authUrl) throw new Error('Auth URL not configured');

        // 1. Create in Neon Auth
        const response = await fetch(`${authUrl}/sign-up/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://pentol.sawitmanunggal.com'
          },
          body: JSON.stringify({
            email: editForm.email,
            password: editForm.password,
            name: editForm.full_name,
          }),
        });

        const authData = await response.json();
        
        if (!response.ok) {
            throw new Error(authData.message || 'Gagal membuat user di Auth');
        }

        userId = authData.user.id;
        
        // 2. Create Profile
        await db.query(`
           INSERT INTO profiles (id, email, full_name, role, gang_id, photo_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             full_name = EXCLUDED.full_name,
             role = EXCLUDED.role,
             gang_id = EXCLUDED.gang_id,
             photo_url = EXCLUDED.photo_url
        `, [
            userId, 
            editForm.email, 
            editForm.full_name, 
            editForm.role,
            editForm.gang_id || null,
            editForm.photo_url || null
        ]);
        
        // 3. Set Status if inactive
        if (!editForm.is_active) {
            await db.query('UPDATE neon_auth.user SET banned = true WHERE id = $1', [userId]);
        }
      }

      // Update Junction Tables (Delete all then insert new)
      if (userId) {
        // Estates - Tables don't exist yet, using assigned_estate column in profiles
        // await db.query('DELETE FROM profile_estates WHERE profile_id = $1', [userId]);
        // if (editForm.estate_ids.length > 0) {
        //     const estateValues = editForm.estate_ids.map(id => `('${userId}', '${id}')`).join(',');
        //     await db.query(`INSERT INTO profile_estates (profile_id, estate_id) VALUES ${estateValues}`);
        // }

        // Rayons - Tables don't exist yet
        // await db.query('DELETE FROM profile_rayons WHERE profile_id = $1', [userId]);
        // if (editForm.rayon_ids.length > 0) {
        //     const rayonValues = editForm.rayon_ids.map(id => `('${userId}', '${id}')`).join(',');
        //     await db.query(`INSERT INTO profile_rayons (profile_id, rayon_id) VALUES ${rayonValues}`);
        // }

        // Divisis - Using profiles.divisi_id (Single division support for now)
        // await db.query('DELETE FROM profile_divisis WHERE profile_id = $1', [userId]);
        // if (editForm.divisi_ids.length > 0) {
        //     const divisiValues = editForm.divisi_ids.map(id => `('${userId}', '${id}')`).join(',');
        //     await db.query(`INSERT INTO profile_divisis (profile_id, divisi_id) VALUES ${divisiValues}`);
        // }
        
        // Update single divisi_id in profiles
        if (editForm.divisi_ids.length > 0) {
          await db.query('UPDATE profiles SET divisi_id = $1 WHERE id = $2', [editForm.divisi_ids[0], userId]);
        } else {
          await db.query('UPDATE profiles SET divisi_id = NULL WHERE id = $1', [userId]);
        }
      }

      await db.end();
      
      setModalVisible(false);
      loadData(); // Reload list
      Alert.alert('Sukses', selectedUser ? 'Data user berhasil diperbarui' : 'User baru berhasil dibuat');
    } catch (error: any) {
      console.error('Error saving user:', error);
      Alert.alert('Error', error.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole ? user.role === filterRole : true;

    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (roleValue: string) => {
    return roles.find(r => r.value === roleValue)?.label || roleValue;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manajemen User</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
          <Plus size={24} color="#2d5016" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari user..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, filterRole === null && styles.activeFilterChip]}
            onPress={() => setFilterRole(null)}
          >
            <Text style={[styles.filterChipText, filterRole === null && styles.activeFilterChipText]}>
              Semua Role
            </Text>
          </TouchableOpacity>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={[styles.filterChip, filterRole === role.value && styles.activeFilterChip]}
              onPress={() => setFilterRole(role.value === filterRole ? null : role.value)}
            >
              <Text style={[styles.filterChipText, filterRole === role.value && styles.activeFilterChipText]}>
                {role.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadData}
        renderItem={({ item }) => (
          <View style={[styles.userCard, item.banned && styles.inactiveCard]}>
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                     <UserIcon size={24} color="#666" />
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{item.full_name || 'No Name'}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  {item.created_by_name && (
                    <Text style={styles.userCreator}>
                      Created by: {item.created_by_name}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.badges}>
                {item.banned && (
                  <View style={[styles.badge, { backgroundColor: '#ffebee' }]}>
                    <Text style={[styles.badgeText, { color: '#d32f2f' }]}>
                      Nonaktif
                    </Text>
                  </View>
                )}
                <View style={[styles.badge, { backgroundColor: '#e3f2fd' }]}>
                  <Text style={[styles.badgeText, { color: '#1976d2' }]}>
                    {getRoleLabel(item.role)}
                  </Text>
                </View>
                {item.rayon_names && (
                  <View style={[styles.badge, { backgroundColor: '#f3e5f5' }]}>
                    <Text style={[styles.badgeText, { color: '#7b1fa2' }]}>
                      {item.rayon_names}
                    </Text>
                  </View>
                )}
                {item.estate_names && (
                  <View style={[styles.badge, { backgroundColor: '#fff8e1' }]}>
                    <Text style={[styles.badgeText, { color: '#ff8f00' }]}>
                      {item.estate_names}
                    </Text>
                  </View>
                )}
                {item.divisi_names && (
                  <View style={[styles.badge, { backgroundColor: '#e8f5e9' }]}>
                    <Text style={[styles.badgeText, { color: '#2e7d32' }]}>
                      {item.divisi_names}
                    </Text>
                  </View>
                )}
                {item.gang_name && (
                  <View style={[styles.badge, { backgroundColor: '#fff3e0' }]}>
                    <Text style={[styles.badgeText, { color: '#ef6c00' }]}>
                      {item.gang_name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEdit(item)}
            >
              <Edit2 size={20} color="#666" />
            </TouchableOpacity>
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
              <Text style={styles.modalTitle}>{selectedUser ? 'Edit User' : 'Tambah User'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.full_name}
                  onChangeText={(t) => setEditForm(prev => ({...prev, full_name: t}))}
                  placeholder="Nama Lengkap"
                />
              </View>

              {!selectedUser && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={editForm.email}
                      onChangeText={(t) => setEditForm(prev => ({...prev, email: t}))}
                      placeholder="email@sawitmanunggal.com"
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={editForm.password}
                      onChangeText={(t) => setEditForm(prev => ({...prev, password: t}))}
                      placeholder="Password"
                      secureTextEntry
                    />
                  </View>
                </>
              )}
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Foto Profil</Text>
                <View style={styles.imageUploadContainer}>
                  {editForm.photo_url ? (
                    <Image source={{ uri: editForm.photo_url }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.previewPlaceholder}>
                      <UserIcon size={40} color="#ccc" />
                    </View>
                  )}
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <Camera size={20} color="#666" style={{ marginRight: 8 }} />
                    <Text style={styles.uploadButtonText}>
                      {editForm.photo_url ? 'Ganti Foto' : 'Upload Foto'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Dropdown
                label="Role"
                placeholder="Pilih Role"
                value={editForm.role}
                items={roles}
                onSelect={(value) => setEditForm(prev => ({ ...prev, role: value }))}
              />

              <MultiSelectDropdown
                label="Estate"
                placeholder="Pilih Estate"
                value={editForm.estate_ids}
                items={estateList.map(e => ({ label: e.name, value: e.id }))}
                onSelect={(value) => setEditForm(prev => ({ ...prev, estate_ids: value }))}
                searchable
              />

              {editForm.role === 'senior_asisten' && (
                <MultiSelectDropdown
                  label="Rayon"
                  placeholder="Pilih Rayon"
                  value={editForm.rayon_ids}
                  items={rayonList.map(r => ({ label: r.name, value: r.id }))}
                  onSelect={(value) => setEditForm(prev => ({ ...prev, rayon_ids: value }))}
                  searchable
                />
              )}

              <MultiSelectDropdown
                label="Divisi"
                placeholder="Pilih Divisi (Opsional)"
                value={editForm.divisi_ids}
                items={divisiList
                  .filter(d => editForm.rayon_ids.length === 0 || !d.rayon_id || editForm.rayon_ids.includes(d.rayon_id))
                  .map(d => ({ label: d.name, value: d.id }))}
                onSelect={(value) => setEditForm(prev => ({ ...prev, divisi_ids: value }))}
                searchable
              />

              <Dropdown
                label="Gang"
                placeholder="Pilih Gang (Opsional)"
                value={editForm.gang_id}
                items={gangList.map(g => ({ label: g.name, value: g.id }))}
                onSelect={(value) => setEditForm(prev => ({ ...prev, gang_id: value }))}
                searchable
              />

              <View style={[styles.formGroup, styles.switchContainer]}>
                <Text style={styles.label}>Status Aktif</Text>
                <Switch
                    value={editForm.is_active}
                    onValueChange={(v) => setEditForm(prev => ({...prev, is_active: v}))}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={editForm.is_active ? "#2d5016" : "#f4f3f4"}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userCreator: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  previewPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  uploadButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#2d5016',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  inactiveCard: {
    opacity: 0.7,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    padding: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterChip: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2d5016',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterChipText: {
    color: '#2d5016',
    fontWeight: '600',
  },
});
