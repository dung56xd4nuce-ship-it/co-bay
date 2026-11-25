# Loạn Thế Meme v5.7 — Chinh phạt: Bộ lạc → Nội chiến → Đại chiến

## Luồng chơi
- BATTLE → **CONQUEST**: lần đầu chọn nước + mức khó (Easy/Normal/Hard) → vào **Bộ lạc**. Cùng một nước, cùng mức khó tới hết.
- Thắng (thống nhất) → màn kết quả báo "THE TRIBES ARE UNITED! Next: Civil War…" + nút **Begin the Civil War ▶**; thắng Nội chiến → **Great War**; thắng Đại chiến → "CONQUEST COMPLETE".
- Thua → "Retry the <chặng>" (bản đồ mới cùng chặng). Màn CONQUEST hiện 3 chặng: đã thắng (✔ + thời gian) · đang tới (▶ PLAY / CONTINUE) · khoá (🔒); nút "New conquest" (hỏi lại nếu đang có tiến trình).
- Tự lưu mỗi chặng như Quần Hùng (nút "CONTINUE CONQUEST · <chặng>"). Ván Quần Hùng lưu từ bản cũ vẫn có "CONTINUE WARLORDS" và chơi tiếp trên bản đồ cũ 20 000×6 000.

## Ba cấp bản đồ (src/09j_conquest.js · BW_CONQ)
| | Bộ lạc | Nội chiến | Đại chiến |
|---|---|---|---|
| Bản đồ | 9 600×3 400 | 14 000×4 800 | 40 000×12 000 (gấp đôi mỗi chiều) |
| Số phe | 8–12 bộ lạc | 16–20 vùng | đủ 44 nước trong game |
| Quân khởi điểm (hiển thị) | 20–50 | 2 000–5 000 | 10 000–50 000 |
| Loại quân | 1 loại: Tribal Warrior, không khắc chế | binh chủng + dân binh | chỉ binh chủng |
| Lò rèn / quân nhu | tắt | có | có |
| Cứ điểm | ~100 | ~210 | ~1 450 |

- Bộ lạc / Nội chiến: mọi phe cùng nền văn minh của người chơi, mỗi phe tên riêng (Wolf Clan… / Northern March, Red River…) + màu riêng.
- Kinh đô rải ngẫu nhiên kiểu Poisson trong lòng bản đồ (cách mép ≥6% ngang, ≥13% dọc), cách nhau đủ xa.
- Quân khởi điểm chia: kinh đô 45%, 2 đồn mỗi đồn 20%, 1 trang trại 15% (máy cần quân ở đồn để mở rộng).
- Mất kinh đô (trại cuối) = cả phe quy hàng phe chiếm (luật cũ).
- **Dân binh (Militia)**: đồn/làng trung lập ở Nội chiến là dân binh; làng/đồn/thành đã chiếm tự mộ dân binh (BW.militia, có trần); trại + lò luyện sinh binh chủng chính. Dân binh đánh ×0,8, không khắc ai, không ai khắc.
- Nhịp game: quân số bên trong giữ cỡ Quần Hùng, chỉ số HIỂN THỊ nhân BW.dk (Bộ lạc 0,025 · Nội chiến 1 · Đại chiến 5) → sinh quân, lương, thời gian giao tranh như cũ. Hàm bwN() dùng cho mọi chỗ hiện quân số.
- Zoom xa tối thiểu: Đại chiến 0,18.

## Lãnh thổ & biên giới (mọi ván Quần Hùng/Chinh phạt)
- Lưới 110px, mỗi ô thuộc cứ điểm gần nhất trong 560px (trung lập không có đất) → chiếm thành trấn là đất nở ra.
- Đường biên "marching squares" (góc vát, không bậc thang) màu từng phe + dải màu mềm dọc biên; vùng đất tô màu trên bản đồ nhỏ. Biên của ta vẽ sau cùng.
- Hiệu năng: biên gom theo khối 2 400px (chỉ vẽ khối trong khung nhìn); dựng lại khi chủ cứ điểm đổi (1,5 s; bản đồ lớn 3 s), chia nhỏ mỗi khung hình ≤2,5 ms; máy chậm (khung >26 ms) tự chuyển chế độ nhẹ (chỉ nét biên, nhìn toàn cảnh thì chỉ bản đồ nhỏ). Cổng hiệu năng máy yếu (CPU ×4) đạt 38/38 so với bản 5.6.

## Art mới (ChatGPT)
- U12 unit:tribal (chiến binh bộ lạc, rìu đá), U13 unit:militia (dân binh nón lá, chĩa ba).

## Kiểm thử
- test/gate_conq.mjs (Android ngang, iOS ngang, iOS dọc): 129 mục — luồng chọn nước → 3 chặng → chuyển màn, quân số hiển thị, loại quân, tên/màu phe, chạm thật gửi quân, lãnh thổ nở ra, lưu/nạp, ván cũ.
- Cập nhật gate_flows / gate_camp / gate_civ theo luồng Chinh phạt; gate_art có cảnh chiến binh bộ lạc + dân binh.
- Hiệu năng vẽ (Pixel 7 giả lập): Đại chiến zoom 1 trung vị 5,5 ms/khung; zoom xa 1,6 ms. Mô phỏng Đại chiến 0,5 ms/nhịp.
