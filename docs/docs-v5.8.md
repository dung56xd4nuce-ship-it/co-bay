# Loạn Thế Meme v5.8 — Xu thưởng còn 15% · Bảng thống kê quân số

## 🪙 Meme Coin còn ~15% mức cũ (COIN_K=0.15, hàm coinK() trong src/01_config.js)
| Nguồn | Trước | Nay |
|---|---|---|
| Hạ trại địch (Quần Hùng/Chinh phạt, trả ngay) | 15 | 2 |
| Hạ kinh đô | 20 | 3 |
| Diệt cả một nước/phe | 40 | 6 |
| Giữ nước thêm 10 phút | 15 | 2 |
| Kết thúc trận (1v1 / Quần Hùng / Chinh phạt) | eat/40 + 4×thắng + (thắng 30+18×ải, thua 8) | ×0,15 (tối thiểu 1) — VD thắng ải 1: 168 → 25 |
| Chế độ Trống trận | công thức cũ | ×0,15 |
| Học xong hướng dẫn | 50 | 8 |
Giá Lò rèn / quân nhu / đồ trang trí giữ nguyên → xu quý hơn ~6,7 lần.

## 📈 Bảng thống kê quân số (src/09k_stats.js)
- Góc phải dưới trong mọi trận Đánh Boss / Quần Hùng / Chinh phạt / P2P.
- Hàng 1: "👥 YOUR TROOPS" + chênh lệch so với ~1 phút trước (▲ xanh / ▼ đỏ). Hàng 2: tổng quân của ta (đồn + đạo quân, theo cấp hiển thị Bộ lạc/Nội chiến/Đại chiến) + biểu đồ cả trận.
- Số cập nhật mỗi khung hình; biểu đồ lấy mẫu theo giờ trận mỗi 5 s, quá 240 mẫu thì gộp đôi (luôn phủ trọn trận). Trục dọc theo khoảng dao động để thấy rõ lên/xuống.
- Lưu cùng ván (CONTINUE nối tiếp biểu đồ).
- Tự ẩn khi đang mở menu lệnh / gọi quân / quân nhu, khi có dòng hướng dẫn đầu trận, và trong trận hướng dẫn. Màn thấp: lùi sang trái nếu đụng nút −.

## Kiểm thử
- test/gate_stat.mjs (Android/iOS ngang + dọc): 64 mục — vị trí, không đè HUD, số đúng & cập nhật liền, ẩn khi mở menu, gộp mẫu trận dài, lưu/mở lại, xu 1v1 & xu giữa trận.
- Cập nhật gate_tut (8 xu), gate_gear (+6 xu diệt một nước).
