#!/usr/bin/env node
// Read-only inventory of a mobile project: stack, ids, versions, permissions, deep links,
// SDKs and risky settings. Zero dependencies, Node >= 18. Prints locations, never secret values.
//   node mobile-inventory.mjs [projectDir] [--json]
//   node mobile-inventory.mjs --selftest
import { readdirSync, readFileSync, existsSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'

const SKIP = new Set(['node_modules', 'Pods', 'build', '.gradle', '.expo', 'dist', '.git', '.dart_tool', '.venv', 'DerivedData', '.next', '.wrangler', '.worktrees', '.idea'])
const KNOWN_SDKS = ['expo-updates', 'expo-notifications', 'expo-router', 'expo-dev-client', 'expo-secure-store', 'expo-sqlite', '@sentry/react-native', '@react-native-firebase/app', '@react-native-firebase/crashlytics', 'react-native-reanimated', '@shopify/flash-list', 'react-native-mmkv', '@react-native-async-storage/async-storage', 'react-native-purchases', 'react-native-iap', '@notifee/react-native', 'react-native-maps']
const SIGNING = /\.(jks|keystore|p8|p12|mobileprovision)$|^key\.properties$|^keystore\.properties$|^google-services\.json$|^GoogleService-Info\.plist$|^service-account.*\.json$/i

function walk(root, maxDepth = 7, cap = 30000) {
  const out = []
  const rec = (dir, depth) => {
    if (depth > maxDepth || out.length > cap) return
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.isDirectory()) { if (!SKIP.has(e.name)) rec(join(dir, e.name), depth + 1) }
      else out.push(join(dir, e.name))
    }
  }
  rec(root, 0)
  return out
}

const read = (f) => { try { return readFileSync(f, 'utf8') } catch { return '' } }
const rel = (root, f) => relative(root, f).split('\\').join('/')
const uniq = (a) => [...new Set(a)].sort()

