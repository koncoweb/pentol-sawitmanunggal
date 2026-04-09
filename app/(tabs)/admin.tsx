import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Users, Map, Layers, TreeDeciduous, Tent, Warehouse, Building, MapPin, Truck, UserCheck, HardHat } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  const menuItems: {
    title: string;
    description: string;
    icon: any;
    route: Href;
    color: string;
  }[] = [
    {
      title: t('admin.menu.users.title'),
      description: t('admin.menu.users.desc'),
      icon: Users,
      route: '/admin/users',
      color: '#2196F3',
    },
    {
      title: t('admin.menu.estates.title'),
      description: t('admin.menu.estates.desc'),
      icon: Building,
      route: '/admin/estates',
      color: '#795548',
    },
    {
      title: t('admin.menu.rayons.title'),
      description: t('admin.menu.rayons.desc'),
      icon: MapPin,
      route: '/admin/rayons',
      color: '#E91E63',
    },
    {
      title: t('admin.menu.divisions.title'),
      description: t('admin.menu.divisions.desc'),
      icon: Warehouse,
      route: '/admin/divisi',
      color: '#4CAF50',
    },
    {
      title: t('admin.menu.gangs.title'),
      description: t('admin.menu.gangs.desc'),
      icon: Map,
      route: '/admin/gang',
      color: '#FF9800',
    },
    {
      title: t('admin.menu.blocks.title'),
      description: t('admin.menu.blocks.desc'),
      icon: Layers,
      route: '/admin/blok',
      color: '#9C27B0',
    },
    {
      title: t('admin.menu.harvesters.title'),
      description: t('admin.menu.harvesters.desc'),
      icon: TreeDeciduous,
      route: '/admin/pemanen',
      color: '#795548',
    },
    {
      title: t('admin.menu.tph.title'),
      description: t('admin.menu.tph.desc'),
      icon: Tent,
      route: '/admin/tph',
      color: '#607D8B',
    },
    {
      title: t('admin.menu.drivers.title'),
      description: t('admin.menu.drivers.desc'),
      icon: UserCheck,
      route: '/admin/drivers',
      color: '#FF5722',
    },
    {
      title: t('admin.menu.vehicles.title'),
      description: t('admin.menu.vehicles.desc'),
      icon: Truck,
      route: '/admin/vehicles',
      color: '#795548',
    },
    {
      title: t('admin.menu.loaders.title'),
      description: t('admin.menu.loaders.desc'),
      icon: HardHat,
      route: '/admin/loaders',
      color: '#FB8C00',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('admin.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('admin.subtitle')}</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => router.push(item.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
              <item.icon size={32} color={item.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  grid: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  cardDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
