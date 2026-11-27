// CHƠI THỬ NHƯ NGƯỜI THẬT: mọi thao tác là CHẠM THẬT lên màn hình, soát từng bước
import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const R=[]; const ok=(c,m)=>{ R.push((c?'PASS ':'FAIL ')+m); if(!c) console.log('FAIL',m); };
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500);
const bb=await p.evaluate(()=>{ const r=document.getElementById('bBW').getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2]; });
await p.touchscreen.tap(bb[0],bb[1]); await p.waitForTimeout(600);
const scr=async(wx,wy)=>p.evaluate(([wx,wy])=>{ const bw=__ltm.bw; const r=document.getElementById('game').getBoundingClientRect();
  const viewW=r.width/bw.scale; bw.camX=Math.max(0,Math.min(BW.W-viewW,wx-viewW/2)); bw.followT=0;
  return [(wx-bw.camX)*bw.scale+r.left, wy*bw.scale+r.top]; },[wx,wy]);
const tapW=async(wx,wy)=>{ const t=await scr(wx,wy); await p.touchscreen.tap(t[0],t[1]); await p.waitForTimeout(220); };
// Bước 1: người chơi cắm 1 đạo mai phục trong rừng
const S=await p.evaluate(()=>{ const bw=__ltm.bw; bw.nextAI=1e9; bw.nextWave=1e9; // tắt AI để kịch bản ổn định
  const n1=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.camp), n2=bw.nodes.filter(n=>n.owner===0&&n.count>0&&!n.camp)[1]||bw.nodes[0];
  let fx=null; outer: for(let x=n1.x+200;x<BW.W;x+=50) for(let y=230;y<BW.H-80;y+=50){
    if(bw.terAt(x,y)==='forest'&&!bw.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<170)){ fx=[x,y]; break outer; } }
  return {n1:n1.id,x1:n1.x,y1:n1.y,n2:n2.id,x2:n2.x,y2:n2.y,fx}; });
await tapW(S.x1,S.y1); await tapW(S.fx[0],S.fx[1]);
await p.evaluate(()=>{ const bw=__ltm.bw; for(let k=0;k<240*60&&!bw.armies.some(a=>a.owner===0&&a.camped);k++) bw.update(1/60); });
let st=await p.evaluate(()=>{ const a=__ltm.bw.armies.find(a=>a.owner===0&&a.camped); return a&&{ambush:!!a.ambush,count:a.count}; });
ok(st&&st.ambush, 'B1: cắm được đạo mai phục trong rừng bằng 2 chạm');
const ambCount=st.count;
// Bước 2 (lỗi anh Dũng báo): CHỌN đạo mai phục rồi đi điều node khác
const amb=await p.evaluate(()=>{ const a=__ltm.bw.armies.find(x=>x.owner===0&&x.camped); return [a.x,a.y]; });
await tapW(amb[0],amb[1]);                      // chọn đạo mai phục
await tapW(S.x2,S.y2);                          // chạm node khác của ta
st=await p.evaluate(([c0])=>{ const bw=__ltm.bw; const a=bw.armies.find(x=>x.owner===0&&x.camped);
  return { stay: !!a&&a.ambush&&Math.round(a.count)===c0, selNode: bw.sel&&bw.sel.id!=null, selId: bw.sel&&bw.sel.id }; },[ambCount]);
ok(st.stay, 'B2: đạo mai phục ĐỨNG YÊN khi mình chạm sang node khác (lỗi cũ: bị rút quân đi)');
ok(st.selNode&&st.selId===S.n2, 'B2: node kia được CHỌN đúng');
// Bước 3: từ node vừa chọn, điều quân đi bình thường
await tapW(S.x2+260,S.y2+40);
st=await p.evaluate(([c0])=>{ const bw=__ltm.bw; const moving=bw.armies.filter(a=>a.owner===0&&!a.camped&&!a.done).length;
  const a=bw.armies.find(x=>x.owner===0&&x.camped); return { moving, ambStay: !!a&&a.ambush&&Math.round(a.count)===c0 }; },[ambCount]);
