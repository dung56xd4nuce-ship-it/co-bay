# Publishing Guide — Android (APK/AAB) & iOS (IPA)

The `capacitor/` folder is a ready native project (Capacitor 7). The game itself lives in `capacitor/www/index.html` (single file, offline).

## 0) One-time setup
- Install Node.js ≥ 18 and run `npm install` inside `capacitor/`.
- Android: install **Android Studio** (bundles the SDK). iOS: a **Mac with Xcode 15+** and an **Apple Developer account** ($99/yr). Google Play developer account: $25 one-time.

## 1) Update the web build (whenever the game changes)
Replace `capacitor/www/index.html` with the new build, then:
```bash
cd capacitor
npx cap sync
```

## 2) Android — build the APK/AAB
```bash
npx cap open android      # opens Android Studio
```
In Android Studio:
1. Build ▸ **Generate Signed Bundle / APK** → choose **Android App Bundle** (for Play Store) or **APK** (for direct install).
2. Create a keystore (SAVE IT + passwords — losing it means you can never update the app).
3. Select *release*, Finish. Output: `android/app/release/app-release.aab` (or `.apk`).
Quick debug APK without signing: `cd android && ./gradlew assembleDebug` → `android/app/build/outputs/apk/debug/app-debug.apk` (installable with "unknown sources", fine for friends/testing).

Play Console steps: create app → upload AAB to *Internal testing* → fill **Data safety** (no data collected), **Content rating** (IARC questionnaire: cartoon violence), **Privacy policy URL** (host PRIVACY_POLICY.md anywhere public, e.g. GitHub Pages) → promote to Production.

## 3) iOS — build the IPA
On a Mac:
```bash
cd capacitor
npx cap open ios          # opens Xcode
```
In Xcode: select the *App* target → **Signing & Capabilities** → choose your Team (automatic signing) → set a unique Bundle ID (already `com.dungnt.loanthememe`) → Product ▸ **Archive** → *Distribute App* ▸ App Store Connect.
In App Store Connect: create the app, upload the build, fill App Privacy (**Data not collected**), age rating (9+, cartoon violence), attach screenshots, submit for review.

## 4) Store assets
- Icons & splash screens are **already generated** in both native projects (from `assets/`). Regenerate anytime: `npx @capacitor/assets generate --assetPath assets`.
- Use STORE_LISTING.md for names, descriptions, keywords, and the screenshot shot-list.

## 5) Legal checklist before submitting
- [ ] Host PRIVACY_POLICY.md at a public URL and paste the link in both stores.
- [ ] Replace `[your-email@example.com]` in all docs with your real contact.
- [ ] Keep TERMS_OF_SERVICE.md + EULA.md linked from the store listing or an in-game "Legal" note.
- [ ] These templates are solid common practice but are **not legal advice** — for commercial release at scale, have a lawyer review them.

## 6) Fast alternatives while waiting for store review
- **PWA:** the `web/` folder is install-ready (manifest + service worker + icons). Host it on any static host (GitHub Pages, Netlify, itch.io) — Android users get "Add to Home screen" and it runs fullscreen offline.
- **itch.io:** zip the `web/` folder and upload as an HTML5 game — zero review, instant publishing, optional "pay what you want".
