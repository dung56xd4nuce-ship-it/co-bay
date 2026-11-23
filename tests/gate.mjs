// CỔNG PHÁT HÀNH — một lệnh chạy toàn bộ kiểm thử; có lỗi là dừng, KHÔNG phát hành.
//   node test/gate.mjs            chạy tất cả
//   node test/gate.mjs --fast     bỏ nhóm chạy lâu (bot đánh 10 ải, ngâm Quần Hùng)
//   node test/gate.mjs --only=flows,layout
// Nhóm "như người chơi" tự chấm PASS/FAIL trên máy giả lập Android + iOS; nhóm "khói" chỉ cần chạy hết không lỗi JS.
import { spawn, execSync } from 'child_process';
import fs from 'fs'; import http from 'http';
const FAST=process.argv.includes('--fast'), ONLY=(process.argv.find(a=>a.startsWith('--only='))||'').slice(7).split(',').filter(Boolean);
const ROOT=new URL('..',import.meta.url).pathname;
// 1) build mới nhất + máy chủ thử
execSync('node build.mjs',{cwd:ROOT,stdio:'ignore'}); fs.mkdirSync('/tmp/solo',{recursive:true}); fs.copyFileSync(ROOT+'dist/index.html','/tmp/solo/index.html');
const up=()=>new Promise(r=>{ const q=http.get('http://localhost:8766/index.html',s=>{ s.resume(); r(s.statusCode===200); }); q.on('error',()=>r(false)); q.setTimeout(1500,()=>{ q.destroy(); r(false); }); });
if(!(await up())){ spawn('python3',['-m','http.server','8766'],{cwd:'/tmp/solo',detached:true,stdio:'ignore'}).unref(); for(let i=0;i<20&&!(await up());i++) await new Promise(r=>setTimeout(r,300)); }
// 2) danh sách: [tên, file, kiểu, giới hạn giây, chạy-lâu?]
const exists=(f)=>fs.existsSync(ROOT+'test/'+f);
const LIST=[
  ['luật chơi (171+ tình huống)','rules.mjs','rules',120],
  ['bố cục HUD mọi cỡ máy','audit_layout.mjs','exit',420],
  ['luồng người chơi','gate_flows.mjs','exit',240],
  ['điều khiển cảm ứng trong trận','gate_touch.mjs','exit',300],
  ['địa hình & đường đi','gate_terrain.mjs','exit',300],
  ['văn minh & binh chủng','gate_civ.mjs','exit',300],
  ['P2P hai máy','gate_p2p.mjs','exit',240],
  ['màn hình menu mọi cỡ máy','audit_screens.mjs','exit',300],
  ['chạm ngẫu nhiên (khỉ)','gate_monkey.mjs','exit',300],
  ['hiệu năng máy yếu','gate_perf.mjs','exit',300],
  ['bot đánh 10 ải','gate_bot.mjs','exit',900,1],
  ['ngâm Quần Hùng','gate_soak.mjs','exit',900,1],
  ...['handplay','touchdrag','touchpinch','selectarmy','edgecorner','boxselect','camera_maps','capital','territory','rally','rally_refill','afterbattle','afterbattle_ui','saveload','bigmap','royale_ai','royale_ally','boss10','supplycap','p2pui','frame','en_tour'].map(n=>['khói · '+n,n+'.mjs','smoke',n==='camera_maps'?900:240,n==='camera_maps'?1:0]),
].filter(t=>exists(t[1])&&!(FAST&&t[4])&&(!ONLY.length||ONLY.some(o=>t[1].includes(o))));
const run=(t)=>new Promise(res=>{ const t0=Date.now(); let out=''; const ch=spawn('node',['test/'+t[1]],{cwd:ROOT});
  ch.stdout.on('data',d=>out+=d); ch.stderr.on('data',d=>out+=d);
  const kill=setTimeout(()=>{ out+='\n[QUÁ GIỜ '+t[3]+'s]'; ch.kill('SIGKILL'); },t[3]*1000);
  ch.on('close',code=>{ clearTimeout(kill); let bad='';
    if(/QUÁ GIỜ/.test(out)) bad='quá giờ';
    else if(t[2]==='rules'){ const f=(out.match(/^FAIL .*/gm)||[]); const p=(out.match(/^PASS /gm)||[]).length; if(f.length||!p||code) bad=f.length? f.length+' FAIL: '+f[0] : 'không chạy được'; else out=`${p} PASS`; }
    else if(t[2]==='exit'){ if(code) bad=(out.match(/✗ .*/g)||['mã thoát '+code]).slice(0,6).join(' | '); }
    else { const m=out.match(/(?:errors?\s*(?:H|G)?\s*\[[^\]]+\]|TypeError[^\n]*|ReferenceError[^\n]*|Error: [^\n]*|Timeout[^\n]*exceeded)/); if(code||m) bad=m? m[0].slice(0,160) : 'mã thoát '+code; }
    res({t,bad,sec:((Date.now()-t0)/1000).toFixed(0),last:out.trim().split('\n').slice(-1)[0].slice(0,110)}); }); });
// 3) chạy 3 luồng song song
const q=LIST.slice(), R=[]; await Promise.all(Array.from({length:3},async()=>{ while(q.length){ const t=q.shift(); const r=await run(t); R.push(r); console.log(`${r.bad?'✗':'✓'} ${t[0]} (${r.sec}s)${r.bad? ' — '+r.bad : t[2]==='smoke'?'':' — '+r.last}`); } }));
const bad=R.filter(r=>r.bad);
console.log(`\nCỔNG PHÁT HÀNH: ${R.length-bad.length}/${R.length} nhóm đạt${bad.length? ' — CHẶN PHÁT HÀNH: '+bad.map(r=>r.t[0]).join(', ') : ' — ĐƯỢC PHÉP PHÁT HÀNH'}`);
process.exit(bad.length?1:0);
