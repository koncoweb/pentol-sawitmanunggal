import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { X, FileSpreadsheet, FileText, Download } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchReportData,
  transformToExportFormat,
  type ReportFilter,
} from '@/lib/reportService';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';

type ExportModalProps = {
  visible: boolean;
  onClose: () => void;
  reportType: string;
};

type Divisi = {
  id: string;
  name: string;
};

export default function ExportModal({
  visible,
  onClose,
  reportType,
}: ExportModalProps) {
  const { profile } = useAuth();
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [scope, setScope] = useState<'divisi' | 'estate'>('estate');
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [selectedDivisi, setSelectedDivisi] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingDivisi, setLoadingDivisi] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (visible) {
      loadDivisiList();
      setDefaultDates();
    }
  }, [visible]);

  const setDefaultDates = () => {
    const today = new Date();
    const start = new Date();

    switch (reportType) {
      case 'daily':
        start.setDate(today.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(today.getMonth() - 1);
        break;
      default:
        start.setDate(today.getDate() - 7);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const loadDivisiList = async () => {
    try {
      setLoadingDivisi(true);
      const db = await getDbClient();
      const { rows } = await db.query('SELECT id, name FROM divisi ORDER BY name');
      await db.end();

      setDivisiList(rows || []);

      if (rows && rows.length > 0 && scope === 'divisi') {
        setSelectedDivisi(rows[0].id);
      }
    } catch (error) {
      console.error('Error loading divisi:', error);
    } finally {
      setLoadingDivisi(false);
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      alert('Silakan pilih tanggal mulai dan tanggal akhir');
      return;
    }

    if (scope === 'divisi' && !selectedDivisi) {
      alert('Silakan pilih divisi');
      return;
    }

    try {
      setLoading(true);

      const filter: ReportFilter = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      if (scope === 'divisi') {
        filter.divisiId = selectedDivisi;
      }

      const records = await fetchReportData(filter);

      if (records.length === 0) {
        alert('Tidak ada data untuk periode yang dipilih');
        return;
      }

      const exportData = transformToExportFormat(records);

      const divisiName =
        scope === 'divisi'
          ? divisiList.find((d) => d.id === selectedDivisi)?.name || 'Divisi'
          : 'Estate';

      const filename = `laporan_panen_${divisiName.toLowerCase().replace(/\s+/g, '_')}_${reportType}`;
      const title = `LAPORAN PANEN - ${divisiName.toUpperCase()}`;

      if (format === 'excel') {
        exportToExcel(exportData, filename);
      } else {
        exportToPDF(exportData, filename, title);
      }

      alert(`Laporan berhasil diexport (${records.length} data)`);
      onClose();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Gagal export laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Export Laporan</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Format Export</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    format === 'excel' && styles.optionCardActive,
                  ]}
                  onPress={() => setFormat('excel')}
                >
                  <FileSpreadsheet
                    size={32}
                    color={format === 'excel' ? '#2d5016' : '#666'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      format === 'excel' && styles.optionTextActive,
                    ]}
                  >
                    Excel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    format === 'pdf' && styles.optionCardActive,
                  ]}
                  onPress={() => setFormat('pdf')}
                >
                  <FileText
                    size={32}
                    color={format === 'pdf' ? '#2d5016' : '#666'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      format === 'pdf' && styles.optionTextActive,
                    ]}
                  >
                    PDF
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Scope Data</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    scope === 'divisi' && styles.optionCardActive,
                  ]}
                  onPress={() => setScope('divisi')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      scope === 'divisi' && styles.optionTextActive,
                    ]}
                  >
                    Per Divisi
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionCard,
                    scope === 'estate' && styles.optionCardActive,
                  ]}
                  onPress={() => setScope('estate')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      scope === 'estate' && styles.optionTextActive,
                    ]}
                  >
                    Seluruh Estate
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {scope === 'divisi' && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Pilih Divisi</Text>
                {loadingDivisi ? (
                  <ActivityIndicator size="small" color="#2d5016" />
                ) : (
                  <View style={styles.divisiList}>
                    {divisiList.map((divisi) => (
                      <TouchableOpacity
                        key={divisi.id}
                        style={[
                          styles.divisiItem,
                          selectedDivisi === divisi.id &&
                            styles.divisiItemActive,
                        ]}
                        onPress={() => setSelectedDivisi(divisi.id)}
                      >
                        <Text
                          style={[
                            styles.divisiText,
                            selectedDivisi === divisi.id &&
                              styles.divisiTextActive,
                          ]}
                        >
                          {divisi.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Periode</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Dari</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Sampai</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, loading && styles.exportButtonDisabled]}
              onPress={handleExport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Download size={20} color="#fff" />
                  <Text style={styles.exportButtonText}>Export</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2d5016',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  optionTextActive: {
    color: '#2d5016',
  },
  divisiList: {
    gap: 8,
  },
  divisiItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  divisiItemActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2d5016',
  },
  divisiText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  divisiTextActive: {
    color: '#2d5016',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  dateInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#2d5016',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
