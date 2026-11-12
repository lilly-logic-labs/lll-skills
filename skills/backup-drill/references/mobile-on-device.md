# On-device data: mobile and desktop apps

First question: where is the source of truth? If every record is on a server, device loss costs nothing and the drill is about the server stores. If the app keeps data only on the device (local-first apps, notes, finance, health, offline queues), device loss is data loss, and the backup is the OS backup, a sync service or a user-visible export. Drill whichever applies on a real device or an emulator with a clean profile.

Contents: Android · iOS · Expo and React Native · Flutter · Desktop (Electron, Tauri, Wails, native) · Restore-day behaviour to test · Sync danger

## Android

- **Auto Backup** (Android 6 and later) copies app data to the user's Google account, with a size cap per app (about 25 MB). It is controlled by `android:allowBackup`, `android:fullBackupContent` (Android 11 and earlier) and `android:dataExtractionRules` (Android 12 and later). Files in `noBackupFilesDir` and caches are excluded.
- Keystore keys never move to a new device. Anything encrypted with a Keystore key (a SQLCipher passphrase, tokens) is unreadable after restore; the app must detect that and re-create or ask the user to sign in.
- Drill with the backup manager on a debuggable build:

  ```
  adb shell bmgr enable true
  adb shell bmgr backupnow <package>
  adb uninstall <package>        # then reinstall the same build
  adb shell dumpsys backup | findstr /i <package>
  ```

  Reinstalling normally triggers a restore when a transport is available. For the transport and tokens use `adb shell bmgr list transports` and `adb shell bmgr restore <token> <package>`. Devices differ; test on at least one physical phone with a Google account.
- Room and SQLite: databases live under `databases/` inside the app's data directory; checkpoint the WAL before relying on a file copy.
- Decide on purpose whether sensitive data is excluded (`allowBackup="false"` or exclusion rules). Either answer is valid; an unconsidered default is the finding.

## iOS

- iCloud and Finder/iTunes backups include `Documents` and `Library` except `Caches` and `tmp`. Mark rebuildable files `isExcludedFromBackup`.
- Keychain items with a "this device only" accessibility class do not transfer to a new device; items with the default class restore from an encrypted backup only.
- CloudKit and iCloud Drive are sync, not backup: a deletion propagates to every device. Do not call them backups.
- Core Data, SwiftData and GRDB stores in `Application Support` are backed up; checkpoint WAL files and keep the `-wal` and `-shm` with the database.
- Drill: back up a test device to Finder or iCloud, erase it or use a spare device, restore, install or keep the app, and check the data. In Xcode, Devices and Simulators, "Download Container" lets you inspect the app's data before and after.

## Expo and React Native

- `expo-sqlite` stores databases in the app's document or database directory, so they follow the platform backup rules above. AsyncStorage, MMKV and file-system data do too.
- `expo-secure-store` and Keychain/Keystore values do not follow the user to a new device. Plan a re-login or key re-creation path.
- Over-the-air updates do not change stored data; a new build with a new schema version needs a migration that works on restored older data. Test a restore of data written by the previous release into the current release.
- A portable backup is an in-app export (JSON, CSV or an encrypted file shared through the share sheet) with an import that runs on a clean install. Drill that: export on device A, install clean on device B, import, compare counts, repeat with an export from the previous app version.

## Flutter

Same platform rules. `path_provider`: `getApplicationDocumentsDirectory` is included in iOS backups, `getApplicationSupportDirectory` is the usual place for databases (`sqflite`, `drift`, `isar`), `getTemporaryDirectory` is not backed up. Verify the package you use for secrets (`flutter_secure_storage`) against the Keychain and Keystore notes.

## Desktop

- Data lives in the user profile: `%APPDATA%` or `%LOCALAPPDATA%` on Windows, `~/Library/Application Support` on macOS, `~/.config` or `~/.local/share` on Linux.
- Backup is a copy taken with the app closed, or a SQLite online backup (`.backup`) while it runs. Document the exact paths.
- Drill: copy the profile folder to a clean user account or VM, install the app, confirm it opens the data, runs migrations and signs in. Upgrade over the previous version and check data survives.
- Auto-update must never delete the data directory; installers should not remove it on uninstall without asking.

## Restore-day behaviour to test

- First launch after restore: does the schema version match? Do migrations run, and do they cope with data written by an older app?
- Tokens and sessions: the server may have revoked them. Is the sign-in flow clean, with no crash loop?
- Push tokens, device ids, licence activations and attestation: re-registered or stale?
- Absolute file paths and content URIs saved in the database break on a new device.
- Encrypted data without its key: a clear message, not a blank screen.
- Time zone, locale and clock skew.
- Storage: a partial restore must not leave the app in an unrecoverable state; offer a reset-and-resync path.

## Sync danger

Restoring an old backup onto a device that syncs with a server can push stale rows over newer server data. Check that conflict resolution uses version numbers or `updated_at` comparisons, not "last device to connect wins", and that a restored device is treated as behind, not ahead. Test it: restore a week-old backup on a device, sign in, and confirm newer server data survives.
