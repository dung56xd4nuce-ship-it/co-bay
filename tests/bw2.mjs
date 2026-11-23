import { chromium, devices } from 'playwright';
const which=process.argv[2]||'android'; const LV=+process.argv[3]||1;
const {defaultBrowserType, ...o}= which==='ios'? devices['iPhone 14 Pro landscape'] : devices['Pixel 7 landscape'];
const b=await chromium.launch(); const p=await (await b.newContext(o)).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route('**fonts.g*/**', r=>r.abort());
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500);
await p.evaluate((lv)=>{ __ltm.startBigWar(lv); __ltm.bw.autoMenu=true; }, LV); await p.waitForTimeout(600);
await p.screenshot({path:`test/${which}-bw-start.png`});
// chơi bằng chạm thật: chọn nước đi tốt nhất, chạm node nguồn rồi node đích
const tapNode=async(id)=>{ const s=await p.evaluate((id)=>{ const bw=__ltm.bw; const n=bw.nodes[id]; const r=document.getElementById('game').getBoundingClientRect(); const viewW=r.width/bw.scale; bw.camX=Math.max(0,Math.min(BW.W-viewW,n.x-viewW/2)); return [(n.x-bw.camX)*bw.scale+r.left,(n.y)*bw.scale+r.top]; },id); await p.touchscreen.tap(s[0],s[1]); await p.waitForTimeout(140); };
let shots=0;
for(let it=0;it<800;it++){
  const mv=await p.evaluate(()=>{ const bw=__ltm.bw; if(!bw||bw.over) return null;
    const mine=bw.nodes.filter(n=>n.owner===0&&n.count>0).sort((a,b)=>b.count-a.count);
    if(!mine.length) return {wait:true};
    if(bw.armies.filter(a=>a.owner===0).length>=4) return {wait:true};
    // địch chỉ còn trại -> dồn toàn lực về node của ta gần trại nhất rồi công
    const camp=bw.nodes.find(n=>n.owner===1&&n.camp);
    const RALLY=()=>{ if(!camp) return null;
      let F=null,fd=1e9; for(const n of mine){ const d=Math.hypot(n.x-camp.x,n.y-camp.y); if(d<fd){fd=d;F=n;} }
      if(F){ if(fd<=1100){ const [ra]=__ltm.bwResolve(F.type,F.count,camp.type,camp.count,bw.defMul(camp),camp.ter); if(ra>0) return {from:F.id,to:camp.id}; }
        let feed=null,bfs=-1e9; for(const n of mine){ if(n===F) continue; const d=Math.hypot(n.x-F.x,n.y-F.y); if(d<=1100&&n.count>120&&n.count*1+ -d*0.1>bfs){ bfs=n.count-d*0.1; feed=n; } }
        if(feed) return {from:feed.id,to:F.id};
        // không ai cạnh F: khối lớn nhất nhảy từng chặng về phía F
        let B=null; for(const n of mine){ if(n!==F&&n.count>400&&(!B||n.count>B.count)) B=n; }
        if(B){ let hop=null,hd=1e9; for(const n of bw.nodes){ if(n===B) continue; const d=Math.hypot(n.x-B.x,n.y-B.y); if(d>1100) continue;
            if(n.owner===2&&n.count>=B.count) continue; if(n.owner===1&&n.count>0&&n.count>=B.count*0.6) continue;
            const df=Math.hypot(n.x-F.x,n.y-F.y); if(df<Math.hypot(B.x-F.x,B.y-F.y)-40&&df<hd){ hd=df; hop=n; } }
          if(hop) return {from:B.id,to:hop.id}; }
      } return null; };
    let best=null,bs=-1e9;
    for(const s of mine){ for(const n of bw.nodes){ if(n===s) continue; const d=Math.hypot(n.x-s.x,n.y-s.y); if(d>1100) continue;
      let sc=-1e9;
      if(n.owner===2){ const eco=n.eco? (n.eco==='farm'?700:450):0; if(s.count>n.count) sc= n.count*2.2+eco - d*0.25; else { const [ra]=__ltm.bwResolve(s.type,s.count,n.type,n.count,bw.defMul(n),n.ter); sc= ra>0? ra*0.7+eco - d*0.25 : -1e9; } }
      else if(n.owner===1){ const [ra]=__ltm.bwResolve(s.type,s.count,n.type,n.count,bw.defMul(n),n.ter); sc= ra>0? ra+n.count*0.4-d*0.25+(n.camp?5000:0)+(n.eco?500:0) : -1e9; }
      
      if(sc>bs){ bs=sc; best={from:s.id,to:n.id,sc}; } } }
    if(bs>-1e8) return best;
    { const r2=RALLY(); if(r2) return r2; }
  // bí: (a) TIẾN QUÂN — khối lớn nhất gộp vào node của ta/node trống nằm gần trại địch hơn; (b) gộp lính vụn
  const all=bw.nodes.filter(n=>n.owner===0&&n.count>0).sort((a,b)=>b.count-a.count);
  for(const s2 of all.slice(0,3)){ let tgt=null,bs2=-1e9;
    for(const n of bw.nodes){ if(n===s2) continue; const d=Math.hypot(n.x-s2.x,n.y-s2.y); if(d>1100) continue;
      if(bw.pA(n)<=bw.pA(s2)+0.013) continue; if(n.owner===1) continue; if(n.owner===2&&n.count>0) continue;
      const sc=n.x-s2.x-d*0.1+((n.owner===0&&n.count>0)?40:0); if(sc>bs2){bs2=sc;tgt=n;} }
    if(tgt) return {from:s2.id,to:tgt.id}; }
  if(all.length>=2){ const s2=all[all.length-1]; let tgt=null,bd=1e9; for(const n of all){ if(n===s2) continue; const d=Math.hypot(n.x-s2.x,n.y-s2.y); if(d<=1100&&d<bd){bd=d;tgt=n;} } if(tgt&&s2.count<500) return {from:s2.id,to:tgt.id}; }
  return {wait:true}; });
  if(!mv) break;
  if(!mv.wait){ await tapNode(mv.from); await tapNode(mv.to); }
  await p.evaluate(()=>{ for(let k=0;k<100;k++){ __ltm.bw&&!__ltm.bw.over&&__ltm.bw.update(1/60); } });
  if(it===6&&shots<1){ shots++; await p.waitForTimeout(400); await p.screenshot({path:`test/${which}-bw-mid.png`}); }
}
await p.waitForTimeout(1800);
const res=await p.evaluate(()=>({over:__ltm.bw?.over, win:__ltm.bw?.result?.win, t:Math.round(__ltm.bw?.time||0), stats:__ltm.bw?.stats, mine:__ltm.bw?.nodes.filter(n=>n.owner===0&&n.count>0).map(n=>[n.type,Math.round(n.count),Math.round(n.x),Math.round(n.y)]), en:__ltm.bw?.nodes.filter(n=>n.owner===1&&n.count>0).map(n=>[n.type,Math.round(n.count),Math.round(n.x),Math.round(n.y),n.camp?'C':''])}));
await p.screenshot({path:`test/${which}-bw-end.png`});
const fps=await p.evaluate(()=>new Promise(res2=>{ let n=0; const t0=performance.now(); const f=()=>{ n++; if(performance.now()-t0<2500) requestAnimationFrame(f); else res2((n/2.5).toFixed(0)); }; requestAnimationFrame(f); }));
console.log(which,'BW:',JSON.stringify(res),'fps',fps,'errors',errs);
await b.close();
