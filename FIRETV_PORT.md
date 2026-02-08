Porting notes for Fire TV / Fire OS

What I changed in this repo:

- Made Google Play Services Gradle plugin optional: `android/app/build.gradle` now applies `com.google.gms.google-services` only when `-PgooglePlay=true` is passed to Gradle. This prevents build failures on Amazon devices that don't have Google Play.
- Added npm script `build:firetv` in `package.json` which runs `./gradlew assembleRelease -PgooglePlay=false -Penv=firetv` in the `android` folder.
- `AndroidManifest.xml` already includes Leanback/TV intent filters and a `banner` resource.

Build and test locally (macOS/zsh):

1. Install Android SDK and set ANDROID_HOME/ANDROID_SDK_ROOT.
2. From project root, build release APK with Google Play disabled:

```bash
cd android
./gradlew assembleRelease -PgooglePlay=false -Penv=firetv
```

Or via npm script from project root:

```bash
npm run build:firetv
```

If you need to include Google Play services features (FusedLocation, Ads, etc.) then build with `-PgooglePlay=true`.

Testing on Fire TV device:

1. Enable ADB debugging on your Fire TV (Settings > My Fire TV > Developer options > ADB Debugging).
2. Connect via ADB: `adb connect <DEVICE_IP>`.
3. Install the release APK: `adb -s <DEVICE_IP>:5555 install -r app/build/outputs/apk/release/app-release.apk`.
4. On Fire TV, find the app under "Apps" or on the launcher if the Leanback intent is present.

UI / Interaction considerations:

- TV devices rely on D-pad / remote. Ensure interactive components are focusable. React Native supports `focusable` prop and the `onFocus` / `onBlur` events. Consider adding `TVEventHandler` for nuanced navigation.
- Avoid relying on touch-specific gestures. Test all flows with the remote.
- Consider larger touch targets and increased font sizes for TV screens.

Publishing to Amazon Appstore:

- Sign the release APK with your production keystore (the repo has `upload-keystore.jks` currently configured in `android/app/build.gradle`).
- Follow Amazon's Appstore submission guidelines and upload the signed APK or AAB.

Next recommended steps:

- Run a full assemble on a CI machine or local environment and test on an actual Fire TV device or Fire TV emulator image.
- Walk through the app with the Fire remote and fix any focus/navigation issues.
- Optionally add a dedicated Fire TV flavor in Gradle for platform-specific resources.

- adb connect 192.168.1.187
- adb install -r /Users/tanny/Documents/pixlme/Android_TVBuild/android/app/build/outputs/apk/release/app-release.apk || true
