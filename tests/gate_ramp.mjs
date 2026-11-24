// (5.3) ĐỘ KHÓ TĂNG THẬT THEO ẢI — người chơi máy (không biết phòng thủ, không nâng cấp) đánh cả 10 ải trên đủ 3 bản đồ của từng ải.
//   • ải 1–2 phải thắng hết · ải cuối phải khó hơn hẳn ải đầu (thắng ít hơn, bị máy đánh nhiều hơn)
//   • ải 10 KHÔNG được bất khả thi: có nâng cấp Lò rèn thì bot vẫn thắng được
import { play } from './ramp.mjs';
let pass=0, fail=0; const ok=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); c?pass++:fail++; };
const rows=[]; for(let lv=1;lv<=10;lv++){ const rs=[0,1,2].map(m=>play(lv,(lv-1)*3+m,'rome')); const w=rs.filter(r=>r.win).length, atk=rs.reduce((s,r)=>s+r.aiAtk,0)/3, lost=rs.reduce((s,r)=>s+r.lost,0)/3;
  rows.push({lv,w,atk,lost,rs}); console.log(`ải ${String(lv).padStart(2)}: bot thắng ${w}/3 · máy đánh ta ${Math.round(atk)} lần/ván · ta mất ${Math.round(lost)} cứ điểm/ván · ${rs.map(r=>(r.over?(r.win?'T':'B'):'h')+Math.round(r.t/60)+'p').join(' ')}`); }
const W=(a,b)=>rows.filter(r=>r.lv>=a&&r.lv<=b).reduce((s,r)=>s+r.w,0), A=(a,b)=>{ const q=rows.filter(r=>r.lv>=a&&r.lv<=b); return q.reduce((s,r)=>s+r.atk,0)/q.length; };
ok(W(1,2)===6,'ải 1–2: bot thắng cả 6 ván (ải mở đầu dễ)');
ok(W(1,3)>=W(8,10)+2,`ải 8–10 khó hơn hẳn ải 1–3: bot thắng ${W(8,10)}/9 so với ${W(1,3)}/9`);
ok(W(4,7)>=W(8,10),`độ khó không tụt ở cuối: ải 4–7 thắng ${W(4,7)}/12, ải 8–10 thắng ${W(8,10)}/9`);
ok(A(8,10)>=A(1,2)*3,`boss ải cao chủ động đánh ta nhiều hơn hẳn: ${Math.round(A(8,10))} lần/ván so với ${Math.round(A(1,2))} lần/ván ở ải 1–2`);
ok(rows.every(r=>r.rs.every(q=>q.over||q.t>=2390)),'không ván nào treo (kết thúc hoặc chơi đủ 40 phút)');
const up={weapon:4,armor:4,power:4,speed:3,stamina:3,aura:3}; let w10=0, n10=0; for(const m of [27,28,29]) for(const c of ['rome','mongol']){ n10++; if(play(10,m,c,{cfg:{up}}).win) w10++; }
ok(w10>=1,`ải 10 không bất khả thi: có nâng cấp Lò rèn, bot thắng ${w10}/${n10} ván`);
console.log((fail?'✗':'✓')+` ĐỘ KHÓ THEO ẢI: ${pass} đạt, ${fail} lỗi`); process.exit(fail?1:0);
