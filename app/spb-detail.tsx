import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Truck, User, Calendar, FileText, CheckCircle, Printer } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type SpbDetail = {
  id: string;
  nomor_spb: string;
  tanggal: string;
  driver_name: string;
  truck_plate: string;
  status: string;
  created_at: string;
  creator_name: string;
};

type HarvestItem = {
  id: string;
  blok_name: string;
  jumlah_jjg: number;
  total_weight: number;
};

export default function SpbDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [spb, setSpb] = useState<SpbDetail | null>(null);
  const [items, setItems] = useState<HarvestItem[]>([]);

  useEffect(() => {
    if (id) {
      loadSpbDetail(id as string);
    }
  }, [id]);

  const loadSpbDetail = async (spbId: string) => {
    try {
      const db = await getDbClient();
      
      // Get SPB Header
      const spbRes = await db.query(`
        SELECT 
          s.*,
          p.full_name as creator_name
        FROM spb s
        LEFT JOIN profiles p ON s.created_by = p.id
        WHERE s.id = $1
      `, [spbId]);

      if (spbRes.rows.length === 0) {
        Alert.alert('Error', 'SPB tidak ditemukan');
        router.back();
        return;
      }

      setSpb(spbRes.rows[0]);

      // Get SPB Items (Harvest Records)
      const itemsRes = await db.query(`
        SELECT 
          hr.id,
          b.name as blok_name,
          hr.jumlah_jjg,
          hr.hasil_panen_bjd as total_weight
        FROM harvest_records hr
        JOIN blok b ON hr.blok_id = b.id
        WHERE hr.spb_id = $1
        ORDER BY b.name ASC
      `, [spbId]);

      setItems(itemsRes.rows.map(row => ({
        id: row.id,
        blok_name: row.blok_name,
        jumlah_jjg: row.jumlah_jjg,
        total_weight: parseFloat(row.total_weight)
      })));

      await db.end();
    } catch (error) {
      console.error('Error loading SPB detail:', error);
      Alert.alert('Error', 'Gagal memuat detail SPB');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!spb) return;

    const totalJanjang = items.reduce((sum, item) => sum + item.jumlah_jjg, 0);
    const totalWeight = items.reduce((sum, item) => sum + item.total_weight, 0);
    const dateFormatted = new Date(spb.tanggal).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = new Date(spb.created_at).toLocaleTimeString('id-ID');

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2d5016; padding-bottom: 10px; }
            .company-name { font-size: 18px; font-weight: bold; color: #2d5016; margin-bottom: 5px; }
            .doc-title { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; font-size: 12px; color: #666; }
            .value { font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f5f5f5; text-align: left; padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
            .total-row td { font-weight: bold; border-top: 2px solid #ddd; background-color: #fafafa; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
            .signature-box { width: 30%; }
            .signature-line { margin-top: 60px; border-top: 1px solid #333; }
            .timestamp { margin-top: 30px; font-size: 10px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">AEP NUSANTARA PLANTATIONS Tbk.</div>
            <div class="doc-title">SURAT PENGANTAR BARANG (SPB)</div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-item">
                <div class="label">NOMOR SPB</div>
                <div class="value">${spb.nomor_spb}</div>
              </div>
              <div class="info-item">
                <div class="label">TANGGAL</div>
                <div class="value">${dateFormatted}</div>
              </div>
            </div>
            <div>
              <div class="info-item">
                <div class="label">DRIVER</div>
                <div class="value">${spb.driver_name}</div>
              </div>
              <div class="info-item">
                <div class="label">PLAT NOMOR</div>
                <div class="value">${spb.truck_plate}</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>NO</th>
                <th>BLOK</th>
                <th style="text-align: right">JANJANG</th>
                <th style="text-align: right">BERAT (KG)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>Blok ${item.blok_name}</td>
                  <td style="text-align: right">${item.jumlah_jjg}</td>
                  <td style="text-align: right">${item.total_weight}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td style="text-align: right">${totalJanjang}</td>
                <td style="text-align: right">${totalWeight}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div class="signature-box">
              <div>Dibuat Oleh</div>
              <div class="signature-line">${spb.creator_name}</div>
            </div>
            <div class="signature-box">
              <div>Supir</div>
              <div class="signature-line">${spb.driver_name}</div>
            </div>
            <div class="signature-box">
              <div>Penerima</div>
              <div class="signature-line">(........................)</div>
            </div>
          </div>

          <div class="timestamp">
            Dicetak pada: ${new Date().toLocaleString('id-ID')}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      console.log('File has been saved to:', uri);
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error printing SPB:', error);
      Alert.alert('Error', 'Gagal mencetak SPB');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d5016" />
      </View>
    );
  }

  if (!spb) return null;

  const totalJanjang = items.reduce((sum, item) => sum + item.jumlah_jjg, 0);
  const totalWeight = items.reduce((sum, item) => sum + item.total_weight, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail SPB</Text>
        <TouchableOpacity onPress={handlePrint} style={styles.printButton}>
          <Printer size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.spbHeader}>
            <View>
              <Text style={styles.label}>Nomor SPB</Text>
              <Text style={styles.spbNumber}>{spb.nomor_spb}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: spb.status === 'shipped' ? '#e8f5e9' : '#e3f2fd' }]}>
              <Text style={[styles.statusText, { color: spb.status === 'shipped' ? '#2e7d32' : '#1565c0' }]}>
                {spb.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.col}>
              <View style={styles.iconLabel}>
                <Calendar size={14} color="#666" style={styles.icon} />
                <Text style={styles.label}>Tanggal</Text>
              </View>
              <Text style={styles.value}>
                {new Date(spb.tanggal).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <View style={styles.iconLabel}>
                <User size={14} color="#666" style={styles.icon} />
                <Text style={styles.label}>Driver</Text>
              </View>
              <Text style={styles.value}>{spb.driver_name}</Text>
            </View>
            <View style={styles.col}>
              <View style={styles.iconLabel}>
                <Truck size={14} color="#666" style={styles.icon} />
                <Text style={styles.label}>Plat Nomor</Text>
              </View>
              <Text style={styles.value}>{spb.truck_plate}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Daftar Muatan</Text>

        <View style={styles.itemsCard}>
          {items.map((item, index) => (
            <View key={item.id} style={[styles.itemRow, index < items.length - 1 && styles.itemBorder]}>
              <View style={styles.itemInfo}>
                <Text style={styles.blokName}>Blok {item.blok_name}</Text>
              </View>
              <View style={styles.itemStats}>
                <Text style={styles.itemJanjang}>{item.jumlah_jjg} JJG</Text>
                <Text style={styles.itemWeight}>{item.total_weight} Kg</Text>
              </View>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={styles.totalStats}>
              <Text style={styles.totalJanjang}>{totalJanjang} JJG</Text>
              <Text style={styles.totalWeight}>{totalWeight} Kg</Text>
            </View>
          </View>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>Dibuat oleh: {spb.creator_name}</Text>
          <Text style={styles.footerText}>Waktu: {new Date(spb.created_at).toLocaleTimeString('id-ID')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
  },
  printButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  spbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  spbNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d5016',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  itemsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  blokName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  itemStats: {
    alignItems: 'flex-end',
  },
  itemJanjang: {
    fontSize: 14,
    color: '#666',
  },
  itemWeight: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalStats: {
    alignItems: 'flex-end',
  },
  totalJanjang: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  totalWeight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d5016',
  },
  footerInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});
