# Loạn Thế Meme v6.0 — Gói B + C: 🎖️ Tướng lĩnh · 📅 Thử thách ngày/tuần · 🏆 Thành tựu & danh hiệu

## 🎖️ Tướng lĩnh (src/09m_generals.js · Kho → thẻ "Generals")
| Tướng | Tài năng | Cấp 1 → 5 | Giá |
|---|---|---|---|
| ⚔️ Lü Bu the Vanguard | quân ta đánh mạnh hơn | +5% → +13% | 250 |
| 🛡️ Iron Warden Kanetsugu | cứ điểm ta thủ vững hơn | +8% → +20% | 220 |
| 🐎 Subutai the Swift | hành quân nhanh hơn | +6% → +14% | 200 |
| 🏹 Hawkeye Ranger | nhìn xa hơn qua sương mù | +15% → +35% | 180 |
| 🌲 Woodland Guide Aranya | bộ binh qua rừng (cấp 3+: cả núi) không chậm | — | 240 |
| 💉 Hua Tuo the Healer | thắng trận: cứu lại một phần quân đã mất ở trận đó | 10% → 26% | 260 |
| 📣 Recruiter Ma Yuan | trại/trang trại sinh quân nhanh hơn | +8% → +20% | 230 |
| 💰 Treasurer Croesus | thêm Meme Coin | +15% → +35% | 300 |
- Mang 1 tướng; mở ô thứ 2 giá 400 xu. Kinh nghiệm: thắng +3, thua +1; lên cấp ở 5 / 12 / 22 / 35 XP; màn kết quả báo lên cấp.
- Có hiệu lực mọi chế độ trừ P2P và trận hướng dẫn. Đầu trận có dòng báo tướng đi cùng.
- Chân dung vẽ bằng mã (tướng chibi + màu riêng + biểu tượng tài năng) vì Claude in Chrome chưa kết nối để nhờ ChatGPT vẽ — có thể thay ảnh sau.

## 📅 Thử thách ngày / tuần (src/09n_meta.js · BATTLE → "Daily & weekly challenges")
- Ngày: 1v1 với boss ải 3–8, bản đồ + nước + 1 luật đặc biệt cố định theo ngày; mục tiêu thắng trong 12 phút. Đạt lần đầu trong ngày +15 xu; chuỗi ngày liên tiếp +5 xu/ngày (tối đa +25).
- Tuần: bản đồ Bộ lạc 9–12 bộ lạc, 2 luật đặc biệt, thắng trong 20 phút → +60 xu.
- Sinh từ ngày tháng trên máy (không cần mạng). Chơi lại bao nhiêu lần cũng được; ghi thời gian tốt nhất. Trận thử thách không tự lưu và không đụng tiến trình chiến dịch / chinh phạt hay ván đang lưu.

## 🏆 Thành tựu & danh hiệu (menu chính → "🏆 Achievements")
- 40 thành tựu chia 6 nhóm: Chiến dịch (6), Chinh phạt (9), Chiến trận (11), Thử thách (6), Tướng lĩnh (4), Kho (4); mỗi mục thưởng 10–200 xu.
- 10 danh hiệu: War Sage, Endless One, Conqueror, Ascended, Emperor of All, Warlord, Shadow, Lightning, Ever-Ready, Lord of Heroes — chọn ở màn Thành tựu, hiện dưới logo màn chính và cuối màn kết quả.
- Thống kê trọn đời (save.lt): trận đã chơi/thắng, trận nhỏ thắng, phục kích thắng, trại đã hạ, quân quy hàng, quân đỉnh, xu kiếm được.
- Người chơi cũ: thành tựu đã đạt được trao luôn khi mở game (có báo).

## Sửa kèm
- Thông báo dạng {text,kind} trước đây hiện "[object Object]" — đã sửa.
- Hàng thẻ Kho tự xuống dòng trên màn hẹp; "Camp decor" → "Decor".

## Kiểm thử
- test/gate_meta.mjs (Android ngang, iOS ngang, iOS dọc): 111 mục.
