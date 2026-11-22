// Chơi thử bằng CHẠM THẬT theo tọa độ màn hình (không gọi hàm nội bộ để thao tác), chụp ảnh từng bước
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape', tag=dev.split(' ')[0];
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200);
const T=async(x,y,w=450)=>{ await p.touchscreen.tap(x,y); await p.waitForTimeout(w); };
const el=async(id)=>p.evaluate((id)=>{const r=document.getElementById(id).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];},id);
const shot=async(n)=>p.screenshot({path:`/tmp/hp_${tag}_${n}.png`});
const {width:W,height:H}=p.viewportSize(); const log=[];
// vào Quần Hùng qua menu
await T(...await el('bBW')); await T(...await el('bBossRoyale'),800); await p.waitForTimeout(5000); // cảnh mở đầu
await shot('1_vao_tran');
const L=await p.evaluate(()=>{const bw=__ltm.bw; return {rally:bw._rallyBtn, mini:bw.obar, z:bw._zBtns.map(r=>({x:r.x,y:r.y,w:r.w,h:r.h}))};});
log.push('layout '+JSON.stringify(L));
// chồng lấn: minimap / nút zoom / nút gọi quân / thanh HUD trên
const ov=(a,b)=>a&&b&&a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
const mini={x:L.mini.ox,y:L.mini.oy,w:L.mini.ow,h:L.mini.oh};
log.push('minimap đè nút zoom: '+L.z.some(z=>ov(z,mini))+' | minimap ở nửa trên: '+(mini.y<H/2));
// 1) chạm nút 📣
await T(L.rally.x+L.rally.w/2, L.rally.y+L.rally.h/2); await shot('2_mo_goi_quan');
const rr=await p.evaluate(()=>__ltm.bw._rallyRects);
log.push('bảng gọi quân: '+rr.length+' mục, đè nút zoom: '+rr.some(r=>L.z.some(z=>ov(z,r))));
// chọn tổng động viên
await T(rr[2].x+rr[2].w/2, rr[2].y+rr[2].h/2); await shot('3_cho_chon_diem');
const pick=await p.evaluate(()=>__ltm.bw.rallyPick);
log.push('đang chờ chọn điểm: '+pick);
// chạm điểm giữa màn hình làm điểm tập kết
const before=await p.evaluate(()=>__ltm.bw.armies.filter(a=>a.owner===0&&a.rally).length);
await T(W*0.45,H*0.55,600);
const after=await p.evaluate(()=>__ltm.bw.armies.filter(a=>a.owner===0&&a.rally).length);
log.push(`đạo quân được gọi: ${before} → ${after}`);
await p.waitForTimeout(1500); await shot('4_tong_dong_vien');
// 2) chạm đất trống khi không chọn gì: KHÔNG được bật menu gọi quân nữa
await T(W*0.6,H*0.4); const m=await p.evaluate(()=>!!__ltm.bw.menu);
log.push('chạm đất trống bật menu: '+m);
// 3) chạm minimap để nhảy camera
const c0=await p.evaluate(()=>[__ltm.bw.camX|0,__ltm.bw.camY|0]);
await T(mini.x+mini.w*0.8, mini.y+mini.h*0.7); const c1=await p.evaluate(()=>[__ltm.bw.camX|0,__ltm.bw.camY|0]);
log.push(`chạm minimap: camera ${c0} → ${c1}`); await shot('5_minimap');
// 4) nút ➕ vẫn bấm được
const z0=await p.evaluate(()=>__ltm.bw.zoom); await T(L.z[0].x+L.z[0].w/2,L.z[0].y+L.z[0].h/2,700); const z1=await p.evaluate(()=>__ltm.bw.zoom);
log.push(`nút ➕: zoom ${z0.toFixed(2)} → ${z1.toFixed(2)}`); await shot('6_zoom');
console.log(dev); for(const l of log) console.log(' ',l); console.log('  errors', errs.length?errs:'none');
await b.close();
