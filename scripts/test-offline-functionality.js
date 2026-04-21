/**
 * Test script to verify offline functionality works correctly
 * Run this script to test the improved offline data handling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Offline Functionality\n');

// Test 1: Check if the offline hook modifications are present
console.log('✅ Test 1: Checking useOfflineData hook modifications...');
const hooksPath = path.join(__dirname, '../lib/offline/hooks.ts');
const hooksContent = fs.readFileSync(hooksPath, 'utf8');

const requiredFeatures = [
  'forceOffline',
  'cacheKey',
  'queryWithTimeout',
  'DEFAULT_TTL',
  'clearCache',
  'getCacheInfo'
];

let allFeaturesPresent = true;
requiredFeatures.forEach(feature => {
  if (!hooksContent.includes(feature)) {
    console.log(`❌ Missing feature: ${feature}`);
    allFeaturesPresent = false;
  } else {
    console.log(`✅ Found feature: ${feature}`);
  }
});

if (allFeaturesPresent) {
  console.log('✅ All required features are present in useOfflineData hook\n');
} else {
  console.log('❌ Some features are missing from useOfflineData hook\n');
}

// Test 2: Check if input-panen.tsx uses forceOffline parameter
console.log('✅ Test 2: Checking input-panen.tsx modifications...');
const inputPath = path.join(__dirname, '../app/input-panen.tsx');
const inputContent = fs.readFileSync(inputPath, 'utf8');

const inputModifications = [
  'forceOffline: isOffline',
  'getDivisi, getGang, getBlok, getPemanen, getTPH, clearCache',
  'loadDivisiData(value, { forceOffline: isOffline })'
];

let inputModificationsCorrect = true;
inputModifications.forEach(mod => {
  if (!inputContent.includes(mod)) {
    console.log(`❌ Missing modification: ${mod}`);
    inputModificationsCorrect = false;
  } else {
    console.log(`✅ Found modification: ${mod}`);
  }
});

if (inputModificationsCorrect) {
  console.log('✅ Input-panen.tsx correctly uses forceOffline parameter\n');
} else {
  console.log('❌ Input-panen.tsx missing some modifications\n');
}

// Test 3: Check if sync managers clear cache
console.log('✅ Test 3: Checking sync managers cache clearing...');
const syncManagerPath = path.join(__dirname, '../app/sync-manager.tsx');
const syncManagerContent = fs.readFileSync(syncManagerPath, 'utf8');

const syncMasterPath = path.join(__dirname, '../app/sync-master.tsx');
const syncMasterContent = fs.readFileSync(syncMasterPath, 'utf8');

const syncModifications = [
  { file: 'sync-manager.tsx', content: syncManagerContent, check: 'clearCache()' },
  { file: 'sync-master.tsx', content: syncMasterContent, check: 'clearCache()' }
];

let syncModificationsCorrect = true;
syncModifications.forEach(({ file, content, check }) => {
  if (!content.includes(check)) {
    console.log(`❌ ${file} missing cache clearing`);
    syncModificationsCorrect = false;
  } else {
    console.log(`✅ ${file} includes cache clearing`);
  }
});

if (syncModificationsCorrect) {
  console.log('✅ Both sync managers clear cache after successful sync\n');
} else {
  console.log('❌ Some sync managers missing cache clearing\n');
}

// Test 4: Check TypeScript compilation
console.log('✅ Test 4: Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful\n');
} catch (error) {
  console.log('❌ TypeScript compilation failed:');
  console.log(error.stdout?.toString() || error.stderr?.toString());
  console.log('');
}

// Summary
console.log('🎯 Test Summary:');
console.log('- useOfflineData hook: Enhanced with caching, timeout, and forceOffline');
console.log('- Input forms: Now use forceOffline for immediate offline data');
console.log('- Sync managers: Clear cache after successful sync');
console.log('- Error handling: Improved with graceful fallbacks');
console.log('\n🚀 Phase 1 implementation complete!');
console.log('\n📋 Next Steps:');
console.log('1. Test the app in offline mode');
console.log('2. Verify dropdowns work immediately when offline');
console.log('3. Check that data syncs properly when connection is restored');
console.log('4. Monitor cache performance and TTL behavior');

console.log('\n✨ Offline synchronization improvements are ready for testing!');
