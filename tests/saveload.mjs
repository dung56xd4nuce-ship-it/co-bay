// Lưu ván Quần Hùng → ĐÓNG HẲN trình duyệt (như tắt app) → mở lại → Chơi tiếp bằng CHẠM nút; so trạng thái
import { chromium, devices } from 'playwright';
const dev=process.argv[2]||'Pixel 7 landscape';
const b=await chromium.launch(); const {defaultBrowserType,...o}=devices[dev];
const dir='/tmp/ltm_profile_'+Date.now();
const tapId=async(p,id)=>{ const r=await p.evaluate((id)=>{const r=document.getElementById(id).getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];},id); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(500); };
// phiên 1: dùng hồ sơ trình duyệt thật trên đĩa
let ctx=await chromium.launchPersistentContext(dir,o); let p=ctx.pages()[0]||await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
await tapId(p,'bBW'); const hidden1=await p.evaluate(()=>getComputedStyle(document.getElementById('bBossContinue')).display==='none');
await tapId(p,'bBossRoyale'); await p.waitForTimeout(500); await tapId(p,'civGo'); await p.waitForTimeout(800);   // v5.0: qua màn chọn nước
const s1=await p.evaluate(()=>{ const bw=__ltm.bw; bw.intro=null; for(let i=0;i<600;i++) bw.update(0.1); __ltm.G.paused=true;
  const own0=bw.nodes.filter(n=>n.owner===0).length; bw.setAlly(0,5,true);
  __ltm.royaleSave(); return {t:Math.round(bw.time), nodes:bw.nodes.length, mine:own0, power:Math.round(bw.myPower(0)), armies:bw.armies.length, battles:bw.battles.filter(b=>!b.done).length, allies:bw.allies.size, map:bw.mapName}; });
// tắt app: ẩn trang (giống bấm Home trên điện thoại) rồi đóng hẳn
await p.evaluate(()=>{ Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); });
await ctx.close();
// phiên 2: mở lại app
ctx=await chromium.launchPersistentContext(dir,o); p=ctx.pages()[0]||await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1000);
const disk=await p.evaluate(()=>{ const sv=JSON.parse(localStorage.getItem('ltm_royale_save_v1')); const G2=new (__ltm.BigWar)(sv.lv,Object.assign({},sv.cfg)); G2.loadState(sv); return {t:Math.round(G2.time), nodes:G2.nodes.length, mine:G2.nodes.filter(n=>n.owner===0).length, power:Math.round(G2.myPower(0)), armies:G2.armies.length, battles:G2.battles.filter(b=>!b.done).length, allies:G2.allies.size, map:G2.mapName}; });
await tapId(p,'bBW'); const label=await p.evaluate(()=>document.getElementById('bBossContinue').innerText.replace(/\n/g,' | '));
await tapId(p,'bBossContinue'); await p.evaluate(()=>{ __ltm.G.paused=true; });
const s2=await p.evaluate(()=>{ const bw=__ltm.bw; return {t:Math.round(bw.time), nodes:bw.nodes.length, mine:bw.nodes.filter(n=>n.owner===0).length, power:Math.round(bw.myPower(0)), armies:bw.armies.length, battles:bw.battles.filter(b=>!b.done).length, allies:bw.allies.size, map:bw.mapName}; });
// chơi tiếp 60s phải chạy bình thường
const s3=await p.evaluate(()=>{ const bw=__ltm.bw; __ltm.G.paused=false; for(let i=0;i<600;i++) bw.update(0.1); return {t:Math.round(bw.time), battlesDone:bw.battles.filter(b=>b.done).length, armies:bw.armies.length}; });
await p.waitForTimeout(1500); await p.screenshot({path:'/tmp/resume.png'});
console.log(dev); console.log('  nút Chơi tiếp ẩn khi chưa có bản lưu:',hidden1); console.log('  trước khi tắt:',JSON.stringify(s1)); console.log('  nhãn nút:',label);
console.log('  khôi phục từ bộ nhớ máy:',JSON.stringify(disk)); console.log('  vào lại ván (sau 0.5s chạy):',JSON.stringify(s2)); console.log('  chơi tiếp 60s:',JSON.stringify(s3)); console.log('  errors', errs.length?errs.slice(0,3):'none');
await ctx.close(); await b.close();
