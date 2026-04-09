Write-Host "Starting script..."
$env:EXPO_CACHE_DIR = "D:\pentol-sawitmanunggal\.expo-cache"
$env:EXPO_HOME = "D:\pentol-sawitmanunggal\.expo-home"
Write-Host "Cache Dir: $env:EXPO_CACHE_DIR"
npx expo start --web --port 8081 --clear
