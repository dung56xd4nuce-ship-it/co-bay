// Người chơi đứng yên (không ra lệnh) thì trụ được bao lâu? So bản cũ/mới để chắc thay đổi kỹ thuật không làm lệch cân bằng.
import { chromium } from 'playwright';
const url=process.argv.find(a=>a.startsWith('http'))||'http://localhost:8766/index.html';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:800,height:400},deviceScaleFactor:1});
const p=await ctx.newPage(); await p.goto(url); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(500);
const out=[];
for(const seed of [61,62,63,64,65,66,67,68]){
  const r=await p.evaluate((seed)=>{ G.paused=true; G.bwCfg={royale:36,seed,civ:'vn'}; startBigWar(5); const bw=__ltm.bw; bw.intro=null; let i=0; const MAX=10*60*20; for(;i<MAX&&!bw.over;i++) bw.update(0.05);
    const alive=new Set(bw.nodes.filter(n=>n.owner!==2&&(n.count>0||n.camp)).map(n=>n.owner)).size; const mine=bw.nodes.filter(n=>n.owner===bw.localFid).length;
    return {seed,t:Math.round(bw.time),over:!!bw.over,win:bw.result&&bw.result.win,alive,mine,armies:bw.armies.length}; },seed);
  out.push(r); }
console.log(url.includes('8769')?'5.0':'MỚI', out.map(r=>`${r.seed}:${r.over?(r.win?'thắng':'thua')+'@'+r.t+'s':'còn@'+r.t+'s'} nước=${r.alive} đất=${r.mine}`).join(' | '));
await b.close();
