import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getDbClient } from '@/lib/db';
import { ChevronLeft, Save, Camera, X, Check, Calendar } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Dropdown from '@/components/Dropdown';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import EditableDropdown from '@/components/EditableDropdown';

interface Divisi {
  id: string;
  name: string;
  estate_name: string;
}

interface Blok {
  id: string;
  name: string;
}

interface Pemanen {
  id: string;
  operator_code: string;
  name: string;
}

interface TPH {
  id: string;
  nomor_tph: string;
}

interface Gang {
  id: string;
  name: string;
}

export default function InputPanenScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [blokList, setBlokList] = useState<Blok[]>([]);
  const [pemanenList, setPemanenList] = useState<Pemanen[]>([]);
  const [tphList, setTphList] = useState<TPH[]>([]);
  const [gangList, setGangList] = useState<Gang[]>([]);

  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    divisi_id: profile?.divisi_id || '',
    tahun_tanam: '',
    gang_id: '',
    blok_ids: [] as string[],
    pemanen_ids: [] as string[],
    tph_id: '',
    rotasi: '',
    nomor_panen: '',
    hasil_panen_bjd: '',
    bjr: '',
    buah_masak: '',
    buah_mentah: '',
    buah_mengkal: '',
    overripe: '',
    abnormal: '',
    buah_busuk: '',
    tangkai_panjang: '',
    jangkos: '',
    keterangan: '',
  });

  useEffect(() => {
    console.log('InputPanenScreen mounted, profile:', profile);
    loadDivisiList();

    // Load data divisi user saat mount
    const divisiId = formData.divisi_id || profile?.divisi_id;
    if (divisiId) {
      loadDivisiData(divisiId);
    }
  }, []);

  useEffect(() => {
    // Load data ketika divisi berubah
    if (formData.divisi_id && formData.divisi_id !== profile?.divisi_id) {
      loadDivisiData(formData.divisi_id);
    }
  }, [formData.divisi_id]);

  const loadDivisiList = async () => {
    try {
      const db = await getDbClient();
      const { rows } = await db.query('SELECT id, name, estate_name FROM divisi ORDER BY name LIMIT 20');
      await db.end();

      console.log('Loaded divisi:', rows.length);
      setDivisiList(rows as any[]);
    } catch (error) {
      console.error('Error loading divisi list:', error);
    }
  };

  const loadDivisiData = async (divisiId: string) => {
    if (!divisiId) return;

    try {
      console.log('Loading data for divisi:', divisiId);
      const db = await getDbClient();

      // Load semua data secara parallel untuk kecepatan
      const [gangResult, blokResult, pemanenResult, tphResult] = await Promise.all([
        db.query('SELECT id, name FROM gang WHERE divisi_id = $1 ORDER BY name LIMIT 50', [divisiId]),
        db.query('SELECT id, name FROM blok WHERE divisi_id = $1 ORDER BY name LIMIT 100', [divisiId]),
        db.query(`
          SELECT p.id, p.operator_code, p.name 
          FROM pemanen p 
          JOIN gang g ON p.gang_id = g.id 
          WHERE g.divisi_id = $1 AND p.status_aktif = true 
          ORDER BY p.name LIMIT 100
        `, [divisiId]),
        db.query(`
          SELECT t.id, t.name as nomor_tph 
          FROM tph t 
          JOIN blok b ON t.blok_id = b.id 
          WHERE b.divisi_id = $1 
          ORDER BY t.name LIMIT 100
        `, [divisiId])
      ]);

      await db.end();

      if (gangResult) setGangList(gangResult.rows as any[]);
      if (blokResult) setBlokList(blokResult.rows as any[]);
      if (pemanenResult) setPemanenList(pemanenResult.rows as any[]);
      if (tphResult) setTphList(tphResult.rows as any[]);

      console.log('Loaded data:', {
        gang: gangResult?.rows?.length,
        blok: blokResult?.rows?.length,
        pemanen: pemanenResult?.rows?.length,
        tph: tphResult?.rows?.length,
      });
    } catch (error) {
      console.error('Error loading divisi data:', error);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (formData.blok_ids.length === 0 || formData.pemanen_ids.length === 0 || !formData.rotasi) {
      Alert.alert('Error', 'Mohon isi semua field yang wajib (Blok, Pemanen, Rotasi)');
      return;
    }

    if (!profile?.divisi_id || !profile?.id) {
      Alert.alert('Error', 'Profil tidak lengkap');
      return;
    }

    setLoading(true);

    try {
      // Photo upload disabled for migration
      /*
      let fotoUrl: string | null = null;

      if (photoUri) {
        setUploadingPhoto(true);
        fotoUrl = await uploadPhotoToStorage(photoUri);
        setUploadingPhoto(false);

        if (!fotoUrl) {
          Alert.alert('Warning', 'Foto gagal diupload, data panen akan disimpan tanpa foto');
        }
      }
      */
      
      const db = await getDbClient();
      
      // Iterate over selected blocks and pemanens
      // Note: We distribute the yield/counts evenly or duplicate? 
      // For now, we will duplicate if multiple selected (User should input per block ideally)
      // Or we warn if multiple blocks selected with single yield.
      // Logic: Create a record for each combination.
      
      await db.query('BEGIN');
      
      const jjg = parseFloat(formData.hasil_panen_bjd) || 0;
      const bjr = parseInt(formData.bjr) || 0;
      const bjd = jjg * bjr; // Calculate total weight based on JJG * BJR

      for (const blokId of formData.blok_ids) {
        for (const pemanenId of formData.pemanen_ids) {
           await db.query(`
             INSERT INTO harvest_records (
                tanggal, divisi_id, blok_id, pemanen_id, tph_id, rotasi,
                hasil_panen_bjd, bjr, buah_masak, buah_mentah, buah_mengkal,
                overripe, abnormal, buah_busuk, tangkai_panjang, jangkos,
                keterangan, status, created_by, nomor_panen, jumlah_jjg
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
             )
           `, [
             formData.tanggal,
             profile.divisi_id,
             blokId,
             pemanenId,
             formData.tph_id || null,
             parseInt(formData.rotasi),
             bjd, // Insert calculated weight
             bjr,
             parseInt(formData.buah_masak) || 0,
             parseInt(formData.buah_mentah) || 0,
             parseInt(formData.buah_mengkal) || 0,
             parseInt(formData.overripe) || 0,
             parseInt(formData.abnormal) || 0,
             parseInt(formData.buah_busuk) || 0,
             parseInt(formData.tangkai_panjang) || 0,
             parseInt(formData.jangkos) || 0,
             formData.keterangan || null,
             'draft',
             profile.id,
             formData.nomor_panen,
             jjg // Insert count
           ]);
        }
      }
      
      await db.query('COMMIT');
      await db.end();

      Alert.alert('Berhasil', 'Data panen berhasil disimpan', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error saving harvest:', error);
      Alert.alert('Error', error.message || 'Gagal menyimpan data panen');
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenCamera = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Fitur kamera tidak tersedia di web. Gunakan aplikasi mobile.');
      return;
    }

    if (!cameraPermission) {
      return;
    }

    if (!cameraPermission.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Error', 'Izin kamera diperlukan untuk mengambil foto');
        return;
      }
    }

    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });

      if (photo) {
        setPhotoUri(photo.uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Gagal mengambil foto');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
  };

  const uploadPhotoToStorage = async (uri: string): Promise<string | null> => {
    try {
      /*
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileExt = 'jpg';
      const fileName = `${profile?.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('harvest-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('harvest-photos')
        .getPublicUrl(fileName);

      return publicUrl;
      */
      console.warn('Photo upload disabled');
      return null;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Image
            source={require('@/assets/images/lg-aep-cmyk-300dpi.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Input Panen Sawit</Text>
        </View>
        <View style={styles.headerRight}>
          <Calendar size={24} color="#fff" />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Umum</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tanggal <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.tanggal}
              onChangeText={(value) => updateField('tanggal', value)}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nama Krani
            </Text>
            <TextInput
              style={styles.input}
              value={profile?.full_name || ''}
              editable={false}
              placeholder="Nama Krani"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Dropdown
                label="Divisi"
                placeholder="Pilih Divisi"
                value={formData.divisi_id}
                items={divisiList.map((divisi) => ({
                  label: divisi.name,
                  value: divisi.id,
                }))}
                onSelect={(value) => {
                  // Clear existing data
                  setGangList([]);
                  setBlokList([]);
                  setPemanenList([]);
                  setTphList([]);
                  setFormData(prev => ({
                    ...prev,
                    divisi_id: value,
                    gang_id: '',
                    blok_ids: [],
                    pemanen_ids: [],
                    tph_id: '',
                  }));
                  // Load new data
                  loadDivisiData(value);
                }}
                required
                searchable={divisiList.length > 5}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Dropdown
                label="Tahun Tanam"
                placeholder="Pilih Tahun"
                value={formData.tahun_tanam}
                items={[
                  { label: '2010', value: '2010' },
                  { label: '2011', value: '2011' },
                  { label: '2012', value: '2012' },
                  { label: '2013', value: '2013' },
                  { label: '2014', value: '2014' },
                  { label: '2015', value: '2015' },
                  { label: '2016', value: '2016' },
                  { label: '2017', value: '2017' },
                  { label: '2018', value: '2018' },
                  { label: '2019', value: '2019' },
                  { label: '2020', value: '2020' },
                  { label: '2021', value: '2021' },
                  { label: '2022', value: '2022' },
                  { label: '2023', value: '2023' },
                  { label: '2024', value: '2024' },
                  { label: '2025', value: '2025' },
                ]}
                onSelect={(value) => updateField('tahun_tanam', value)}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lokasi & Blok</Text>

          <Dropdown
            label="Gang"
            placeholder="Pilih Gang"
            value={formData.gang_id}
            items={gangList.map((gang) => ({
              label: gang.name,
              value: gang.id,
            }))}
            onSelect={(value) => updateField('gang_id', value)}
            searchable={gangList.length > 5}
          />

          <MultiSelectDropdown
            label="Blok"
            placeholder="Pilih Blok (bisa lebih dari 1)"
            values={formData.blok_ids}
            items={blokList.map((blok) => ({
              label: blok.name,
              value: blok.id,
            }))}
            onSelect={(values) => updateField('blok_ids', values)}
            required
            searchable={blokList.length > 5}
          />

          <Dropdown
            label="Nomor Panen"
            placeholder="Pilih Nomor Panen"
            value={formData.tph_id}
            items={tphList.map((tph) => ({
              label: tph.nomor_tph,
              value: tph.id,
            }))}
            onSelect={(value) => updateField('tph_id', value)}
            searchable={tphList.length > 10}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Panen</Text>

          <MultiSelectDropdown
            label="Nama Pemanen"
            placeholder="Pilih Pemanen (bisa lebih dari 1)"
            values={formData.pemanen_ids}
            items={pemanenList.map((pemanen) => ({
              label: `${pemanen.operator_code} - ${pemanen.name}`,
              value: pemanen.id,
            }))}
            onSelect={(values) => updateField('pemanen_ids', values)}
            required
            searchable
          />

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Rotasi <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.rotasi}
                onChangeText={(value) => updateField('rotasi', value)}
                placeholder="Rotasi"
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <EditableDropdown
                label="Nomor Panen"
                placeholder="Ketik atau pilih"
                value={formData.nomor_panen}
                items={Array.from({ length: 20 }, (_, i) => ({
                  label: `${i + 1}`,
                  value: `${i + 1}`,
                }))}
                onChangeText={(value) => updateField('nomor_panen', value)}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hasil Panen (JJG)</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Hasil Panen (JJG)</Text>
              <TextInput
                style={styles.input}
                value={formData.hasil_panen_bjd}
                onChangeText={(value) => updateField('hasil_panen_bjd', value)}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>BJR</Text>
              <TextInput
                style={styles.input}
                value={formData.bjr}
                onChangeText={(value) => updateField('bjr', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kriteria Buah</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Buah Masak</Text>
              <TextInput
                style={styles.input}
                value={formData.buah_masak}
                onChangeText={(value) => updateField('buah_masak', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Buah Mentah</Text>
              <TextInput
                style={styles.input}
                value={formData.buah_mentah}
                onChangeText={(value) => updateField('buah_mentah', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Buah Mengkal</Text>
              <TextInput
                style={styles.input}
                value={formData.buah_mengkal}
                onChangeText={(value) => updateField('buah_mengkal', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Overripe</Text>
              <TextInput
                style={styles.input}
                value={formData.overripe}
                onChangeText={(value) => updateField('overripe', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Abnormal</Text>
              <TextInput
                style={styles.input}
                value={formData.abnormal}
                onChangeText={(value) => updateField('abnormal', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Buah Busuk</Text>
              <TextInput
                style={styles.input}
                value={formData.buah_busuk}
                onChangeText={(value) => updateField('buah_busuk', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Tangkai Panjang</Text>
              <TextInput
                style={styles.input}
                value={formData.tangkai_panjang}
                onChangeText={(value) => updateField('tangkai_panjang', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Jangkos</Text>
              <TextInput
                style={styles.input}
                value={formData.jangkos}
                onChangeText={(value) => updateField('jangkos', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto Hasil Panen</Text>

          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemovePhoto}>
                <X size={20} color="#fff" />
                <Text style={styles.removePhotoText}>Hapus Foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.cameraButton} onPress={handleOpenCamera}>
              <Camera size={24} color="#2d5016" />
              <Text style={styles.cameraButtonText}>Ambil Foto Hasil Panen</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.photoHint}>Foto dapat membantu verifikasi hasil panen</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keterangan</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.keterangan}
              onChangeText={(value) => updateField('keterangan', value)}
              placeholder="Tambahkan keterangan (opsional)"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Simpan Data Panen</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {showCamera && (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.cameraCloseButton} onPress={() => setShowCamera(false)}>
                <X size={32} color="#fff" />
              </TouchableOpacity>

              <View style={styles.cameraActions}>
                <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
                  <Camera size={32} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      )}

      {(loading || uploadingPhoto) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2d5016" />
            <Text style={styles.loadingText}>
              {uploadingPhoto ? 'Mengupload foto...' : 'Menyimpan data...'}
            </Text>
          </View>
        </View>
      )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    padding: 8,
  },
  backButton: {
    marginRight: 12,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
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
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e53935',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#2d5016',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#2d5016',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d5016',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  removePhotoButton: {
    backgroundColor: '#e53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 50,
  },
  cameraActions: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#2d5016',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  loadingBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});