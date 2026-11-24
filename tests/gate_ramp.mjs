// (5.3) ĐỘ KHÓ TĂNG THẬT THEO ẢI — người chơi máy (không biết phòng thủ, không nâng cấp) đánh cả 10 ải trên đủ 3 bản đồ của từng ải.
//   • ải 1–2 phải thắng hết · ải cuối phải khó hơn hẳn ải đầu (thắng ít hơn, bị máy đánh nhiều hơn)
//   • ải 10 KHÔNG được bất khả thi: có nâng cấp Lò rèn thì bot vẫn thắng được
import { play, rush } from './ramp.mjs';
let pass=0, fail=0; const ok=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); c?pass++:fail++; };
const rows=[]; for(let lv=1;lv<=10;lv++){ const rs=[0,1,2].map(m=>play(lv,(lv-1)*3+m,'rome')); const w=rs.filter(r=>r.win).length, atk=rs.reduce((s,r)=>s+r.aiAtk,0)/3, lost=rs.reduce((s,r)=>s+r.lost,0)/3;
  rows.push({lv,w,atk,lost,rs}); console.log(`ải ${String(lv).padStart(2)}: bot thắng ${w}/3 · máy đánh ta ${Math.round(atk)} lần/ván · ta mất ${Math.round(lost)} cứ điểm/ván · ${rs.map(r=>(r.over?(r.win?'T':'B'):'h')+Math.round(r.t/60)+'p').join(' ')}`); }
const W=(a,b)=>rows.filter(r=>r.lv>=a&&r.lv<=b).reduce((s,r)=>s+r.w,0), A=(a,b)=>{ const q=rows.filter(r=>r.lv>=a&&r.lv<=b); return q.reduce((s,r)=>s+r.atk,0)/q.length; };
ok(W(1,2)===6,'ải 1–2: bot thắng cả 6 ván (ải mở đầu dễ)');
ok(W(1,3)>=W(8,10)+2,`ải 8–10 khó hơn hẳn ải 1–3: bot thắng ${W(8,10)}/9 so với ${W(1,3)}/9`);
ok(W(4,7)>=W(8,10),`độ khó không tụt ở cuối: ải 4–7 thắng ${W(4,7)}/12, ải 8–10 thắng ${W(8,10)}/9`);
ok(A(8,10)>=A(1,2)*3,`boss ải cao chủ động đánh ta nhiều hơn hẳn: ${Math.round(A(8,10))} lần/ván so với ${Math.round(A(1,2))} lần/ván ở ải 1–2`);
ok(rows.every(r=>r.rs.every(q=>q.over||q.t>=2390)),'không ván nào treo (kết thúc hoặc chơi đủ 40 phút)');
const up={weapon:4,armor:4,power:4,speed:3,stamina:3,aura:3}; let wT=0, nT=0, w8=0; for(const lv of [8,9,10]) for(const m of [0,1,2]) for(const c of ['rome','mongol']){ nT++; if(play(lv,(lv-1)*3+m,c,{defend:true,cfg:{up}}).win){ wT++; if(lv===8) w8++; } }
ok(wT>=3&&w8>=2,`ải 8–10 không bất khả thi: bot có nâng cấp Lò rèn + biết bấm 🚑 Cứu trại thắng ${wT}/${nT} ván (riêng ải 8: ${w8}/6)`);
// (5.4) KIỂU "GOM MỘT ĐẠO LỚN ĐI THẲNG VÀO TRẠI ĐỊCH" (người chơi báo: thắng ải 10 không gặp cản trở)
const R1=[0,1,2].map(m=>rush(1,m)), RH=[]; for(const lv of [8,9,10]) for(const m of [0,1,2]) RH.push(rush(lv,(lv-1)*3+m));
console.log('đánh thẳng — ải 1: '+R1.map(r=>(r.win?'T':'B')+Math.round(r.t/60)+'p').join(' ')+' · ải 8–10: '+RH.map(r=>(r.over?(r.win?'T':'B'):'h')+Math.round(r.t/60)+'p').join(' '));
ok(R1.filter(r=>r.win).length>=2,'ải 1: đánh thẳng vào trại vẫn thắng được (ải mở đầu, boss ngây thơ)');
ok(RH.filter(r=>r.win).length<=1,`ải 8–10: đánh thẳng vào trại KHÔNG còn ăn — thắng ${RH.filter(r=>r.win).length}/9 ván`);
ok(RH.filter(r=>r.win&&r.t<300).length===0,'ải 8–10: không ván nào bị "đi thẳng" hạ trong dưới 5 phút');
ok(RH.reduce((s,r)=>s+r.hits,0)/9>=15,`ải 8–10: boss phản đòn khi ta dốc quân đi — trung bình ${Math.round(RH.reduce((s,r)=>s+r.hits,0)/9)} lần xuất quân đánh ta mỗi ván`);
console.log((fail?'✗':'✓')+` ĐỘ KHÓ THEO ẢI: ${pass} đạt, ${fail} lỗi`); process.exit(fail?1:0);
