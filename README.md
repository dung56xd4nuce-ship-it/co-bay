# Loạn Thế Meme — Chibi War Strategy 🏯⚔️

Game chiến thuật thời gian thực chibi: sương mù chiến tranh, do thám, mai phục x2–x10, lương thảo, công thành – vây thành, 40 bản đồ, Quần Hùng 36 nước và P2P 2 người qua WiFi. Chạy offline 100%.

- 🤖 **Tải APK Android:** vào mục **Releases** → `LoanTheMeme-v5.1.apk` (hoặc tab **Actions** → run mới nhất → Artifacts)
- 🎮 **Chơi ngay trên trình duyệt / cài PWA:** thư mục [`web/`](web/)
- 🍎 **iOS:** mở `ios/` bằng Xcode (xem `docs/PUBLISHING_GUIDE.md`)
- 📜 Hồ sơ phát hành tiếng Anh (Privacy, Terms, EULA, Store listing): [`docs/`](docs/)

## Cấu trúc
- `www/index.html` — toàn bộ game (1 file HTML, offline)
- `android/`, `ios/` — vỏ native Capacitor (appId `com.dungnt.loanthememe`)
- `.github/workflows/build-android.yml` — robot tự build APK + đăng Release mỗi lần push

## Cập nhật game
Thay `www/index.html` bằng bản mới → commit & push → APK tự build lại (~6–8 phút).
