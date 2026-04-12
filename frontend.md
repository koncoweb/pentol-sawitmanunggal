# Frontend Guide - PENTOL

## Stack
- Expo SDK 54 + React Native 0.81 + Expo Router
- Context API untuk auth/session
- i18next untuk multi bahasa
- Neon Serverless untuk online fetch
- SQLite (`expo-sqlite`) untuk offline mirror + queue

## Route Kunci
- `app/_layout.tsx`: root auth guard
- `app/(tabs)/_layout.tsx`: role-based tab
- `app/input-panen.tsx`: form utama offline-first
- `app/sync-master.tsx`: download/sync data master
- `app/sync-manager.tsx`: monitoring queue offline

## Alur Offline-First
1. Download master data ke SQLite.
2. Dropdown form baca dari hook online/offline (`lib/offline/hooks.ts`).
3. Submit offline masuk queue (`harvest_records_queue`).
4. Saat online, queue disinkronkan ke Neon.

## Catatan Teknis Penting
- Setelah sync master sukses, cache dropdown di form harus di-refresh.
- Hindari sync master paralel dari banyak trigger.
- Jangan anggap cache memori sebagai source of truth.
- Untuk field dropdown baru, wajib update:
  - schema SQLite,
  - sync master query,
  - hook fallback,
  - validasi layar sync.

## Referensi Detail
- Detail lengkap frontend ada di `docs/Frontend.md`.
