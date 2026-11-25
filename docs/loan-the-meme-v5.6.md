# Loạn Thế Meme v5.6 — Art ChatGPT vẽ nốt + 29 món trang trí trại

Ngày: 25/11/2026 · Nhánh `loan-the-meme` (repo co-bay) · Bản phát hành `ltm-v5.6`

## Yêu cầu
"Giao cho ChatGPT vẽ nốt art đi. Và tôi muốn có nhiều hơn nữa những món đồ trang trí."

## Cách làm với ChatGPT
Claude điều khiển ChatGPT trong Chrome của người chơi (một cuộc trò chuyện "Create Game Sprite Sheet"), tải bảng phong cách S00 làm ảnh mẫu, rồi gửi 5 lệnh vẽ. Mỗi ảnh xong được hiện lên toàn màn hình nền trắng ngay trong trang ChatGPT và chụp lại theo từng nửa / từng ô ở độ phân giải đầy đủ (không tải tệp về máy người chơi), ghép lại, xoá nền trắng (`crop.py`), cắt từng món, đưa vào game dạng WebP nhúng (`inline_art.py` — mới).

| Tấm | Nội dung | Mã |
|---|---|---|
| 1 | xe bò lương, kho lương, trại nuôi, sân tập, tù và chiêu mộ, ba lô, cờ trắng, cổng lễ hội | P09 P10 P11 P12 G18 G23 G13 DGATE |
| 2 | bonsai, sư tử đá, ao cá Koi, mèo thần tài, tháp trống, tượng Meme Coin, tượng voi vàng, tượng rồng ngọc | DBONSAI DLIONS DKOI DCAT DDRUM DCOIN DELEPH DDRAGON |
| 3 | logo tiếng Anh "LOAN THE MEME!" | G01E |
| 4 | băng VICTORY! / DEFEAT tiếng Anh | G19E G20E |
| 5 | đèn đá, miếu chuông, rương báu, chùa 3 mái, phượng hoàng vàng, chòi canh, thùng rượu, tượng chiến binh | DLAMP DSHRINE DCHEST DPAGODA DPHOENIX DTOWER DBARREL DWARRIOR |

Đã gỡ logo/băng chữ Việt cũ khỏi bản nhúng.

## Art mới dùng ở đâu
- Logo menu: ảnh "LOAN THE MEME!" (trước là chữ HTML).
- Màn kết quả: băng VICTORY! / DEFEAT.
- Trại nuôi, kho lương, sân tập trên bản đồ: vẽ công trình thật (mờ khi trong sương).
- Đội vận lương: xe bò chở bao gạo thay hình vẽ bằng mã.
- Nút 🎒 trong trận: ảnh ba lô. Nâng cấp Recruiting: tù và. Cờ trắng: ảnh mới.

## Trang trí trại: 6 → 29 món
- Vẽ bằng mã (12): War Banners 60, Party Bunting 50, Torch Ring 70, Flower Garden 80, Festival Lanterns 90, War Bonfire 110, Cherry Blossoms 120, Victory Confetti 150, Golden Palisade 180, Lucky Rainbow 200, Fireworks 220, Dragon Standard 260.
- Ảnh ChatGPT (17): Rice Wine Barrels 75, Bonsai Pots 90, Stone Lanterns 100, Festival Gate 130, Stone Guardian Lions 140, Watch Tower 150, Koi Pond 160, Lucky Cat 170, Warrior Statues 190, Little Shrine 200, War Drum Tower 210, Treasure Hoard 230, Meme Coin Statue 240, War Elephant Statue 280, Golden Phoenix 300, Jade Dragon Statue 320, Grand Pagoda 360.
- Tổng ~4 935 xu. Cửa hàng xếp từ rẻ tới đắt, thẻ món ảnh hiện đúng ảnh món đó.
- Mỗi món ảnh có chỗ đặt riêng quanh lều (`BW.DECOR_SLOT`: trước/sau lều, đôi đối xứng); trại sát mép bản đồ thì món bị tràn được dời vào phía trong.
- Món ảnh chỉ bán khi ảnh đã nạp (`BW.decorAvail`).

## Kiểm thử
Luật 350 tình huống (thêm 5 cho trang trí). `gate_tut.mjs` cập nhật: cửa hàng ≥21 món, xếp theo giá, thẻ có ảnh, món ảnh được vẽ quanh trại. Soát bằng mắt: menu dọc/ngang, màn kết quả, công trình, xe lương, hai trại trang trí dày.

## Còn lại
- Nền đá / nền cát (T11, T12) chưa vẽ — bản đồ hiện dùng màu đất theo kiểu địa hình nên chưa cần gấp.
- Đạo quân hỗn hợp (phương án C).
