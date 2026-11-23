// HIỆU NĂNG MÁY YẾU: bóp CPU 4× (CDP) rồi đo số khung hình THẬT (requestAnimationFrame) + chi phí update/draw
// trong 4 cảnh người chơi hay gặp: đứng yên · kéo bản đồ · toàn cảnh · giữa trận. So với bản cũ v4.2 (cổng 8767) nếu máy chủ còn chạy.
import { launch, open, ok, finish, DEVICES } from './lib.mjs';
import http from 'http';
const OLD='http://localhost:8767/index.html', RATE=+((process.argv.find(a=>a.startsWith('--rate='))||'').slice(7))||4;
const up=(u)=>new Promise(r=>{ const q=http.get(u,s=>{ s.resume(); r(s.statusCode===200); }); q.on('error',()=>r(false)); q.setTimeout(1500,()=>{ q.destroy(); r(false); }); });
const hasOld=await up(OLD); const b=await launch();
const q=(a,f)=>{ if(!a.length) return 0; const s=[...a].sort((x,y)=>x-y); return s[Math.min(s.length-1,Math.floor(s.length*f))]; };
async function measure(url,mode,label){
  const T=await open(b,DEVICES[0][1],{url}); const {p,cdp}=T; await p.waitForTimeout(1500);   // chờ bộ art giải nén xong ở menu
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:RATE});
  await T.ev((mode)=>{ window.__pf={u:[],d:[],f:[]}; let last=performance.now(); const f=(t)=>{ __pf.f.push(t-last); last=t; requestAnimationFrame(f); }; requestAnimationFrame(f);
    G.bwCfg= mode==='royale'? {royale:36,seed:77,map:3,civ:'rome'} : {map:6,civ:'rome'}; startBigWar(mode==='royale'?5:4); const bw=__ltm.bw;
    const U=bw.update.bind(bw), D=bw.draw.bind(bw);
    bw.update=(dt)=>{ const t=performance.now(); U(dt); __pf.u.push(performance.now()-t); }; bw.draw=(...a)=>{ const t=performance.now(); D(...a); __pf.d.push(performance.now()-t); }; },mode);
  const vw=await T.ev(()=>innerWidth), vh=await T.ev(()=>innerHeight); const out={};
  const phase=async(name,fn,ms,keep)=>{ if(!keep) await T.ev(()=>{ __pf.u.length=0; __pf.d.length=0; __pf.f.length=0; }); const t0=Date.now(); if(fn) await fn(); const left=ms-(Date.now()-t0); if(left>0) await p.waitForTimeout(left);
    const r=await T.ev(()=>({u:__pf.u.slice(),d:__pf.d.slice(),f:__pf.f.slice(1),pend:__ltm.bw._mapPending||0,arm:__ltm.bw.armies.length}));
    const tot=r.f.reduce((s,x)=>s+x,0)||1; out[name]={fps:+(r.f.length/tot*1000).toFixed(1),p95:+q(r.f,0.95).toFixed(0),max:+Math.max(0,...r.f).toFixed(0),upd:+q(r.u,0.5).toFixed(2),updMax:+Math.max(0,...r.u).toFixed(1),draw:+q(r.d,0.5).toFixed(2),drawMax:+Math.max(0,...r.d).toFixed(1),pend:r.pend,arm:r.arm}; };
  await phase('vào trận',null,4000,true);                                   // gồm cả cảnh lia máy mở màn + dựng bản đồ
  await T.ev(()=>{ const bw=__ltm.bw; if(bw.skipIntro) bw.skipIntro(); else bw.intro=null; }); await p.waitForTimeout(1500);
  await phase('đứng yên',null,2500);
  await phase('kéo bản đồ',async()=>{ for(let i=0;i<5;i++){ await T.drag(vw*0.75,vh*0.5,vw*0.25,vh*(0.4+0.05*i),18); await T.drag(vw*0.3,vh*0.45,vw*0.7,vh*0.55,18); } },4000);
  await phase('toàn cảnh',async()=>{ await T.ev(()=>{ const bw=__ltm.bw; if(bw.zoomTgt!=null) bw.zoomTgt=bw.zoomMin||0.2; }); },3000);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await T.ev(()=>{ const bw=__ltm.bw; if(bw.zoomTgt!=null) bw.zoomTgt=1; const U=Object.getPrototypeOf(bw).update; for(let k=0;k<3600&&!bw.over;k++) U.call(bw,0.05); }); await p.waitForTimeout(800);   // tua 3 phút trận
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:RATE});
  await phase('giữa trận',null,3000);
  await phase('giữa trận · kéo',async()=>{ for(let i=0;i<4;i++){ await T.drag(vw*0.7,vh*0.55,vw*0.3,vh*0.45,18); await T.drag(vw*0.3,vh*0.45,vw*0.7,vh*0.6,18); } },3200);
  out.err=T.errs.slice(0,2); await T.ctx.close(); console.log(label,JSON.stringify(out)); return out; }
const PH=['vào trận','đứng yên','kéo bản đồ','toàn cảnh','giữa trận','giữa trận · kéo'];
for(const mode of ['1v1','royale']){ console.log(`— ${mode==='royale'?'Quần Hùng 37 nước':'Đánh Boss 1v1'} · CPU chậm ${RATE}× —`);
  const N=await measure(undefined,mode,'  bản mới'); const O=hasOld? await measure(OLD,mode,'  bản v4.2') : null;
  ok(N.err.length===0,`${mode}: không lỗi JS khi máy chậm`+(N.err.length?': '+N.err.join(' | '):''));
  for(const ph of PH){ const n=N[ph], o=O&&O[ph];
    // máy thử vẽ bằng phần mềm nên con số tuyệt đối thấp hơn điện thoại thật; lấy bản v4.2 (đo cùng lúc, cùng máy) làm mốc
    if(o){ const tol= ph==='vào trận'? 0.68 : 0.8;   // 4 giây đầu trận bản mới còn dựng bản đồ chi tiết (một lần) nên cho phép chậm hơn chút; phép đo này cũng nhiễu nhất
      ok(n.fps>=o.fps*tol,`${mode} · ${ph}: ${n.fps} khung/giây — v4.2: ${o.fps} (không được chậm hơn quá ${Math.round((1-tol)*100)}%)`);
      ok(n.max<=Math.max(o.max*1.5,200),`${mode} · ${ph}: khung chậm nhất ${n.max} ms — v4.2: ${o.max} ms`); }
    else { ok(n.fps>=10,`${mode} · ${ph}: ${n.fps} khung/giây`); ok(n.max<=400,`${mode} · ${ph}: khung chậm nhất ${n.max} ms`); }
    ok(n.upd<=4,`${mode} · ${ph}: tính toán trận ${n.upd} ms/khung (cần ≤4)`); } }
await finish('HIỆU NĂNG MÁY YẾU',b);