export function inventory(root) {
  const files = walk(root)
  const r = { root, stacks: [], ids: {}, versions: {}, android: {}, ios: {}, expo: {}, flutter: {}, permissions: { android: [], ios: [] }, deepLinks: [], sdks: [], signingFiles: [], envKeys: [], flags: [] }
  const flag = (level, msg) => r.flags.push(`${level}: ${msg}`)
  const add = (s) => { if (!r.stacks.includes(s)) r.stacks.push(s) }

  for (const f of files) {
    const name = basename(f), p = rel(root, f)
    if (SIGNING.test(name)) r.signingFiles.push(p)

    if (name === 'package.json' && !p.includes('/node_modules/')) {
      let j; try { j = JSON.parse(read(f)) } catch { continue }
      const deps = { ...j.dependencies, ...j.devDependencies }
      if (deps.expo) { add('expo'); r.expo.sdk = deps.expo }
      if (deps['react-native']) { add('react-native'); r.expo.reactNative = deps['react-native'] }
      for (const s of KNOWN_SDKS) if (deps[s]) r.sdks.push(s)
      if (j.version && !r.versions.packageJson) r.versions.packageJson = j.version
    }
    if (name === 'app.json') {
      let j; try { j = JSON.parse(read(f)) } catch { continue }
      const e = j.expo || j
      if (e.name) {
        add('expo-config')
        r.ids.expoSlug = e.slug; r.versions.expo = e.version
        r.ids.iosBundle = e.ios?.bundleIdentifier; r.ids.androidPackage = e.android?.package
        r.expo.runtimeVersion = e.runtimeVersion; r.expo.updates = e.updates ? Object.keys(e.updates) : undefined
        r.expo.newArch = e.newArchEnabled; r.expo.scheme = e.scheme
        r.expo.plugins = (e.plugins || []).map((x) => (Array.isArray(x) ? x[0] : x))
        r.permissions.android.push(...(e.android?.permissions || []))
        r.permissions.ios.push(...Object.keys(e.ios?.infoPlist || {}).filter((k) => /UsageDescription$/.test(k)))
        if (e.android?.versionCode != null) r.versions.androidVersionCode = e.android.versionCode
        if (e.ios?.buildNumber != null) r.versions.iosBuildNumber = e.ios.buildNumber
      }
    }
    if (/^app\.config\.(js|ts|mjs|cjs)$/.test(name)) { add('expo-config'); r.expo.dynamicConfig = p }
    if (name === 'eas.json') {
      try {
        const j = JSON.parse(read(f))
        r.expo.easBuildProfiles = Object.keys(j.build || {}); r.expo.easSubmitProfiles = Object.keys(j.submit || {})
        r.expo.appVersionSource = j.cli?.appVersionSource
      } catch { flag('WARN', `${p} is not valid JSON`) }
    }
    if (/^build\.gradle(\.kts)?$/.test(name) && /applicationId|com\.android\.application/.test(read(f))) {
      add('android')
      const t = read(f), g = (re) => t.match(re)?.[1]
      r.ids.androidApplicationId = g(/applicationId\s*=?\s*["']([^"']+)["']/) || r.ids.androidApplicationId
      r.android.versionCode = g(/versionCode\s*=?\s*(\d+)/); r.versions.androidVersionName = g(/versionName\s*=?\s*["']([^"']+)["']/)
      r.android.minSdk = g(/minSdk(?:Version)?\s*=?\s*(\d+)/); r.android.targetSdk = g(/targetSdk(?:Version)?\s*=?\s*(\d+)/); r.android.compileSdk = g(/compileSdk(?:Version)?\s*=?\s*(\d+)/)
      r.android.minify = /isMinifyEnabled\s*=\s*true|minifyEnabled\s+true/.test(t)
      r.android.gradleFile = p
    }
    if (name === 'AndroidManifest.xml' && !p.includes('/build/')) {
      add('android')
      const t = read(f), variant = p.match(/src\/([^/]+)\//)?.[1], isMain = (!variant || variant === 'main') && /<activity/.test(t)
      for (const m of t.matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)) r.permissions.android.push(m[1])
      if (isMain && /android:usesCleartextTraffic="true"/.test(t)) flag('WARN', `${p}: usesCleartextTraffic=true (HTTP allowed in release)`)
      if (isMain && /android:debuggable="true"/.test(t)) flag('FAIL', `${p}: android:debuggable="true" in the main manifest`)
      if (isMain && !/android:allowBackup="false"/.test(t) && /<application/.test(t)) flag('INFO', `${p}: allowBackup not false (app data may be backed up; decide deliberately)`)
      for (const m of t.matchAll(/<(activity|service|receiver|provider)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
        if (/<intent-filter/.test(m[3]) && !/android:exported=/.test(m[2])) flag('WARN', `${p}: component with intent-filter lacks android:exported`)
        for (const fl of m[3].matchAll(/<intent-filter\b([^>]*)>([\s\S]*?)<\/intent-filter>/g)) {
          for (const f2 of fl[2].matchAll(/<data\b([^>]*)\/?>/g)) {
            const sch = f2[1].match(/android:scheme="([^"]+)"/)?.[1], host = f2[1].match(/android:host="([^"]+)"/)?.[1]
            if (sch) r.deepLinks.push(`${sch}://${host || ''}${/autoVerify="true"/.test(fl[1]) ? ' (autoVerify)' : ''} [${p}]`)
          }
        }
      }
    }
    if (name === 'Info.plist' && !p.includes('/Pods/')) {
      add('ios')
      const t = read(f)
      const id = t.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)</)?.[1]
      if (id) r.ids.iosBundle = r.ids.iosBundle || id
      for (const m of t.matchAll(/<key>(NS\w+UsageDescription)<\/key>/g)) r.permissions.ios.push(m[1])
      if (/<key>NSAllowsArbitraryLoads<\/key>\s*<true\/>/.test(t)) flag('WARN', `${p}: NSAllowsArbitraryLoads=true (App Transport Security disabled)`)
      for (const m of t.matchAll(/<key>CFBundleURLSchemes<\/key>\s*<array>([\s\S]*?)<\/array>/g)) for (const s of m[1].matchAll(/<string>([^<]+)</g)) r.deepLinks.push(`${s[1]}:// [${p}]`)
      r.ios.infoPlist = p
    }
    if (name === 'PrivacyInfo.xcprivacy') r.ios.privacyManifest = p
    if (/\.entitlements$/.test(name)) { const d = [...read(f).matchAll(/applinks:([^<\s]+)/g)].map((m) => m[1]); if (d.length) r.deepLinks.push(...d.map((x) => `https://${x} (associated domain) [${p}]`)) }
    if (name === 'pubspec.yaml') {
      const t = read(f)
      if (/^\s*flutter:\s*$/m.test(t) || /sdk:\s*flutter/.test(t)) {
        add('flutter'); r.flutter.name = t.match(/^name:\s*(\S+)/m)?.[1]; r.versions.flutter = t.match(/^version:\s*(\S+)/m)?.[1]
        const block = t.match(/^dependencies:\s*\n((?:[ \t]+.*\n?|\n)*)/m)?.[1] || ''
        r.flutter.deps = [...block.matchAll(/^ {2}([a-z0-9_]+):/gm)].map((m) => m[1]).filter((x) => x !== 'flutter')
      }
    }
    if (name === 'Package.swift') add('swiftpm')
    if (/\.xcodeproj$/.test(name) || /\.xcodeproj/.test(p) && name === 'project.pbxproj') add('ios')
    if (/^\.env(\..+)?$/.test(name) && !/\.(example|sample|template)$/.test(name)) {
      for (const line of read(f).split(/\r?\n/)) {
        const k = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/)?.[1]
        if (k && /^(EXPO_PUBLIC_|NEXT_PUBLIC_|VITE_)/.test(k) && /(SECRET|PRIVATE|PASSWORD|TOKEN|API_?KEY|SERVICE_?ROLE)/.test(k)) {
          r.envKeys.push(`${p}:${k}`); flag('FAIL', `${p}: ${k} is bundled into the app and looks like a secret`)
        }
      }
    }
  }
  for (const f of r.signingFiles) if (/\.(jks|keystore|p8|p12|mobileprovision)$|key\.properties$/i.test(f)) flag('WARN', `${f}: signing material in the working tree; confirm it is git-ignored (git check-ignore)`)
  if (r.stacks.includes('ios') && !r.ios.privacyManifest && !r.stacks.includes('expo')) flag('INFO', 'no PrivacyInfo.xcprivacy found in the iOS project')
  if (r.stacks.includes('expo') && r.sdks.includes('expo-updates') && !r.expo.runtimeVersion && !r.expo.dynamicConfig) flag('WARN', 'expo-updates installed but no runtimeVersion in app.json')
  r.permissions.android = uniq(r.permissions.android); r.permissions.ios = uniq(r.permissions.ios)
  r.deepLinks = uniq(r.deepLinks); r.sdks = uniq(r.sdks); r.signingFiles = uniq(r.signingFiles)
  return r
}

