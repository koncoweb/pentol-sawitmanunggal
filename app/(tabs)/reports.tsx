import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FileText, Download, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ReportsScreen() {
  const router = useRouter();

  const reportTypes = [
    {
      id: 'daily',
      title: 'Laporan Harian',
      description: 'Rekap produksi dan achievement per hari',
      icon: FileText,
      color: '#2d5016',
    },
    {
      id: 'weekly',
      title: 'Laporan Mingguan',
      description: 'Summary produksi dan KPI 7 hari terakhir',
      icon: Calendar,
      color: '#4a7c23',
    },
    {
      id: 'monthly',
      title: 'Laporan Bulanan',
      description: 'Analisis lengkap produktivitas bulanan',
      icon: FileText,
      color: '#6ba82e',
    },
  ];

  const handleReportPress = (reportId: string) => {
    router.push({
      pathname: '/report-detail',
      params: { type: reportId },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Laporan</Text>
        <Text style={styles.subtitle}>Generate dan export laporan</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jenis Laporan</Text>
        {reportTypes.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            onPress={() => handleReportPress(report.id)}
          >
            <View style={[styles.reportIcon, { backgroundColor: report.color }]}>
              <report.icon size={24} color="#fff" />
            </View>
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDescription}>{report.description}</Text>
            </View>
            <Download size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat Laporan</Text>
        <View style={styles.emptyState}>
          <FileText size={48} color="#ccc" />
          <Text style={styles.emptyText}>Belum ada laporan</Text>
          <Text style={styles.emptySubtext}>
            Laporan yang diexport akan muncul di sini
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});
