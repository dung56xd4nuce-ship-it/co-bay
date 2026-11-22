// v2.7: 10 ải boss + mai phục AI + liên minh Quần Hùng — chạy không lỗi & đo cơ bản
import { chromium, devices } from 'playwright';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices['Pixel 7 landscape'];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200);
// chạy trực tiếp các ải 1,2,6,10 và Quần Hùng (qua hàm nội bộ)
for(const lv of [1,2,6,10]){
  await p.evaluate((lv)=>{ startBigWar(lv); },lv); await p.waitForTimeout(600);
  const r=await p.evaluate(()=>({lv:__ltm.bw.lv, name:__ltm.bw.L.name, tier:BW_AI_TIER(__ltm.bw.lv,false), nodes:__ltm.bw.nodes.length}));
  console.log('ải',JSON.stringify(r));
}
await p.evaluate(()=>{ G.bwCfg={royale:36, seed:77}; startBigWar(5); }); await p.waitForTimeout(800);
const q=await p.evaluate(()=>({W:BW.W,H:BW.H,nations:new Set(__ltm.bw.nodes.filter(n=>n.camp).map(n=>n.owner)).size,allies:__ltm.bw.allies.size}));
console.log('Quần Hùng', JSON.stringify(q));
// 60 giây mô phỏng: AI có đánh/ mai phục không
await p.evaluate(()=>{ startBigWar(10); });
for(let i=0;i<40;i++){ await p.evaluate(()=>{ __ltm.bw.update(0.5); }); }
const s=await p.evaluate(()=>({ambushArmies:__ltm.bw.armies.filter(a=>a.owner===1&&a.ambush).length, aiArmies:__ltm.bw.armies.filter(a=>a.owner===1).length}));
console.log('sau 20s ải 10:', JSON.stringify(s));
console.log('errors', errs.length?errs:'none');
await b.close();
