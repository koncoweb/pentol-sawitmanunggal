import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, MapPin, User, Image as ImageIcon } from 'lucide-react-native';

type ReportCardProps = {
  tanggal: string;
  divisi: string;
  gang: string;
  blok: string;
  pemanen: string;
  hasilPanen: number;
  fotoUrl?: string | null;
  keterangan: string;
  onPress?: () => void;
};

export default function ReportCard({
  tanggal,
  divisi,
  gang,
  blok,
  pemanen,
  hasilPanen,
  fotoUrl,
  keterangan,
  onPress,
}: ReportCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#2d5016" />
          <Text style={styles.dateText}>{formatDate(tanggal)}</Text>
        </View>
        <View style={styles.resultBadge}>
          <Text style={styles.resultText}>{hasilPanen} JJG</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MapPin size={14} color="#666" />
            <Text style={styles.infoText}>
              {divisi} - {gang} - {blok}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <User size={14} color="#666" />
            <Text style={styles.infoText}>{pemanen}</Text>
          </View>
          {keterangan && (
            <Text style={styles.keterangan} numberOfLines={2}>
              {keterangan}
            </Text>
          )}
        </View>

        {fotoUrl && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: fotoUrl }} style={styles.photoThumbnail} />
          </View>
        )}

        {!fotoUrl && (
          <View style={styles.photoPlaceholder}>
            <ImageIcon size={24} color="#ccc" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
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
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d5016',
  },
  resultBadge: {
    backgroundColor: '#2d5016',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    flexDirection: 'row',
    padding: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  keterangan: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 12,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
