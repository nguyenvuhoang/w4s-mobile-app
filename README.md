# Build app apk

- Add prefix npx and try again if below command not working

```sh
eas build -p android --profile preview 
eas build --profile development --platform android 
eas build --profile production  --platform android 

eas build -p ios --profile preview
eas build --profile development --platform ios 
eas build --profile production  --platform ios 

```
# Bump Version

```sh
npx ts-node -r tsconfig-paths/register --project tsconfig.scripts.json ./scripts/bumpVersion.ts
```

# Update OTA (Do NOT bump version)

```sh
eas update --branch production --message "Mess"
```

# Start app expo

```sh
npx expo start
npx expo start --dev-client
```

# Install eas-cli

```sh
npm install --global eas-cli
```
