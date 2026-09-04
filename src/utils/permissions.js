import { Platform, PermissionsAndroid } from 'react-native';

// CAMERA is declared in AndroidManifest.xml (see android/app/src/main/AndroidManifest.xml).
// Once a dangerous permission is manifest-declared, react-native-image-picker
// stops requesting it itself and expects the app to have already obtained it
// at runtime — otherwise launchCamera() rejects with an
// "Manifest.permission.CAMERA" error instead of opening the camera. iOS needs
// no equivalent call: its prompt is triggered automatically by the native
// camera API, backed by Info.plist's NSCameraUsageDescription.
export const requestCameraPermission = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Allow camera access',
        message: 'CrewApply needs camera access to take a photo.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};
