# Loạn Thế Meme v5.5 — Hướng dẫn lần đầu, trang trí trại bằng xu, ẩn Art pack

Ngày: 25/11/2026 · Nhánh `loan-the-meme` (repo co-bay) · Bản phát hành `ltm-v5.5`

## Yêu cầu của người chơi
1. Ẩn gói Art pack (người chơi không dùng được).
2. Meme Coin còn ít chỗ tiêu → cho mua gói trang trí đồ hoạ trại cho rực rỡ.
3. Cần chế độ hướng dẫn cho lần đầu vào game: khoá thao tác, bắt làm việc A, B, C…, có ghi chú.

## 1. Ẩn Art pack
Nút "🎨 Art pack" ở menu chính bị ẩn (`display:none`). Màn nạp ảnh và mã vẫn còn trong game để đội làm art dùng khi cần (`showScreen('artscr')`).

## 2. 🏮 Camp decor — `src/09h_decor.js`
Thẻ thứ ba trong Armory (cạnh Supplies và Forge). Mua một lần, giữ mãi, bật/tắt từng món; chỉ để đẹp, không cộng chỉ số.

| Món | Giá | Hình |
|---|---|---|
| War Banners | 60 | 4 cờ đuôi nheo nhiều màu quanh trại, phất theo gió |
| Festival Lanterns | 90 | Dây đèn lồng đỏ phát sáng trên nóc lều |
| Cherry Blossoms | 120 | Hai cây hoa anh đào, cánh hoa bay |
| Golden Palisade | 180 | Vòng cọc vàng lấp lánh trước trại |
| Fireworks | 220 | Pháo hoa nổ trên trại suốt trận |
| Dragon Standard | 260 | Đại kỳ rồng và vòng hào quang |
Tổng 930 xu.

- Vẽ bằng mã (không cần ảnh): `BW.drawDecor(c,x,y,ids,t,layer)` — lớp 0 sau lều, lớp 1 trước lều; chỉ vẽ ở trại của người chơi (`bw.decor`). P2P: máy nào vẽ theo máy đó.
- Màn mua có khung xem trước động; chạm vào món chưa mua để xem thử.
- Lưu: `save.decor = {own:{id:1}, on:[id…]}`.

## 3. 🎓 Hướng dẫn lần đầu — `src/09i_tutorial.js`
- Người chơi mới bấm **BATTLE** lần đầu → vào thẳng một trận tập (ải 1, máy đứng yên). Người chơi cũ (đã qua ải hoặc có ván lưu) không bị bắt học. Chơi lại: **How to play → 🎓 Play the tutorial battle**.
- **Khoá thao tác**: màn hình tối đi, chỉ chỗ cần chạm sáng lên (vòng vàng + bàn tay). Chạm chỗ khác, chạm 📣, 🎒, dòng menu khác đều không có tác dụng (vòng nháy đỏ). Chạm lệch tâm mục tiêu vẫn nhận.
- Khung ghi chú tự né chỗ cần chạm và menu lệnh; có nút **Skip**.
- 9 bước: (1) chọn đồn của mình → (2) chạm đồn trung lập → (3) bấm lệnh trong menu, giới thiệu All · ½ · ¼ → (4) xem quân hành quân, đồn xám quy thuận → (5) chọn đồn mới → (6) chạm đồn đỏ của địch → (7) bấm Attack → (8) xem giao tranh, thắng → (9) tóm tắt mục tiêu (chiếm trại địch, giữ trại mình, 🌾 📣 🚑 🎒) và nút "Got it ▶".
- Học xong lần đầu: thưởng 50 xu, mở màn chiến dịch. Trận tập không lưu ván, không phát xu lẻ. Đánh dấu: `localStorage.ltm_tut='1'` và `save.tut=1`.
- Tự sửa khi người chơi làm hỏng bước (bỏ chọn, đóng menu): quay lại bước trước.

## 4. ⏱️ Nhịp giao tranh (yêu cầu 25/11 14:57)
"Thời gian giao tranh kéo dài khi tấn công trại hoặc thành trấn; ở nơi khác, nếu không phải mai phục, thời gian rút ngắn theo mức chênh lệch quân số."

Trước đây: mọi trận chênh lệch đều mất ~23 giây (10 000 đánh 1 000 cũng như 2 000 đánh 1 000) vì giới hạn "mỗi giây mất tối đa 1/3 quân" làm bên thua tan theo cấp số nhân.

Nay `startBattle` gắn `b.kind`:
- **siege** — đánh vào trại (đại bản doanh) hoặc thành trấn (`n.struct`: village / fort / citadel). Quân thủ hao **đều** trong T giây: `T = min(20·L / (1+0.12·(r−1), tối đa 1,6), 3 + 1,2·√(quân bên ít))`, L = trại 2,5 · thành trì 2,2 · thành lũy 1,9 · làng trấn 1,6; r = tỉ lệ sức lúc mở trận. Cường độ đánh nhân 6/T nên **tổng thương vong của bên công giữ như cũ** (2 000 đánh trại 1 000: còn 1 611, trước 1 600).
- **ambush** — phục kích: giữ nhịp cũ.
- **field** — mọi chỗ khác (ngoài đồng, đồn thường, đồn trung lập): bên yếu tan trong `Tm = max(2,5; min(14; 14 / r^1,3))` giây tính theo quân lúc mở trận; r tính liên tục nên càng thua càng tan nhanh.
- Viện binh nhập trận cộng vào quân lúc mở trận của phe đó.
- Trên trận hiện "🏰 Siege — a long battle" hoặc "⚡ ×N outnumbered — quick rout" (khi gấp ≥2).

| Trận (thời gian) | 5.4 | 5.5 |
|---|---|---|
| Ngoài đồng 1 000 vs 1 000 | 28 s | 22 s |
| Ngoài đồng 2 000 vs 1 000 | 23 s | 4,4 s |
| Ngoài đồng 4 000 vs 1 000 | 23 s | 2,5 s |
| Phục kích 2 000 vs 1 000 | 23 s | 23 s |
| Làng trấn 2 000 vs 1 000 | 23 s | 28 s |
| Thành trì 2 000 vs 1 000 | 23 s | 39 s |
| Đại bản doanh 2 000 vs 1 000 | 23 s | ~44 s |
| Đại bản doanh 8 000 vs 1 000 | 23 s | ~30 s |

Đo lại độ khó: bot đánh thẳng vào trại thua 0/9 ở ải 8–10 (phải tăng hệ số trại từ 2,2 lên 2,5 để viện binh boss kịp về); ải 1–2 vẫn thắng hết.

## Kiểm thử
`test/gate_tut.mjs` (chạm thật, Android ngang, iOS ngang, iOS dọc, Android nhỏ 640×360): đi hết 9 bước, thử các thao tác bị khoá, Skip, chơi lại; mua/bật/tắt trang trí, xem trước, vẽ trong trận, còn sau khi tải lại. Thư viện bài thử mặc định đánh dấu "đã học" để các nhóm khác không bị trận tập chặn.

## Còn lại
- Nhờ ChatGPT vẽ nốt art (logo tiếng Anh, băng VICTORY/DEFEAT, công trình…) — chưa làm.
- Đạo quân hỗn hợp (phương án C).
