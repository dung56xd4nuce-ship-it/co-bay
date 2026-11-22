# Get the APK in ~10 minutes — no software install needed
# (Lấy file APK trong ~10 phút — không cần cài gì trên máy)

The `capacitor/` folder already contains a GitHub Actions robot (`.github/workflows/build-android.yml`) that builds the APK for you in the cloud, free.

## Steps / Các bước
1. Create a free account at github.com (nếu chưa có).
2. Create a **new repository** (Private is fine) → "uploading an existing file" → kéo-thả TOÀN BỘ nội dung thư mục `capacitor/` lên (bao gồm thư mục ẩn `.github/` — nếu kéo thả web không nhận thư mục ẩn, dùng GitHub Desktop hoặc nén thành repo bằng lệnh `git push`).
3. Vào tab **Actions** của repo → chọn workflow **Build Android APK** → **Run workflow** (hoặc nó tự chạy ngay khi push).
4. Chờ ~5–8 phút → mở lần chạy xanh ✓ → mục **Artifacts**:
   - `LoanTheMeme-debug-apk` → **app-debug.apk**: tải về điện thoại, bật "Cài từ nguồn không xác định", cài và CHƠI NGAY (bản chính thức cho máy anh).
   - `LoanTheMeme-release-aab` → dùng khi nộp Google Play (cần ký — xem PUBLISHING_GUIDE.md §2).
5. Mỗi lần có bản game mới: thay `www/index.html`, push lại → APK mới tự build.

## iOS
Apple bắt buộc build bằng Xcode trên macOS + tài khoản Apple Developer ($99/năm) — không có đường tắt cloud miễn phí hợp lệ. Trong lúc đó, người dùng iPhone chơi bản PWA (`web/`): mở Safari → Share → "Add to Home Screen" là thành app toàn màn hình, chạy offline.
