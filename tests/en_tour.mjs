// Đi qua mọi màn hình bằng CHẠM THẬT, chụp ảnh, và quét DOM + chữ vẽ trên canvas xem còn tiếng Việt không
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'iPhone 14 Pro landscape', tag=dev.split(' ')[0];
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const ctx=await b.newContext(o); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ window.__TXT=new Set(); const f=CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText=function(t,...a){ try{ if(typeof t==='string') window.__TXT.add(t); }catch(_){} return f.call(this,t,...a); }; });
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1200);
const tap=async(id,w=500)=>{ const r=await p.evaluate((id)=>{const e=document.getElementById(id); if(!e) return null; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2];},id); if(r){ await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(w);} return !!r; };
const shot=async(n)=>p.screenshot({path:`/tmp/en_${tag}_${n}.png`});
await shot('01_menu');
await tap('bHelp'); await shot('02_help'); await p.evaluate(()=>{ const h=document.querySelector('#help .card'); h.scrollTop=1400; }); await shot('02b_help'); await p.evaluate(()=>document.querySelector('#help [data-back]').click()); await p.waitForTimeout(300);
await tap('bP2P'); await shot('03_p2p'); await p.evaluate(()=>document.querySelector('#p2p [data-back]').click()); await p.waitForTimeout(300);
await tap('bBW'); await shot('04_battle_menu'); await tap('bBossRoyale',900); await shot('04b_pick_nation'); await tap('civGo',1500); await p.waitForTimeout(5000); await shot('05_royale');
// mở menu lệnh: chọn trại ta rồi chạm trại nước khác
await p.evaluate(()=>{ const bw=__ltm.bw; const cap=bw.nodes.find(n=>n.capOf===0); const other=bw.nodes.filter(n=>n.camp&&n.owner>=3).sort((a,b)=>Math.hypot(a.x-cap.x,a.y-cap.y)-Math.hypot(b.x-cap.x,b.y-cap.y))[0]; bw.sel=cap; bw.tap(other.x,other.y); const s=bw.scale0*0.5; bw.zoom=bw.zoomTgt=0.5; bw.camX=other.x-bw.lastVw/s/2; bw.camY=other.y-bw.lastVh/s/2; });
await p.waitForTimeout(400); await shot('06_order_menu');
await p.evaluate(()=>{ __ltm.bw.menu=null; }); const rb=await p.evaluate(()=>__ltm.bw._rallyBtn); await p.touchscreen.tap(rb.x+rb.w/2,rb.y+rb.h/2); await p.waitForTimeout(400); await shot('07_rally');
await p.evaluate(()=>{ __ltm.bw.rallyOpen=false; }); await tap('bwPause'); await shot('08_pause');
await tap('bResume');
await p.evaluate(()=>{ const bw=__ltm.bw; bw.over=true; bw.result={win:true}; }); await p.waitForTimeout(1500); await shot('09_result');
const VN=/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;
const dom=await p.evaluate((re)=>{ const R=new RegExp(re); const out=[]; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){ if(R.test(n.textContent)) out.push(n.textContent.trim().slice(0,80)); } document.querySelectorAll('[placeholder],[title],[alt]').forEach(e=>{ for(const a of ['placeholder','title','alt']){ const v=e.getAttribute(a); if(v&&R.test(v)) out.push(a+':'+v); } }); return out; }, VN.source);
const cvs=await p.evaluate((re)=>{ const R=new RegExp(re); return [...window.__TXT].filter(t=>R.test(t)).slice(0,20); }, VN.source);
console.log(dev,'| tiếng Việt còn trong DOM:',dom.length?dom:'không','| chữ vẽ canvas còn tiếng Việt:',cvs.length?cvs:'không','| errors',errs.length?errs:'none');
await b.close();
