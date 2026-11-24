// v2.7: cảnh mở đầu quét bản đồ rồi lia tới trại ta
import { chromium, devices } from 'playwright';
const b=await chromium.launch();
const {defaultBrowserType, ...o}=devices['Pixel 7 landscape']; const ctx=await b.newContext(o); const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200);
const tap=async(id)=>{ const r=await p.evaluate((id)=>{const r2=document.getElementById(id).getBoundingClientRect();return [r2.x+r2.width/2,r2.y+r2.height/2];},id); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(300); };
await tap('bBW'); await tap('bBoss1v1'); await p.evaluate(()=>document.querySelector('.stg.cur').click());
const st=()=>p.evaluate(()=>{const bw=__ltm.bw; const c=bw.nodes.find(n=>n.camp&&n.owner===bw.localFid); return {intro:!!bw.intro, camX:Math.round(bw.camX), camY:Math.round(bw.camY), zoom:+bw.zoom.toFixed(2), campX:Math.round(c.x), campY:Math.round(c.y), W:6600};});
const samples=[];
for(let i=0;i<7;i++){ await p.waitForTimeout(700); samples.push(await st()); }
console.log(samples.map(s=>JSON.stringify(s)).join('\n'));
await p.screenshot({path:'/tmp/intro_end.png'});
console.log('errors', errs.length?errs:'none');
await b.close();
