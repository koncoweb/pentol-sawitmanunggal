import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Truck, ClipboardCheck, AlertTriangle } from 'lucide-react-native';
import { getDbClient } from '@/lib/db';
import { useTranslation } from 'react-i18next';

export default function KraniBuahDashboard() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState({ spbToday: 0, shippedToday: 0, restanToday: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const db = await getDbClient();
    try {
      const [spbRes, shippedRes, restanRes] = await Promise.all([
        db.query(
          `
            SELECT COUNT(*)::int AS count
            FROM spb
            WHERE tanggal = CURRENT_DATE
          `
        ),
        db.query(
          `
            SELECT COUNT(*)::int AS count
            FROM spb
            WHERE tanggal = CURRENT_DATE
              AND status = 'shipped'
          `
        ),
        db.query(
          `
            SELECT COUNT(*)::int AS count
            FROM harvest_records
            WHERE tanggal = CURRENT_DATE
              AND status = 'approved'
              AND spb_id IS NULL
          `
        ),
      ]);

      setStats({
        spbToday: spbRes.rows?.[0]?.count ?? 0,
        shippedToday: shippedRes.rows?.[0]?.count ?? 0,
        restanToday: restanRes.rows?.[0]?.count ?? 0,
      });
    } finally {
      await db.end();
      setStatsLoading(false);
    }
  }, []);

  const showTruckData = useCallback(async () => {
    const db = await getDbClient();
    try {
      const { rows } = await db.query(
        `
          SELECT nomor_spb, driver_name, truck_plate, status
          FROM spb
          WHERE tanggal = CURRENT_DATE
          ORDER BY created_at DESC
          LIMIT 10
        `
      );

      if (!rows?.length) {
        Alert.alert(t('kraniBuah.alert.truckData.title'), t('kraniBuah.alert.truckData.noData'));
        return;
      }

      const message = (rows as any[])
        .map((r) => `${r.nomor_spb}\n${r.truck_plate} • ${r.driver_name} • ${String(r.status).toUpperCase()}`)
        .join('\n\n');

      Alert.alert(t('kraniBuah.alert.truckData.titleToday'), message);
    } finally {
      await db.end();
    }
  }, [t]);

  const showRestan = useCallback(async () => {
    const db = await getDbClient();
    try {
      const { rows } = await db.query(
        `
          SELECT
            COALESCE(b.name, '-') AS blok_name,
            COALESCE(SUM(hr.jumlah_jjg), 0)::int AS total_janjang,
            COUNT(*)::int AS record_count
          FROM harvest_records hr
          LEFT JOIN blok b ON b.id = hr.blok_id
          WHERE hr.tanggal = CURRENT_DATE
            AND hr.status = 'approved'
            AND hr.spb_id IS NULL
          GROUP BY COALESCE(b.name, '-')
          ORDER BY total_janjang DESC
          LIMIT 10
        `
      );

      if (!rows?.length) {
        Alert.alert(t('kraniBuah.alert.restan.title'), t('kraniBuah.alert.restan.noData'));
        return;
      }

      const totalJanjang = (rows as any[]).reduce((sum, r) => sum + (Number(r.total_janjang) || 0), 0);
      const message = [
        t('kraniBuah.alert.restan.total', { count: totalJanjang }),
        '',
        ...(rows as any[]).map((r) => t('kraniBuah.alert.restan.listItem', { 
          block: r.blok_name, 
          count: r.total_janjang, 
          records: r.record_count 
        })),
      ].join('\n');

      Alert.alert(t('kraniBuah.alert.restan.titleToday'), message);
    } finally {
      await db.end();
    }
  }, [t]);

  const showValidateLoad = useCallback(async () => {
    const db = await getDbClient();
    try {
      const { rows } = await db.query(
        `
          SELECT
            COALESCE(b.name, '-') AS blok_name,
            COALESCE(SUM(hr.jumlah_jjg), 0)::int AS total_janjang,
            COALESCE(SUM(hr.hasil_panen_bjd), 0)::numeric AS total_kg
          FROM harvest_records hr
          LEFT JOIN blok b ON b.id = hr.blok_id
          WHERE hr.status = 'approved'
            AND hr.spb_id IS NULL
            AND hr.tanggal = CURRENT_DATE
          GROUP BY COALESCE(b.name, '-')
          ORDER BY total_janjang DESC
        `
      );

      if (!rows?.length) {
        Alert.alert(t('kraniBuah.alert.validate.title'), t('kraniBuah.alert.validate.noData'));
        return;
      }

      const totalJanjang = (rows as any[]).reduce((sum, r) => sum + (Number(r.total_janjang) || 0), 0);
      const totalKg = (rows as any[]).reduce((sum, r) => sum + (Number(r.total_kg) || 0), 0);
      const message = [
        t('kraniBuah.alert.validate.total', { jjg: totalJanjang, kg: totalKg }),
        '',
        ...(rows as any[]).map((r) => t('kraniBuah.alert.validate.listItem', { 
          block: r.blok_name, 
          jjg: r.total_janjang, 
          kg: Number(r.total_kg) || 0 
        })),
      ].join('\n');

      Alert.alert(t('kraniBuah.alert.validate.titleToday'), message, [
        { text: t('kraniBuah.alert.buttons.close'), style: 'cancel' },
        { text: t('kraniBuah.alert.buttons.createSpb'), onPress: () => router.push('../create-spb') },
      ]);
    } finally {
      await db.end();
    }
  }, [router, t]);

  useFocusEffect(
    useCallback(() => {
      void loadStats();
    }, [loadStats])
  );

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'create-spb':
        router.push('../create-spb');
        break;
      case 'spb-report':
        router.push('/spb-report');
        break;
      case 'truck-data':
        router.push('../spb-list');
        break;
      case 'validate-load':
        void showValidateLoad();
        break;
      case 'check-restan':
        void showRestan();
        break;
      default:
        console.log(action);
    }
  };

  const menuItems = [
    {
      id: '1',
      title: t('kraniBuah.menu.createSpb.title'),
      description: t('kraniBuah.menu.createSpb.desc'),
      icon: FileText,
      color: '#2d5016',
      action: 'create-spb',
    },
    {
      id: '5',
      title: t('kraniBuah.menu.spbReport.title'),
      description: t('kraniBuah.menu.spbReport.desc'),
      icon: FileText,
      color: '#1e3a8a', // Blue color to distinguish
      action: 'spb-report',
    },
    {
      id: '2',
      title: t('kraniBuah.menu.truckData.title'),
      description: t('kraniBuah.menu.truckData.desc'),
      icon: Truck,
      color: '#4a7c23',
      action: 'truck-data',
    },
    {
      id: '3',
      title: t('kraniBuah.menu.validateLoad.title'),
      description: t('kraniBuah.menu.validateLoad.desc'),
      icon: ClipboardCheck,
      color: '#6ba82e',
      action: 'validate-load',
    },
    {
      id: '4',
      title: t('kraniBuah.menu.checkRestan.title'),
      description: t('kraniBuah.menu.checkRestan.desc'),
      icon: AlertTriangle,
      color: '#f57c00',
      action: 'check-restan',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('common.welcome')}</Text>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>{t('kraniBuah.role')}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statsLoading ? '-' : stats.spbToday}</Text>
          <Text style={styles.statLabel}>{t('kraniBuah.stats.spbToday')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statsLoading ? '-' : stats.shippedToday}</Text>
          <Text style={styles.statLabel}>{t('kraniBuah.stats.shippedToday')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statsLoading ? '-' : stats.restanToday}</Text>
          <Text style={styles.statLabel}>{t('kraniBuah.stats.restan')}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>{t('kraniBuah.menu.title')}</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuAction(item.action)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <item.icon size={24} color="#fff" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.alertCard}>
        <AlertTriangle size={20} color="#f57c00" />
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{t('kraniBuah.alert.attention')}</Text>
          <Text style={styles.alertText}>
            {t('kraniBuah.alert.attentionText')}
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
    backgroundColor: '#2d5016',
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#d4e5c7',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  roleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d5016',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  menuContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#666',
  },
  alertCard: {
    margin: 16,
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 32,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f57c00',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#e65100',
    lineHeight: 20,
  },
});
