# Loạn Thế Meme v5.4 — Tách binh chủng, cứu trại, bỏ chỗ cấm rừng núi, chống "đánh thẳng vào trại"

Ngày: 24/11/2026 · Nhánh `loan-the-meme` (repo co-bay) · Bản phát hành `ltm-v5.4`

## Ý kiến người chơi dẫn tới bản này
1. Cần "cứu trại" trong hiệu lệnh (cạnh 5 trại / 10 trại).
2. Hiệu lệnh phải ưu tiên bấm vào trại / điểm tập kết ("ấn kiểu gì cũng ra ngoài map, không vào được mục tiêu").
3. Lăn tăn việc tách binh chủng; rừng núi "chỗ đi được, chỗ không" là không hợp lý, không khớp yêu cầu gốc. Người chơi chọn phương án **A + B**.
4. Chơi thử 5.3: "boss cấp 10 vẫn rất kém, cho 1 đạo lính lớn đi thẳng đến trại địch đánh thắng mà không gặp cản trở".

## 1. Tách quân (A) và cứ điểm nhiều binh chủng (B) — `src/09g_mix.js`
- **Cứ điểm là kho quân**: giữ được nhiều binh chủng. `n.mix` = tỉ lệ từng loại (kèm `n.mixO` = chủ lúc ghi); `n.type` = loại đông nhất, dùng khi thủ thành. Sinh quân và thương vong chia đều theo tỉ lệ, nên mọi luật cũ dùng `n.count`/`n.type` không đổi.
- **Đạo quân ngoài đồng vẫn một binh chủng** (một biểu tượng, một con số): trận đánh và bảng khắc chế giữ nguyên.
- Nhập quân vào đồn của mình: loại nào giữ loại nấy (trước đây đổi hết sang loại đông hơn). Điểm luyện binh vẫn đổi cả kho sang binh chủng của nó.
- `send(from,to,opt)`: `opt.type` chỉ loại đó đi · `opt.frac` (½, ¼) đi một phần; không có `opt` = cả kho, mỗi binh chủng một đạo đi cùng nhau. `this._lastSent` = các đạo vừa tạo. Tách dưới 20 lính thì không cho.
- **Menu lệnh** (khi ra lệnh từ một đồn của ta): hàng ô **binh chủng** (chỉ khi kho có ≥2 loại: All types · 🛡 900 · 🐎 300) và hàng **lượng** (All · ½ · ¼) + "→ số lính sẽ đi". Chạm ô không đóng menu.
- Thẻ thông tin đồn ghi rõ kho: "1200 troops: 🛡 900 · 🐎 300".
- P2P: khách gửi kèm lựa chọn trong lệnh `menu`; ảnh chụp trạng thái có thêm tỉ lệ kho. Lưu/mở ván giữ nguyên kho.

## 2. Hiệu lệnh
- **Bắt dính** (`rallySnap`): chạm gần trại / cứ điểm / đạo quân đang đóng (bán kính ~64px màn hình, tối thiểu 150 đơn vị bản đồ) thì lấy đúng chỗ đó làm đích: quân kéo **vào trong** đồn (hoặc nhập vào đạo quân đó), không đứng ngoài bãi. Chạm giữa đồng trống vẫn tập kết đúng điểm chạm.
- **🚑 Rescue a camp under attack** (dòng mới trong bảng 📣): 5 trại gần nhất chạy thẳng vào trại/đồn của ta đang nguy nhất quanh điểm chạm (đang bị đánh, bị vây, hoặc có địch kéo tới); chạm không cần trúng. Không trại nào nguy thì báo rõ.

## 3. Địa hình: không còn chỗ cấm trên đất liền
- Kỵ binh: rừng ×0,42, núi ×0,30 (trước là cấm). Đại quân ≥2000 không còn bị cấm, chỉ chậm theo quân số như cũ.
- Bộ binh: rừng ×0,58, núi ×0,42. Sát thủ: rừng ×0,95, núi ×0,65.
- Nước sâu vẫn chỉ qua ở bến (yêu cầu v2.1 giữ nguyên).

## 4. Chống "gom một đạo lớn đi thẳng vào trại"
Dựng máy thử `rush()` (trong `test/ramp.mjs`): gom hết quân, ăn đồn trung lập cho đông, đủ gấp 2,2 lần quân trại địch thì kéo thẳng vào trại. Trên bản 5.3 nó thắng ải 10 trong 1–3 phút — đúng như người chơi báo.

Nguyên nhân: (a) trại boss ải 10 chỉ có ~3 800 quân; (b) boss không phản ứng khi đạo lớn tới; (c) ăn đồn trung lập quá nhanh (3 600 → 13 500 quân trong 54 giây); (d) tổng quân boss (~15 000) ít hơn thứ người chơi gom được trong 2 phút.

Đã sửa:
- **🚨 Báo động** (`aiAlarm`, ải 3+): đạo quân lớn của ta nhắm vào trại → mọi đồn trong tầm dồn quân về trại ngay, không bị giới hạn số lệnh mỗi lượt; ải 5+ cả các đạo đang đóng ngoài đồng cũng quay về.
- **🗡️ Đánh úp** (`aiSnipe`, ải 8+): ta dốc đại quân sang nửa bản đồ bên kia mà bỏ trống đại bản doanh → boss lấy trại ta ngay (là nước ưu tiên số một). Ta ở nhà thì 4 phút đầu vẫn an toàn.
- **Trại boss** khai trận đủ quân (`BW.CAMP_F`): ải 10 là 8 400.
- **Quân trung lập khó dụ hơn ở ải cao** (`defK`, `defG`): ải 10 phải đông gấp 2,5 lần mới quy thuận và chỉ 60% theo ta; không đủ thì phải đánh. Ải 1–2 như cũ.
- **Quân đồn của boss** tăng lại vừa phải (`BW.FORCE`): ải 10 ~31 000 quân (5.3: 15 700; 5.2: 162 000).

Đo lại (3 bản đồ mỗi ải):
| | Ải 1 | Ải 8–10 |
|---|---|---|
| Đánh thẳng vào trại | thắng 3/3 | thắng 0/9, không ván nào hạ boss dưới 5 phút |
| Chiếm dần, không phòng thủ, không nâng cấp | thắng 3/3 | thắng 2/9 |
| Chiếm dần + nâng cấp Lò rèn + biết bấm Cứu trại | — | thắng 11/18 |

## Kiểm thử
- Luật: 338 tình huống. `test/gate_mix.mjs` (chạm thật trên Android ngang, iOS ngang, iOS dọc, Android nhỏ): chọn binh chủng, ½, ¼, bắt dính, cứu trại. `test/gate_ramp.mjs`: 60 ván bot, gồm kiểu đánh thẳng.

## Còn lại
- Nhờ ChatGPT vẽ nốt art — chưa làm.
- Đạo quân hỗn hợp (phương án C) — để sau khi A + B chơi ổn.
