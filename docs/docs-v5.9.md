# Loạn Thế Meme v5.9 — Sau phá đảo (Gói A): ★ Thăng Thiên · ∞ Ải vô tận · 📜 Sử ký 44 nước

## ★ Thăng Thiên (Chinh phạt) — src/09l_endgame.js · BW_ASC
- Mở sau lần đầu thắng Đại chiến. Thẻ "★N Ascension" đứng đầu màn Chinh phạt; chạm → chọn nước (bất kỳ) + mức khó → một cuộc Chinh phạt MỚI (Bộ lạc → Nội chiến → Đại chiến) ở ★N.
- Thắng Đại chiến ở ★N → mở ★N+1 (tối đa ★10). Luật bất lợi CỘNG DỒN:
  ★1 đối thủ +15% quân khởi điểm · ★2 đồn trung lập +30% · ★3 tầm nhìn −18% · ★4 đối thủ sinh quân +15% · ★5 máy ra quyết định nhanh hơn (×0,8) · ★6 cứ điểm đối thủ +15% phòng thủ · ★7 trại/trang trại của ta −15% · ★8 đối thủ +15% quân nữa · ★9 sinh quân +15% nữa · ★10 phòng thủ +15% nữa, tầm nhìn −10% nữa.
- Thưởng: xu trong trận và cuối trận ×(1+25%×N) (★1 ×1,25 … ★10 ×3,5); lá cờ Thăng Thiên ở trại (đồ trang trí không bán, tự có từ ★1; ghi ★ cao nhất; đồng ★1–3, bạc ★4–6, vàng ★7–9, cầu vồng ★10).
- Băng giới thiệu, thanh trên cùng, nút CONTINUE đều ghi ★N.

## ∞ Ải vô tận (Đánh Boss 1v1)
- Mở sau khi phá ải 10: thẻ "∞ Endless 11" cuối danh sách chiến dịch (sau đó 12, 13, …), kèm sức boss và luật đặc biệt.
- Gốc là ải 10; quân + nhịp sinh + trại của boss tăng 7%/ải. Bản đồ bốc theo số ải.
- Luật đặc biệt (BW_MUT, cố định theo số ải): ải 11–14 một luật, từ ải 15 hai luật — 🌫️ Thick Fog (tầm nhìn −35%) · 💰 Rich Boss (sinh quân +30%) · 🧱 Stone Walls (phòng thủ +30%) · 🐜 Swarm (+25% quân khởi điểm) · 🥀 Thin Ranks (ta sinh quân −20%) · ⚡ Blitz (boss nghĩ/đánh nhanh ×0,7) · 🏕️ Wild Lands (đồn trung lập +40%).
- Thắng → ghi kỷ lục (save.camp.endless), nút "∞ Endless N+1 ▶"; thua → báo kỷ lục cao nhất. Có lưu giữa trận ("▶ CONTINUE ∞ ENDLESS N"). Xu cuối trận tính theo số ải.

## 📜 Sử ký 44 nước
- Nút "📜 Chronicle n/44" ở màn Chinh phạt. Thắng Đại chiến với một nước → nước đó vào Sử ký (ghi ★ cao nhất, thời gian tốt nhất).
- Nước mới +40 xu; mốc 10 / 22 / 44 nước thêm +100 / +200 / +500 xu.
- Màn chọn nước hiện 👑 cạnh nước đã thống nhất. Người đã phá đảo ở bản cũ: nước đó được ghi vào Sử ký (không thưởng xu) và mở ★1.

## Sửa kèm
- Menu chính dựng lại an toàn khi thứ tự nạp mã (lỗi này có thể làm hỏng cả game khi có ván ∞ đang lưu — đã chặn).
- Danh sách thẻ chặng/ải không còn bị bóp chữ tràn khung.

## Kiểm thử
- test/gate_endgame.mjs (Android ngang, iOS ngang, iOS dọc): 105 mục — mở khoá đúng lúc, chạm thật qua chọn nước, 7 luật ∞ đều có hiệu lực, ải sau mạnh hơn ải trước, lưu/CONTINUE, thắng/thua, Sử ký + mốc thưởng, ★1 khó hơn bản thường trên cùng bản đồ, xu ×1,25, cờ ★ vẽ ở trại, cửa hàng trang trí.
