# Loạn Thế Meme v7.0 — Chơi chung 2–8 người qua WiFi nội bộ (không máy chủ)

## Yêu cầu của anh Dũng
- Thêm cơ chế nhiều người chơi với nhau trước khi phát hành.
- Kết nối qua cùng mạng WiFi hoặc Bluetooth, **không dùng máy chủ**, tối đa **8 người**.

## Quyết định
- **Dùng WiFi nội bộ** (cùng router, hoặc một máy bật điểm phát sóng — hotspot — cho các máy kia bắt). Không cần Internet.
- **Không làm Bluetooth**: Android và iPhone không nói chuyện được với nhau qua Bluetooth kiểu này, 8 máy rất chập chờn; hotspot đã đáp ứng nhu cầu "không có mạng".
- Một máy làm **chủ phòng** và chạy trận đấu; các máy khác gửi thao tác, nhận hình trạng thái (cùng cách với chế độ 2 người cũ).
- Hiện chỉ có trên **Android**. iPhone cần viết phần gốc riêng (Swift) — để sau.

## Người chơi thấy gì
- Menu: nút **👥 MULTIPLAYER** (thay nút P2P cũ).
  - Ô tên người chơi + chọn nền văn minh.
  - **🏠 Create a room** — làm chủ phòng. Phòng chờ hiện mã phòng (2 số cuối địa chỉ mạng, ví dụ `1.23`), danh sách người, nút thêm/bớt máy (bot), nút **Start battle** khi đủ từ 2 phe.
  - **🚪 Join a room** — tự dò phòng trên cùng WiFi; không thấy thì gõ mã phòng.
  - **📶 2 players by exchanging codes** — chế độ 2 người đổi mã cũ (chạy qua Internet) vẫn giữ.
- Trận đấu "LAN Battle": bản đồ lớn dần theo số phe (2–8), mỗi phe một kinh đô + làng + đồn như nhau, vị trí chia đều.
- Loại trực tiếp: phe mất hết trại thì bị loại; còn 1 phe là thắng. Người bị loại xem tiếp được.
- Khách rời trận → máy (bot) điều khiển tiếp phe đó. Chủ phòng rời → trận kết thúc với mọi người.
- Trận chơi chung **không đụng tới bản lưu** chơi đơn.

## Kỹ thuật
- `src/09q_mp.js`: cấu hình trận nhiều người (`BW.mpCfg`, `mpInit`, `mpCivs`, `mpVictory`, `mpLeave`), tối đa `BW.MP_MAX=8`.
- `src/10_p2p.js`: lệnh của khách mang theo phe (`handle(m,fid)`), gửi qua phòng khi `P2P.room`.
- `src/11_room.js`: `Lan` (đường truyền) + `Room` (phòng chờ, bắt đầu, chuyển tin).
  - Trong app: gọi plugin gốc `LanPlay` qua `Capacitor.Plugins.LanPlay` (hoặc `nativePromise`). Lưu ý: cầu nối Capacitor bơm vào trang **không có** `registerPlugin`.
  - Bài thử: trạm chuyển tiếp WebSocket (`localStorage ltm_lan_dev`).
- Android (`co-bay/android/.../LanPlugin.java`): TCP cổng 47811 (mỗi dòng một tin JSON), tín hiệu dò phòng UDP 47812 mỗi giây; quyền `ACCESS_WIFI_STATE`, `ACCESS_NETWORK_STATE`, `CHANGE_WIFI_MULTICAST_STATE`.

## Kiểm thử
- `test/gate_lan.mjs` (31 mục): 3 máy giả lập Android/iOS chạm thật — mở phòng, vào phòng, thêm bot, bắt đầu, cùng bản đồ, xuất phát cân bằng, khách ra lệnh bằng chạm, khách rời → bot, loại phe, màn kết quả, bản lưu không đổi, chủ rời, bản đồ 8 phe.
- `test/lan_native.mjs` (17 mục): giả lập cầu nối Capacitor đúng hình dạng Android, cả hai đường gọi plugin.
- Phần Java: chạy thử trên JVM với khung giả (2 khách, gửi riêng/gửi chung, 50 gói 60KB, ngắt kết nối, mở lại, dò UDP) — 9/9.

## CHƯA kiểm được ở đây (cần máy thật)
- Kết nối thật giữa các điện thoại qua WiFi/hotspot (dò phòng, tường lửa router, router chặn máy thấy nhau).
- Độ mượt khi 6–8 máy thật cùng chơi.

## Giới hạn đã biết
- Chỉ Android.
- Chủ phòng đưa app xuống nền (nghe điện thoại, tắt màn hình) → trận đứng hình với mọi người.
- Khách không tạm dừng được trận.
- Một số WiFi công cộng/quán cà phê chặn các máy thấy nhau → dùng hotspot.
