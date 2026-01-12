import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';

export default function ApprovalScreen() {
  const pendingApprovals = [
    {
      id: '1',
      krani: 'Belum ada data',
      blok: '-',
      janjang: 0,
      timestamp: '-',
      status: 'pending',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Menunggu Approval</Text>
        <Text style={styles.subtitle}>Validasi data panen dari Krani</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderLeftColor: '#f57c00' }]}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#2d5016' }]}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Approved Hari Ini</Text>
        </View>
      </View>

      <View style={styles.section}>
        {pendingApprovals.map((item) => (
          <View key={item.id} style={styles.approvalCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.kraniName}>{item.krani}</Text>
                <Text style={styles.blokInfo}>Blok {item.blok}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#fff3e0' }]}>
                <Clock size={14} color="#f57c00" />
                <Text style={[styles.statusText, { color: '#f57c00' }]}>Pending</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Janjang</Text>
                <Text style={styles.infoValue}>{item.janjang}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Waktu Input</Text>
                <Text style={styles.infoValue}>{item.timestamp}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.rejectButton}>
                <XCircle size={18} color="#d32f2f" />
                <Text style={styles.rejectText}>Tolak</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveButton}>
                <CheckCircle size={18} color="#fff" />
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {pendingApprovals.length === 0 && (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada data pending</Text>
            <Text style={styles.emptySubtext}>
              Semua data panen sudah di-approve
            </Text>
          </View>
        )}
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
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  approvalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  kraniName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  blokInfo: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d32f2f',
    gap: 6,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2d5016',
    gap: 6,
  },
  approveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
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
  },
});
