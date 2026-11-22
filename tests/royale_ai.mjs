// Bot Quần Hùng: thế cục (liên minh chống ta / đánh nhau khi ta yếu), tổ hợp binh chủng, hợp đồng tác chiến, mai phục
import { chromium, devices } from 'playwright';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices['Pixel 7 landscape'];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const r=await p.evaluate(()=>{
  const out={};
  const mk=(seed)=>{ G.bwCfg={royale:36, seed, map:2}; startBigWar(5); const bw=__ltm.bw; bw.intro=null; __ltm.G.paused=true; return bw; };
  const run=(bw,sec)=>{ const tg={me:0,bots:0}; const seen=new Set();
    for(let i=0;i<sec*10;i++){ bw.update(0.1);
      for(const a of bw.armies){ if(seen.has(a)||a.owner===0||a.owner===2) continue; seen.add(a); const t=a.to>=0?bw.nodes[a.to]:a.hunt; if(!t) continue; if(t.owner===0) tg.me++; else if(t.owner!==2) tg.bots++; } }
    return tg; };
  // A) TA QUÁ MẠNH
  { const bw=mk(91); const P=bw.nodes.filter(n=>n.owner!==0&&n.owner!==2);
    const meds=[...new Set(P.map(n=>n.owner))].map(f=>bw.myPower(f)).sort((a,b)=>a-b); out.medianNation=Math.round(meds[meds.length>>1]); out.topNation=Math.round(meds[meds.length-1]); out.me0=Math.round(bw.myPower(0));
    for(const n of bw.nodes) if(n.owner===0) n.count*=12; bw.supplyCap(0); bw.cap0[0]=1e9;
    const near=[...new Set(P.map(n=>n.owner))].filter(f=>bw.nodes.some(n=>n.owner===f&&Math.hypot(n.x-bw.nodes[0].x,n.y-bw.nodes[0].y)<6000));
    bw.setAlly(0,near[0],true);
    const al0=bw.allies.size; for(let k=0;k<30;k++) bw.aiDiplomacy();
    out.strong={coalition:bw.coalition, alliesBefore:al0, alliesAfter:bw.allies.size, myAllyKept:bw.allied(0,near[0]), notes:bw.notes.map(n=>n.text).slice(-2)};
    const nlog=[]; const on=bw.note.bind(bw); bw.note=(t,x,y,i)=>{ nlog.push(Math.round(bw.time)+'s '+t); on(t,x,y,i); };
    const capBy={}; const own0=new Set(bw.nodes.filter(n=>n.owner===0).map(n=>n.id));
    out.strong.targets=run(bw,240); for(const id of own0){ const o=bw.nodes[id].owner; capBy[o]=(capBy[o]||0)+1; } out.strong.ownerOfMyStartNodes=capBy; out.strong.log=nlog.filter(t=>/LIÊN QUÂN|bị diệt|mất|chiếm/.test(t)).slice(0,8); out.strong.jointNotes=bw.notes.map(n=>n.text).filter(t=>t.includes('LIÊN QUÂN')).length; out.strong.lostNodes=bw.nodes.filter(n=>n.owner===0).length; }
  // B) TA YẾU
  { const bw=mk(91); for(const n of bw.nodes) if(n.owner===0) n.count=Math.round(n.count*0.15); bw.aiDiplomacy();
    out.weak={playerWeak:bw.playerWeak, coalition:!!bw.coalition, targets:run(bw,240)}; }
  // C) TỔ HỢP binh chủng: mục tiêu kỵ binh ở đồng bằng
  { const bw=mk(91); const f=3; const cs=bw.nodes.find(n=>n.camp&&n.owner===f);
    const mkN=(type,c,dx)=>{ const n=bw.mkNode(cs.x+dx,cs.y+200,f,type,c); n.ter='plain'; return n; };
    const en=[mkN('cavalry',900,-300),mkN('spear',700,0),mkN('archer',650,300),mkN('saber',800,500)];
    const tgt={x:cs.x+900,y:cs.y,owner:4,type:'cavalry',count:1500,ter:'plain',id:-5,known:{type:'cavalry',count:1500}};
    const pick=bw.aiCombo(f,tgt,en,3,5000).map(e=>e.type);
    const before=bw.armies.length; bw.sendCoordinated(bw.aiCombo(f,tgt,en,3,5000),tgt);
    const sent=bw.armies.slice(before).map(a=>({type:a.type,hold:+(a.holdT||0).toFixed(1),eta:+(Math.hypot(a.x-tgt.x,a.y-tgt.y)/BW.speed).toFixed(1)}));
    out.combo={pick,sent}; }
  // D) bot mai phục nhau trong 4 phút
  { const bw=mk(57); let amb=0, ambBot=0; const seen=new Set();
    for(let i=0;i<2400;i++){ bw.update(0.1); for(const a of bw.armies){ if(a.ambush&&a.owner>=1&&a.owner!==2&&!seen.has(a)){ seen.add(a); amb++; } } }
    out.ambush={botAmbushArmies:amb, battles:bw.battles.length}; }
  return out; });
console.log(JSON.stringify(r,null,1)); console.log('errors', errs.length?errs.slice(0,3):'none'); await b.close();
