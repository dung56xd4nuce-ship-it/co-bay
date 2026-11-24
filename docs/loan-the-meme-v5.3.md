# Loạn Thế Meme v5.3 — Chiến dịch 10 ải, boss khôn hơn, 30 bản đồ, mức khó Quần Hùng

Ngày: 24/11/2026 · Nhánh `loan-the-meme` (repo co-bay) · Bản phát hành `ltm-v5.3`

## Vì sao có bản này (ý kiến người chơi)
1. "Đánh boss 1 vs 1 cũng phải có chế độ lưu tiến trình giai đoạn từ 1 đến 10" · "không thấy có việc chuyển màn hay tăng độ khó".
2. "Số lượng map vẫn còn quá ít".
3. "Mức khó nhất mới chỉ tăng số quân của boss chứ chưa thấy boss thông minh hơn".
4. "Chế độ đại chiến (Quần Hùng) cũng cần chia ra các mức độ khó".

## Chẩn đoán (đo bằng máy tự chơi, bản 5.2)
- Tiến trình có lưu (`bwMax`) nhưng **không hiện ở đâu**; vào ải/qua ải không có báo hiệu.
- Ải 10 boss có 162 000 quân (ải 1: 8 400) nhưng bot vẫn thắng trong 9–12 phút, **trại ta bị đánh 0 lần trong cả 20 ván**. Nguyên nhân: máy có "vùng cấm đánh" 28–30% bản đồ phía ta; xuất quân là bỏ trống cứ điểm; tự đánh giá mình mạnh gấp 1,8 lần nên lao vào thua; quân vượt sức nuôi tự tan rã; tối đa 3 đạo quân.
- 20 "bản đồ" chỉ khác hạt giống — cùng màu đất, cùng kiểu bố cục.

## Đã làm
### 1. Màn chiến dịch 10 ải (1v1)
- Màn **Campaign**: 10 thẻ ải — ✔ đã qua (kèm kỷ lục thời gian) · ▶ đang tới · 🔒 còn khoá; mỗi thẻ ghi vùng đất, bậc khôn của boss (🧠 1–4), quân boss, chiến thuật đặc trưng. Thanh tiến trình "Cleared N/10".
- Nút chế độ ghi "Stage N of 10 · M cleared".
- Vào trận có **băng giới thiệu** "STAGE N / 10 · tên ải · vùng đất · boss"; thanh trên ghi "Stage N/10".
- Màn kết quả: "✔ STAGE N / 10 CLEARED", "🔓 Stage N+1 unlocked: tên", "⏱️ New best time!", nút "Next: Stage N+1 ▶"; qua ải 10: "CAMPAIGN COMPLETE".
- **Lưu ván 1v1 đang đánh dở** (15 giây/lần, khi ẩn app, khi về menu) vào `ltm_solo_save_v1`; nút "▶ CONTINUE STAGE N". Hết trận thì xoá. Chọn ải khác khi còn ván dở: hỏi lại.
- `save.camp.best[lv]` = kỷ lục thời gian (giây).

### 2. Boss khôn dần theo ải — `src/09f_brain.js`, `BW.brain(lv, royale, diff)`
| Bậc | Ải | Biết làm gì |
|---|---|---|
| 🧠 | 1–2 | Ngây thơ: dốc sạch quân, không đụng hậu phương ta |
| 🧠🧠 | 3–4 | Phục kích trên đường ta đi; trại điều quân dư ra tiền tuyến |
| 🧠🧠🧠 | 5–7 | Để quân giữ nhà; kéo nhiều cánh (cả từ trại) về cứu điểm bị đánh; đánh thẳng nông trại/kho lương của ta |
| 🧠🧠🧠🧠 | 8–10 | Chặn đánh đạo quân ta giữa đường; rút bỏ đồn không giữ nổi; tổng tấn công HAI MŨI |

Tham số theo ải: `safe` (vùng an toàn của ta 30% → 4%), `raidCd` (nghỉ giữa hai lần quấy rối 90 s → 18 s), `fly` (3 → 6 đạo quân), `budget` (1 → 3 lệnh/lượt), `keep` (0 → 30% quân giữ nhà), `over` (máy ước lượng đúng sức mình, hết liều), `pw` (sức đánh thật ×0,9 → ×1,12), `force` (quân khởi điểm: ải 10 chỉ còn 7,5% công thức cũ → ~15 700 quân thay vì 162 000).
4 phút đầu máy chưa đụng đại bản doanh của ta.

Đo lại (bot không biết phòng thủ, không nâng cấp, 3 bản đồ/ải): thắng 3·3·3·3·2·2·3·2·0·2 trên 3; số lần máy chủ động đánh ta 4 → 93 lần/ván; có nâng cấp Lò rèn thì ải 10 vẫn thắng được.

### 3. 30 bản đồ 1v1, 10 kiểu địa hình
`BW_BIOMES`: Grassland, River Land, Deep Forest, Autumn Hills, Marshland, Desert (không sông), Red Canyon, Snowfield, Highlands, Ashlands (không sông). Mỗi kiểu đổi màu đất, mật độ núi/rừng/sa mạc/thung lũng, độ uốn của sông. Mỗi ải có 3 bản đồ riêng cùng một kiểu (`(lv-1)*3 + 0..2`). Quần Hùng: 20 bản đồ cũng mang kiểu địa hình (ván lưu cũ giữ địa hình cũ nhờ cờ `cfg.bio`).

### 4. Quần Hùng 3 mức khó (chọn ở màn chọn nước, nhớ lần chọn trước)
| | Easy | Normal (như 5.2) | Hard |
|---|---|---|---|
| Quân khởi điểm của ta | ×1,35 | ×1 | ×0,9 |
| Máy tăng quân / nhịp ra lệnh | ×0,72 / chậm 40% | ×1 | ×1,3 / nhanh 25% |
| Đạo quân mỗi nước | 2 | 3 | 5 (2 lệnh/lượt, giữ 20% quân thủ nhà) |
| Thái độ với ta | né ta | bình thường | hùa đánh ta (sau phút 5) |
| Ân hạn đầu ván | 7 phút | 5 phút | 4 phút |
Mức khó nằm trong ván lưu; nút CONTINUE ghi mức.

## Kiểm thử
- Luật: 309 tình huống (thêm 19 cho 5.3). `test/gate_camp.mjs`: hành trình người chơi trên Android ngang, iOS ngang, iOS dọc, Android nhỏ 640×360. `test/gate_ramp.mjs`: bot đánh 30 ván + 6 ván có nâng cấp.
- Công cụ soát bằng mắt: `test/_camp.mjs`, `test/_bio.mjs`, `test/_land.mjs`.

## Còn lại
- Nhờ ChatGPT vẽ nốt art (logo tiếng Anh, băng VICTORY/DEFEAT, xe lương, kho lương, trại nuôi, sân tập, nền đá/cát, biểu tượng) — chưa làm.
- Mục tiêu Trống ở Quần Hùng, Tướng theo quân, quân hỗn hợp.
