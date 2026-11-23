import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android';
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort());
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500);
await p.tap('#bBW'); await p.waitForTimeout(600);
await p.screenshot({path:`test/${which}-bw-start.png`});
// chơi bằng chạm thật: chọn nước đi tốt nhất, chạm node nguồn rồi node đích
const tapNode=async(id)=>{ const s=await p.evaluate((id)=>{ const bw=__ltm.bw; const n=bw.nodes[id]; const r=document.getElementById('game').getBoundingClientRect(); return [(n.x-bw.camX)*bw.scale+r.left,(n.y)*bw.scale+r.top]; },id); await p.touchscreen.tap(s[0],s[1]); await p.waitForTimeout(140); };
let shots=0;
for(let it=0;it<60;it++){
  const mv=await p.evaluate(()=>{ const bw=__ltm.bw; if(!bw||bw.over) return null;
    const mine=bw.nodes.filter(n=>n.owner===0&&n.count>0).sort((a,b)=>b.count-a.count);
    if(!mine.length) return {wait:true};
    if(bw.armies.some(a=>a.owner===0)) return {wait:true};
    let best=null,bs=-1e9;
    for(const s of mine){ for(const n of bw.nodes){ if(n===s) continue; const d=Math.hypot(n.x-s.x,n.y-s.y); if(d>900) continue;
      let sc=-1e9;
      if(n.owner===2){ if(s.count>n.count) sc= n.count*2.2 - d*0.25; else { const [ra]=__ltm.bwResolve(s.type,s.count,n.type,n.count); sc= ra>0? ra*0.7 - d*0.25 : -1e9; } }
      else if(n.owner===1){ const [ra,rb]=__ltm.bwResolve(s.type,s.count,n.type,n.count); sc= ra>0? ra+n.count*0.4-d*0.25+(n.camp?5000:0) : -1e9; }
      else if(n.owner===0 && n.count>0 && s.count<700) sc= 180 - d*0.3; // gộp khi yếu
      if(sc>bs){ bs=sc; best={from:s.id,to:n.id,sc}; } } }
    return bs>-1e8? best : {wait:true}; });
  if(!mv) break;
  if(!mv.wait){ await tapNode(mv.from); await tapNode(mv.to); }
  await p.evaluate(()=>{ for(let k=0;k<3*60;k++){ __ltm.bw&&!__ltm.bw.over&&__ltm.bw.update(1/60); } });
  if(it===6&&shots<1){ shots++; await p.waitForTimeout(400); await p.screenshot({path:`test/${which}-bw-mid.png`}); }
}
await p.waitForTimeout(1800);
const res=await p.evaluate(()=>({over:__ltm.bw?.over, win:__ltm.bw?.result?.win, t:Math.round(__ltm.bw?.time||0), stats:__ltm.bw?.stats}));
await p.screenshot({path:`test/${which}-bw-end.png`});
const fps=await p.evaluate(()=>new Promise(res2=>{ let n=0; const t0=performance.now(); const f=()=>{ n++; if(performance.now()-t0<2500) requestAnimationFrame(f); else res2((n/2.5).toFixed(0)); }; requestAnimationFrame(f); }));
console.log(which,'BW:',JSON.stringify(res),'fps',fps,'errors',errs);
await b.close();
