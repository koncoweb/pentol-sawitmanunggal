import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { authClient } from '@/lib/auth-client';
import { getDbClient } from '@/lib/db';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

const dummyUsers = [
  {
    email: 'krani.panen@sawitmanunggal.com',
    password: 'panen123',
    full_name: 'Budi Santoso',
    role: 'krani_panen'
  },
  {
    email: 'krani.buah@sawitmanunggal.com',
    password: 'buah123',
    full_name: 'Andi Wijaya',
    role: 'krani_buah'
  },
  {
    email: 'mandor@sawitmanunggal.com',
    password: 'mandor123',
    full_name: 'Hendra Kusuma',
    role: 'mandor'
  },
  {
    email: 'asisten@sawitmanunggal.com',
    password: 'asisten123',
    full_name: 'Rudi Hartono',
    role: 'asisten'
  },
  {
    email: 'estate@sawitmanunggal.com',
    password: 'estate123',
    full_name: 'Bambang Suryanto',
    role: 'estate_manager'
  },
  {
    email: 'regional@sawitmanunggal.com',
    password: 'regional123',
    full_name: 'Ir. Ahmad Yani',
    role: 'regional_gm'
  },
  {
    email: 'nurrahman.hakim@sawitmanunggal.com',
    password: 'rahina112218',
    full_name: 'Nurrahman Hakim',
    role: 'administrator'
  }
];

export default function SetupUsersScreen() {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState('');
  const [created, setCreated] = useState<string[]>([]);

  const createUsers = async () => {
    setCreating(true);
    setProgress(t('setupUsers.progress.starting'));
    setCreated([]);

    for (const user of dummyUsers) {
      try {
        setProgress(t('setupUsers.progress.creating', { email: user.email }));

        // Sign up with Neon Auth
        const { data, error } = await authClient.signUp.email({
          email: user.email,
          password: user.password,
          name: user.full_name,
        });

        if (error) {
          if (error.message?.includes('already registered') || error.status === 400 || error.message?.includes('already exists')) {
             setCreated(prev => [...prev, t('setupUsers.status.alreadyExists', { email: user.email })]);
          } else {
            setCreated(prev => [...prev, t('setupUsers.status.error', { email: user.email, error: error.message })]);
          }
        } else if (data) {
           // User created successfully. Now create/update profile.
           const db = await getDbClient();
           try {
             await db.query(`
               INSERT INTO profiles (id, email, full_name, role)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (id) DO UPDATE
               SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
             `, [data.user.id, user.email, user.full_name, user.role]);
             await db.end();
             setCreated(prev => [...prev, t('setupUsers.status.success', { email: user.email })]);
           } catch (dbError: any) {
             console.error('DB Error:', dbError);
             setCreated(prev => [...prev, t('setupUsers.status.dbFail', { email: user.email, error: dbError.message })]);
           }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        setCreated(prev => [...prev, t('setupUsers.status.error', { email: user.email, error: error.message })]);
      }
    }

    setProgress(t('setupUsers.progress.done'));
    setCreating(false);

    Alert.alert(
      t('setupUsers.alert.title'),
      t('setupUsers.alert.message'),
      [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]
    );
  };

  const updateProfiles = async () => {
    setCreating(true);
    setProgress(t('setupUsers.progress.updatingProfiles'));
    try {
      const db = await getDbClient();
      
      const queries = [
        {
          email: 'krani.panen@sawitmanunggal.com',
          updates: { full_name: 'Budi Santoso', role: 'krani_panen' }
        },
        {
          email: 'krani.buah@sawitmanunggal.com',
          updates: { full_name: 'Andi Wijaya', role: 'krani_buah' }
        },
        {
          email: 'mandor@sawitmanunggal.com',
          updates: { full_name: 'Hendra Kusuma', role: 'mandor' }
        },
        {
          email: 'asisten@sawitmanunggal.com',
          updates: { full_name: 'Rudi Hartono', role: 'asisten' }
        },
        {
          email: 'estate@sawitmanunggal.com',
          updates: { full_name: 'Bambang Suryanto', role: 'estate_manager' }
        },
        {
          email: 'regional@sawitmanunggal.com',
          updates: { full_name: 'Ir. Ahmad Yani', role: 'regional_gm' }
        },
        {
          email: 'nurrahman.hakim@sawitmanunggal.com',
          updates: { full_name: 'Nurrahman Hakim', role: 'administrator' }
        }
      ];

      for (const query of queries) {
        const userRes = await db.query(`SELECT id FROM neon_auth.user WHERE email = $1`, [query.email]);
        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            await db.query(`
               INSERT INTO profiles (id, email, full_name, role)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (id) DO UPDATE
               SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
            `, [userId, query.email, query.updates.full_name, query.updates.role]);
        }
      }
      
      await db.end();

      Alert.alert(t('setupUsers.alert.successTitle'), t('setupUsers.alert.successMessage'));
    } catch (error: any) {
      Alert.alert(t('setupUsers.alert.errorTitle'), error.message);
    } finally {
      setCreating(false);
    }
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('setupUsers.title')}</Text>
        <Text style={styles.subtitle}>
          {t('setupUsers.subtitle')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('setupUsers.usersList')}</Text>
        {dummyUsers.map((user, index) => (
          <View key={index} style={styles.userCard}>
            <Text style={styles.userName}>{user.full_name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>{t('common.role')}: {user.role}</Text>
          </View>
        ))}
      </View>

      {progress && (
        <View style={styles.progressBox}>
           <Text style={styles.progressText}>{progress}</Text>
           <ActivityIndicator size="small" color="#2d5016" />
        </View>
      )}

      <View style={styles.results}>
          {created.map((msg, idx) => (
              <Text key={idx} style={styles.resultText}>{msg}</Text>
          ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, creating && styles.buttonDisabled]}
          onPress={createUsers}
          disabled={creating}
        >
          <Text style={styles.buttonText}>{t('setupUsers.button.createUsers')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, creating && styles.buttonDisabled]}
          onPress={updateProfiles}
          disabled={creating}
        >
          <Text style={styles.buttonText}>{t('setupUsers.button.updateProfiles')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={() => router.replace('/login')}
        >
          <Text style={[styles.buttonText, styles.buttonOutlineText]}>
            {t('setupUsers.button.toLogin')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>{t('setupUsers.note.title')}</Text>
        <Text style={styles.infoText}>
          {t('setupUsers.note.text')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userRole: {
    fontSize: 12,
    color: '#2d5016',
    fontWeight: 'bold',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2d5016',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#4a7c23',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2d5016',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutlineText: {
    color: '#2d5016',
  },
  progressBox: {
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: '#2d5016',
    fontWeight: 'bold',
  },
  results: {
    marginBottom: 20,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
