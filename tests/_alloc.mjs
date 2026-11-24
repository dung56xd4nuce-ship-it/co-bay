// Ai xả rác bộ nhớ nhiều nhất trong lúc chơi bình thường? (rác nhiều → trình duyệt dọn rác → khựng hình)
import { chromium } from 'playwright';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:400,height:869},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage(); await p.goto(process.argv.find(a=>a.startsWith('http'))||'http://localhost:8766/index.html'); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(500);
const cdp=await ctx.newCDPSession(p);
await p.evaluate(()=>{ G.bwCfg={royale:36,seed:63,civ:'vn'}; startBigWar(5); const bw=__ltm.bw; bw.intro=null; for(let i=0;i<4*60*20&&!bw.over;i++) bw.update(0.05); });
await p.waitForTimeout(3000);
await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.startSampling',{samplingInterval:4096,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
const SEC=+(process.argv.find(a=>a.startsWith('--sec='))||'--sec=20').split('=')[1];
const fr=()=>p.evaluate(()=>typeof PACE!=="undefined"? PACE.drawn : (window.__fc||0)); await p.evaluate(()=>{ if(typeof PACE==="undefined"){ window.__fc=0; const of=window.frame; window.frame=function(t){ window.__fc++; return of(t); }; } }); const f0=await fr(); await p.waitForTimeout(SEC*1000); const f1=await fr();
const {profile}=await cdp.send('HeapProfiler.stopSampling');
const agg=new Map(); let total=0;
const walk=(n,stack)=>{ const name=(n.callFrame.functionName||'(anon)')+':'+n.callFrame.lineNumber; const self=n.selfSize||0; if(self){ total+=self; const k=(stack.slice(-2).join(' > ')+' > '+name); agg.set(k,(agg.get(k)||0)+self); } for(const c of n.children||[]) walk(c,[...stack,name]); };
walk(profile.head,[]);
const top=[...agg.entries()].sort((a,b)=>b[1]-a[1]).slice(0,22);
console.log(`khung hình vẽ: ${f1-f0} trong ${SEC}s · rác ~${(total/1024/SEC).toFixed(0)} KB/giây`);
for(const [k,v] of top) console.log('  ',(v/1024/SEC).toFixed(1).padStart(7),'KB/s ',k);
await b.close();
