# App icons

Platform rules change with OS releases; confirm against current platform documentation (Apple Human Interface Guidelines and Xcode's asset catalog, Android developer docs, store consoles) before shipping. The facts below are the stable core.

## 1. Design principles for any app icon

- One simple glyph or letterform, centred, bold. No text beyond a single letter. No photos. No fine detail.
- Legible from 1024 px down to about 29 px (iOS settings) and 16 to 24 px (small contexts).
- A solid, confident background (or a simple two-tone) so the icon stands out on varied wallpapers.
- Do not bake in rounded corners, shadows or gloss on platforms that apply their own mask or effects.
- Test the full-bleed square, the masked shape, light and dark, and tinted/monochrome variants.
- The symbol is usually the logo's symbol on a brand colour; if the symbol is wide or detailed, use the small-size cut or a simplified glyph.

## 2. iOS and iPadOS

- App Store and asset catalog master: **1024 x 1024 PNG, sRGB or Display P3, no transparency, no pre-rounded corners.** The system applies the rounded (continuous corner) mask and effects.
- Current Xcode uses a single large icon and generates other sizes; older projects need the full list of sizes. Check the project's `AppIcon` asset set.
- Newer iOS (iOS 18 and later) adds dark and tinted appearances; iOS 26 uses layered icons built in Icon Composer with glass effects. Provide: a foreground layer (the glyph, transparent), a background (solid or gradient), and let the system derive light, dark, clear and tinted. Keep glyphs simple and avoid baked-in shadows so the glass treatment works.
- Keep the key shape inside the central area; the mask trims the corners and the home screen shows a rounded square (about 22.37 percent corner radius at the continuous curve).
- Notification and settings icons are derived automatically.

## 3. Android

- **Adaptive icon (API 26+):** two layers, foreground and background, each **108 x 108 dp**. The system masks them to a circle, squircle, rounded square or other shape per device. The visible area is at most 72 x 72 dp in the centre; keep essential artwork inside a **66 dp diameter circle** safe zone.
- **Themed (monochrome) icon (Android 13+):** supply a monochrome layer (the glyph in one colour with transparency) so the system can tint it with the wallpaper palette.
- Declare in `res/mipmap-anydpi-v26/ic_launcher.xml` with `<background>`, `<foreground>` and `<monochrome>`. Vector drawables are fine; keep them simple.
- **Play Store listing icon:** 512 x 512 PNG, 32-bit, up to 1024 KB; Google applies the mask and shadow. A separate feature graphic (1024 x 500) is not the logo.
- Legacy launcher icons (mdpi 48, hdpi 72, xhdpi 96, xxhdpi 144, xxxhdpi 192 px) only if supporting old API levels; Android Studio's Image Asset tool can generate them.

## 4. macOS

- App icon sizes in an `.icns` / asset catalog: 16, 32, 128, 256, 512 pt at 1x and 2x (up to 1024 px). Classic macOS icons are a rounded square with the artwork inset on a 1024 canvas; current macOS also supports layered, system-styled icons from Icon Composer. Follow the template in the current HIG.
- Do not reuse the iOS full-bleed square; Mac icons have their own margin and depth conventions.

## 5. Windows

- `.ico` containing 16, 24, 32, 48, 64 and 256 px; Store tiles 44, 71, 150, 310 px (and wide 310 x 150) with transparent backgrounds and a tile colour set in the manifest.
- Simple glyphs read well in Fluent UI. Test on light, dark and accent backgrounds.
- Pack PNGs into `.ico` with `node scripts/svg-check.mjs ico 16.png 24.png 32.png 48.png 64.png 256.png -o app.ico`.

## 6. Linux

- SVG icon in `hicolor/scalable/apps/` plus PNGs at 48, 64, 128, 256 px; `.desktop` file referencing the icon name.

## 7. Web (PWA) and desktop shells

- `any` icons at 192 and 512; a `maskable` 512 whose artwork stays within the central 80 percent circle.
- Electron and Tauri: platform icon sets from a 1024 px master via the framework's icon command (Tauri: `tauri icon`; Electron builders convert from a 512 or 1024 PNG). Run the project's documented command; do not download unpinned tools.

## 8. React Native, Expo and Flutter

- Expo: `icon` (1024 x 1024 PNG, no transparency), `android.adaptiveIcon.foregroundImage` (transparent, 1024 x 1024 canvas with artwork in the safe area), `backgroundColor`, optional `monochromeImage`, `splash` and `favicon` for web in `app.json` / `app.config`. Configuration and store submission are `lll:mobile`.
- Flutter: `flutter_launcher_icons` package if the project already uses it; otherwise generate sets by hand per platform.
- Replace the default template icon before any store build; a default icon is a release blocker.

## 9. Splash and launch images

Keep the logo small and centred on a solid brand surface; do not animate beyond a fade. The splash is a loading bridge, not a brand film.

## 10. Generating the canvases

`node scripts/svg-check.mjs icon symbol.svg --kind ios|android-fg|maskable|plain [--bg "#hex"] [--fit 0.6] [--dy 0] -o out.svg` fits the symbol into the right canvas and safe area: `ios` 1024 square, `android-fg` 108 dp with the artwork inside the 66 dp circle (no `--bg`, transparent), `maskable` 512 inside the 80 percent circle, `plain` 1024. Use `variants` for a monochrome layer (`--mono "#000000"`). Look at each render inside its mask before shipping.

## 11. Production checklist

1. Master 1024 PNG: no transparency (iOS), sRGB, glyph centred, key shape inside the safe area.
2. Android: foreground, background and monochrome layers; the safe-zone circle respected.
3. Web: favicon.ico, icon.svg, apple-touch-icon 180, manifest icons including maskable.
4. Windows or desktop: ico set or framework-generated icons.
5. View each in its mask on light and dark wallpapers; view at the smallest size.
6. List what was not produced (no renderer, no Xcode, no Android Studio) and the exact commands for the owner.