function render(r) {
  const L = []
  const kv = (k, v) => v != null && v !== '' && !(Array.isArray(v) && !v.length) && L.push(`  ${k}: ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
  L.push(`Stacks: ${r.stacks.join(', ') || 'none detected'}`)
  L.push('Ids and versions'); for (const [k, v] of Object.entries({ ...r.ids, ...r.versions })) kv(k, v)
  if (r.stacks.some((s) => ['android', 'expo'].includes(s))) { L.push('Android'); for (const [k, v] of Object.entries(r.android)) kv(k, v) }
  if (r.stacks.includes('ios')) { L.push('iOS'); for (const [k, v] of Object.entries(r.ios)) kv(k, v) }
  if (r.stacks.some((s) => s.startsWith('expo'))) { L.push('Expo'); for (const [k, v] of Object.entries(r.expo)) kv(k, v) }
  if (r.stacks.includes('flutter')) { L.push('Flutter'); for (const [k, v] of Object.entries(r.flutter)) kv(k, v) }
  L.push(`Android permissions (${r.permissions.android.length}): ${r.permissions.android.join(', ') || 'none'}`)
  L.push(`iOS usage descriptions (${r.permissions.ios.length}): ${r.permissions.ios.join(', ') || 'none'}`)
  L.push(`Deep links: ${r.deepLinks.join(' | ') || 'none'}`)
  L.push(`Known SDKs: ${r.sdks.join(', ') || 'none'}`)
  L.push(`Signing and service files (locations only): ${r.signingFiles.join(', ') || 'none'}`)
  L.push('Flags'); L.push(...(r.flags.length ? r.flags.map((x) => '  ' + x) : ['  none']))
  return L.join('\n')
}

function selftest() {
  const d = mkdtempSync(join(tmpdir(), 'mobinv-'))
  try {
    const w = (p, c) => { mkdirSync(join(d, p, '..'), { recursive: true }); writeFileSync(join(d, p), c) }
    w('package.json', JSON.stringify({ dependencies: { expo: '~52.0.0', 'react-native': '0.76.0', 'expo-updates': '*' } }))
    w('app.json', JSON.stringify({ expo: { name: 'Demo', slug: 'demo', version: '1.2.3', ios: { bundleIdentifier: 'com.example.demo' }, android: { package: 'com.example.demo', permissions: ['CAMERA'] } } }))
    w('eas.json', JSON.stringify({ build: { production: {}, preview: {} }, submit: { production: {} } }))
    w('.env', 'EXPO_PUBLIC_API_URL=https://x\nEXPO_PUBLIC_STRIPE_SECRET_KEY=abc\n')
    w('android/app/build.gradle', 'android { compileSdk 35\n defaultConfig { applicationId "com.example.demo"\n minSdk 24\n targetSdk 35\n versionCode 7\n versionName "1.2.3" } }')
    w('android/app/src/main/AndroidManifest.xml', '<manifest><uses-permission android:name="android.permission.CAMERA"/><application android:usesCleartextTraffic="true"><activity android:name=".Main"><intent-filter><data android:scheme="demo" android:host="open"/></intent-filter></activity></application></manifest>')
    w('android/app/release.keystore', 'x')
    w('node_modules/pkg/package.json', '{"dependencies":{"expo":"1"}}')
    const r = inventory(d)
    assert.deepEqual(r.stacks.sort(), ['android', 'expo', 'expo-config', 'react-native'].sort())
    assert.equal(r.ids.androidApplicationId, 'com.example.demo')
    assert.equal(r.android.targetSdk, '35')
    assert.ok(r.permissions.android.includes('android.permission.CAMERA'))
    assert.ok(r.deepLinks.some((x) => x.startsWith('demo://open')))
    assert.ok(r.flags.some((x) => x.startsWith('FAIL') && x.includes('EXPO_PUBLIC_STRIPE_SECRET_KEY')))
    assert.ok(r.flags.some((x) => x.includes('usesCleartextTraffic')))
    assert.ok(r.flags.some((x) => x.includes('lacks android:exported')))
    assert.ok(r.flags.some((x) => x.includes('runtimeVersion')))
    assert.ok(r.signingFiles.some((x) => x.endsWith('release.keystore')))
    assert.ok(!JSON.stringify(r).includes('abc'), 'secret value must never be printed')
    assert.ok(render(r).includes('Stacks:'))
    console.log('selftest ok')
  } finally { rmSync(d, { recursive: true, force: true }) }
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()
else if (import.meta.url === new URL(process.argv[1], 'file://').href || process.argv[1]?.endsWith('mobile-inventory.mjs')) {
  const dir = args.find((a) => !a.startsWith('--')) || process.cwd()
  if (!existsSync(dir)) { console.error(`not found: ${dir}`); process.exit(2) }
  const r = inventory(dir)
  console.log(args.includes('--json') ? JSON.stringify(r, null, 2) : render(r))
}
