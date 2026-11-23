// NÂNG CẤP TỪ BẢN CŨ: người chơi đang có ván Quần Hùng lưu bằng v4.2, cài đè v5 → bấm "CONTINUE" phải chơi tiếp được.
// Ván lưu trong test/fixtures/save_v42.json do CHÍNH bản v4.2 tạo ra (43 đạo quân đang đi, 6 trận đang đánh).
import { launch, open, ok, finish, DEVICES, PORTRAIT } from './lib.mjs';
import fs from 'fs';
const SAVE=fs.readFileSync(new URL('./fixtures/save_v42.json',import.meta.url),'utf8'); const b=await launch();
for(const [dn,dev] of [DEVICES[0],PORTRAIT[1]]){ console.log(dn);
  const T=await open(b,dev); const {p}=T;
  await T.ev((s)=>localStorage.setItem('ltm_royale_save_v1',s),SAVE); await p.reload(); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu')); await p.waitForTimeout(400);
  ok((await T.tapEl('#bBW')).ok,'menu: chạm "Đánh Boss"'); await p.waitForTimeout(250);
  ok(await T.vis('#bBossContinue'),'có nút CONTINUE cho ván lưu của bản cũ');
  const lbl=await T.ev(()=>document.getElementById('bBossContinue').innerText); ok(/nations/.test(lbl)&&/4 min/.test(lbl),'nút ghi đúng ván cũ: '+lbl.replace(/\n/g,' · '));
  const r1=await T.tapEl('#bBossContinue'); ok(r1.ok,'chạm CONTINUE'+(r1.ok?'':' — '+r1.why)); await p.waitForTimeout(900);
  const st=await T.ev(()=>{ const bw=__ltm.bw; if(!bw) return null; const F=bw.localFid||0;
    const camp=bw.nodes.find(n=>n.camp&&n.owner===F)||bw.nodes.find(n=>n.owner===F);
    let wet=0, cut=0, nan=0, stuck=0; const wetL=[];
    for(const n of bw.nodes){ if(![n.x,n.y,n.count].every(Number.isFinite)) nan++; const c=bw.navCell(n.x,n.y); bw.navCost('F'); if(bw.nav.flag[c]===1){ wet++; wetL.push(n.id); } }   /* cờ 1 = nước sâu, không quân nào vào được */
    for(const n of bw.nodes){ if(n===camp) continue; if(!bw.findPath('F',camp.x,camp.y,n.x,n.y).ok) cut++; }
    for(const a of bw.armies){ if(a.done||a.count<=0) continue; if(![a.x,a.y,a.count].every(Number.isFinite)) nan++; }
    return {t:bw.time,nodes:bw.nodes.length,armies:bw.armies.filter(a=>!a.done&&a.count>0).length,battles:bw.battles.length,wet,wetL:wetL.slice(0,6),cut,nan,roads:bw.roads.length,civ:bw.civOf(F).name,mine:bw.nodes.filter(n=>n.owner===F).length,royale:!!bw.royale}; });
  ok(!!st&&st.royale,'vào lại được ván Quần Hùng'); if(!st){ await T.ctx.close(); continue; }
  ok(Math.abs(st.t-240)<3&&st.nodes===394,`đúng ván cũ: phút ${(st.t/60).toFixed(1)}, ${st.nodes} cứ điểm, ${st.armies} đạo quân, ${st.battles} trận đang đánh`);
  ok(st.nan===0,'không có toạ độ/quân số hỏng');
  ok(st.wet===0,`không cứ điểm nào nằm giữa sông sâu của bản đồ mới (${st.wet}${st.wet?': #'+st.wetL.join(', #'):''})`);
  ok(st.cut===0,`bộ binh từ kinh đô đi tới được mọi cứ điểm (${st.cut} nơi bị cô lập)`);
  ok(st.roads>100,`bản đồ mới có mạng đường nối các cứ điểm cũ (${st.roads} đoạn)`);
  ok(st.mine>0&&!!st.civ,`người chơi cũ được gán một nền văn minh: ${st.civ}, còn ${st.mine} cứ điểm`);
  // 1) người chơi cũ quay lại, ra lệnh bằng tay: rút đạo quân đông nhất về giữ kinh đô
  const me=await T.ev(()=>{ const bw=__ltm.bw, F=bw.localFid||0; bw.zoomTgt=bw.zoom=1; const cap=bw.nodes.find(n=>n.camp&&n.owner===F);
    const m=bw.nodes.filter(n=>n.owner===F&&!n.camp&&!n.btl&&n.count>60&&bw.canReach(n,cap.x,cap.y).ok).sort((a,b)=>Math.hypot(a.x-cap.x,a.y-cap.y)-Math.hypot(b.x-cap.x,b.y-cap.y))[0];
    return m? {m:[m.x,m.y,m.id,Math.round(m.count)],tg:[cap.x,cap.y,cap.id,Math.round(cap.count)]} : null; });
  ok(!!me,'ván cũ: còn đạo quân của mình có đường về kinh đô');
  if(me){ const a=await T.aim(me.m[0],me.m[1]); await p.waitForTimeout(200); await T.tap(a[0],a[1]); await p.waitForTimeout(200);
    const sel=await T.ev(()=>__ltm.bw.sel? __ltm.bw.sel.id : null); ok(sel===me.m[2],'chạm vào cứ điểm của mình → chọn được');
    const c=await T.aim(me.tg[0],me.tg[1]); await p.waitForTimeout(200); await T.tap(c[0],c[1]); await p.waitForTimeout(300);
    const menu=await T.ev(()=>{ const m=__ltm.bw.menu; return m? m.opts.map(o=>({id:o.id,s:o.s,x:o.x,y:o.y,w:o.w,h:o.h})) : null; });
    ok(!!menu,'chạm cứ điểm mình rồi chạm kinh đô → hiện menu lệnh'+(menu?': '+menu.map(o=>o.s).join(' / '):''));
    if(menu){ const o=menu.find(o=>/reinf|move|merge|send|garrison|attack/.test(o.id))||menu[0]; if(o.x!=null&&o.w) await T.tap(o.x+o.w/2,o.y+o.h/2); else await T.ev((id)=>__ltm.bw.menuPick(id),o.id); await p.waitForTimeout(300);
      const sent=await T.ev(([mid,cid])=>{ const bw=__ltm.bw, F=bw.localFid||0, cap=bw.nodes[cid], c0=cap.count; const a=bw.armies.filter(a=>!a.done&&a.owner===F&&a.to===cid).slice(-1)[0]; if(!a) return null; const x=a.x,y=a.y, pl=(a.path||[]).length;
        for(let k=0;k<200;k++) bw.update(0.05); const d=Math.hypot(a.x-x,a.y-y), pl2=Math.max(pl,(a.path||[]).length); for(let k=0;k<2400&&!a.done&&!bw.over;k++) bw.update(0.05);
        return {d,pl:pl2,done:!!a.done,gain:Math.round(cap.count-c0),own:cap.owner===F,t:bw.time}; },[me.m[2],me.tg[2]]);
      ok(sent&&sent.d>30,`lệnh "${o.s}" → quân xuất phát, đi theo đường ${sent?sent.pl:0} chặng (${sent?Math.round(sent.d):0} px trong 10 giây đầu)`);
      ok(sent&&sent.done&&sent.own&&sent.gain>0,`quân về tới kinh đô, kinh đô thêm ${sent?sent.gain:0} quân (phút ${sent?(sent.t/60).toFixed(1):'?'})`); } }
  // 2) lưu lại bằng bản mới rồi mở lại lần nữa
  const sv2=await T.ev(()=>{ const bw=__ltm.bw; if(bw.over) return {over:true}; const okS=royaleSave(); const s=localStorage.getItem('ltm_royale_save_v1'); return {okS,len:s?s.length:0,t:bw.time}; });
  ok(!sv2.over,'người chơi còn sống sau khi về giữ kinh đô');
  if(!sv2.over){ ok(sv2.okS&&sv2.len>10000&&sv2.len<1500000,`bản mới lưu lại được ván (${(sv2.len/1024).toFixed(0)} KB)`);
    await p.reload(); await p.waitForFunction(()=>window.__ltm&&document.getElementById('menu')); await p.waitForTimeout(300); await T.tapEl('#bBW'); await p.waitForTimeout(200); await T.tapEl('#bBossContinue'); await p.waitForTimeout(800);
    const t3=await T.ev(()=>__ltm.bw? __ltm.bw.time : -1); ok(Math.abs(t3-sv2.t)<2,`mở lại lần hai vẫn đúng mốc thời gian (${t3.toFixed(0)}s)`); }
  // 3) chạy tiếp 5 phút: các đạo quân đang hành quân của ván cũ phải đi tiếp (không tính quân đang đóng trại/mai phục)
  const run=await T.ev(()=>{ const bw=__ltm.bw; if(!bw||bw.over) return null; const a0=bw.armies.filter(a=>!a.done&&a.count>0&&!a.btl&&!a.camped&&!a.ambush&&(a.to>=0||a.tx!=null||a.hunt)).map(a=>({a,x:a.x,y:a.y}));
    for(let k=0;k<1200&&!bw.over;k++) bw.update(0.05);
    const moved=a0.filter(o=>o.a.done||o.a.btl||o.a.camped||Math.hypot(o.a.x-o.x,o.a.y-o.y)>40).length;
    for(let k=0;k<4800&&!bw.over;k++) bw.update(0.05);
    let nan=0; for(const a of bw.armies) if(![a.x,a.y,a.count].every(Number.isFinite)) nan++; for(const n of bw.nodes) if(![n.x,n.y,n.count].every(Number.isFinite)) nan++;
    return {n0:a0.length,moved,nan,t:bw.time,over:bw.over,nat:new Set(bw.nodes.filter(n=>n.camp&&n.owner!==2).map(n=>n.owner)).size}; });
  if(run){ ok(run.n0===0||run.moved>=run.n0*0.9,`đạo quân đang hành quân đi tiếp được (${run.moved}/${run.n0} đã nhúc nhích sau 1 phút)`);
    ok(run.nan===0,`chạy tiếp tới phút ${(run.t/60).toFixed(1)}: trạng thái lành lặn, còn ${run.nat} nước${run.over?' (ván đã kết thúc)':''}`); }
  ok(T.errs.length===0,'không lỗi JS'+(T.errs.length?': '+T.errs.slice(0,3).join(' | '):''));
  await T.ctx.close(); }
await finish('NÂNG CẤP TỪ v4.2',b);