ok(st.moving>=1, 'B3: node khác vẫn điều quân bình thường');
ok(st.ambStay, 'B3: đạo mai phục vẫn nằm im đúng chỗ');
// Bước 4: vẫn điều được CHÍNH đạo mai phục khi chủ đích: chạm nó rồi chạm đất trống
await tapW(amb[0],amb[1]);
await tapW(amb[0]+420,amb[1]);
st=await p.evaluate(()=>{ const bw=__ltm.bw; const a=bw.armies.find(x=>x.owner===0&&!x.done&&!x.camped&&x.to===-1&&!x.hunt&&Math.abs((x.ty??0)-0)>=0);
  return { ordered: bw.armies.some(x=>x.owner===0&&!x.done&&!x.camped) }; });
ok(st.ordered, 'B4: chủ đích điều đạo mai phục đi nơi khác vẫn được (chạm nó + chạm đất)');
// Bước 5: node bật nút MAI PHỤC rồi chạm node khác -> chỉ đổi chọn, quân không đi
const nodeInfo=await p.evaluate(()=>{ const bw=__ltm.bw; const nd=bw.nodes.find(n=>bw.canAmbush(n)); 
  if(!nd){ const n=bw.nodes.find(n=>n.owner===0&&n.count>0&&!n.camp); if(n){n.ter='forest';} return n?{id:n.id,x:n.x,y:n.y,count:n.count}:null; }
  return {id:nd.id,x:nd.x,y:nd.y,count:nd.count}; });
await tapW(nodeInfo.x,nodeInfo.y);
const btn=await p.evaluate(()=>__ltm.bw._ambBtn&&[__ltm.bw._ambBtn.x+__ltm.bw._ambBtn.w/2,__ltm.bw._ambBtn.y+__ltm.bw._ambBtn.h/2]);
const org=await p.evaluate(()=>{ const r=document.getElementById('game').getBoundingClientRect(); return [r.left,r.top]; });
await p.touchscreen.tap(org[0]+btn[0],org[1]+btn[1]); await p.waitForTimeout(200);
const camp0=await p.evaluate(()=>[__ltm.bw.nodes[0].x,__ltm.bw.nodes[0].y]);
await tapW(camp0[0],camp0[1]);
{ const m=await p.evaluate(()=>{ const bw=__ltm.bw; return bw.menu? bw.menu.opts.map(o=>o.id).join() : ''; }); ok(/move/.test(m)&&/selnode/.test(m)&&/cancel/.test(m),'B5 (6.3.1): chạm cứ điểm ta khi đang mai phục → menu hỏi rõ (rời mai phục tới tiếp viện / chọn cứ điểm kia / huỷ), không tự đổi chọn'); }
{ const r=await p.evaluate(()=>{ const R=(__ltm.bw._menuRects||[]).find(r=>r.id==='selnode'); return R&&[R.x+R.w/2,R.y+R.h/2]; }); if(r) await p.touchscreen.tap(org[0]+r[0],org[1]+r[1]); await p.waitForTimeout(200); }
st=await p.evaluate(([id,c0])=>{ const bw=__ltm.bw; const nd=bw.nodes[id];
  return { kept: nd.ambush===true&&nd.count===c0, switched: bw.sel&&bw.sel.id!==id }; },[nodeInfo.id,nodeInfo.count]);
ok(st.kept, 'B5: node đang mai phục GIỮ NGUYÊN quân khi chạm node khác');
ok(st.switched, 'B5: chạm "👉 Select this post instead" → lựa chọn chuyển sang node kia');
const fps=await p.evaluate(()=>new Promise(res=>{ let n=0; const t0=performance.now(); const lp=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(lp); else res(Math.round(n/2)); }; requestAnimationFrame(lp); }));
console.log(which, R.filter(x=>x.startsWith('PASS')).length+'/'+R.length,'PASS | fps',fps,'| errors',errs.length);
await b.close();
