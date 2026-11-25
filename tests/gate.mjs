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
// bản phát hành trước (repo co-bay/www) phục vụ ở cổng 8770 để nhóm hiệu năng có mốc so sánh trên chính máy này
{ const prev='/home/claude/co-bay/www/index.html', up2=()=>new Promise(r=>{ const q=http.get('http://localhost:8770/index.html',s=>{ s.resume(); r(s.statusCode===200); }); q.on('error',()=>r(false)); q.setTimeout(1500,()=>{ q.destroy(); r(false); }); });
  if(fs.existsSync(prev)&&!(await up2())){ fs.mkdirSync('/tmp/prev',{recursive:true}); fs.copyFileSync(prev,'/tmp/prev/index.html'); spawn('python3',['-m','http.server','8770'],{cwd:'/tmp/prev',detached:true,stdio:'ignore'}).unref(); for(let i=0;i<20&&!(await up2());i++) await new Promise(r=>setTimeout(r,300)); } }
// 2) danh sách: [tên, file, kiểu, giới hạn giây, chạy-lâu?]
const exists=(f)=>fs.existsSync(ROOT+'test/'+f);
const LIST=[
  ['soát mã bị nuốt vào chú thích + cú pháp','lint_swallow.mjs','exit',60],
  ['luật chơi (350 tình huống)','rules.mjs','rules',480,0,1],        // nặng CPU: chạy riêng ở chặng 2
  ['bố cục HUD mọi cỡ máy','audit_layout.mjs','exit',420],
  ['luồng người chơi','gate_flows.mjs','exit',240],
  ['điều khiển cảm ứng trong trận','gate_touch.mjs','exit',300],
  ['địa hình & đường đi','gate_terrain.mjs','exit',300],
  ['văn minh & binh chủng','gate_civ.mjs','exit',300],
  ['P2P hai máy','gate_p2p.mjs','exit',240],
  ['màn hình menu mọi cỡ máy','audit_screens.mjs','exit',300],
  ['lương thảo & đại quân','gate_supply.mjs','exit',300],
  ['quân nhu · lò rèn · xu (như người chơi)','gate_gear.mjs','exit',480],
  ['chiến dịch 10 ải · lưu ván 1v1 · mức khó Quần Hùng (như người chơi)','gate_camp.mjs','exit',600],
  ['độ khó tăng thật theo ải + chống "đánh thẳng vào trại" (bot đánh 60 ván)','gate_ramp.mjs','exit',1200],
  ['tách binh chủng · tách quân · cứu trại · hiệu lệnh bắt dính (như người chơi)','gate_mix.mjs','exit',600],
  ['hướng dẫn lần đầu (khoá thao tác) · trang trí trại · ẩn Art pack (như người chơi)','gate_tut.mjs','exit',900],
  ['chinh phạt: bộ lạc → nội chiến → đại chiến · lãnh thổ · lưu ván (như người chơi)','gate_conq.mjs','exit',600],
  ['bộ art được dùng hết','gate_art.mjs','exit',300],
  ['nâng cấp từ v4.2 (ván lưu cũ)','gate_upgrade.mjs','exit',300],
  ['chạm ngẫu nhiên (khỉ)','gate_monkey.mjs','exit',600],
  ['mượt & đỡ pin (nhịp khung hình, ô bản đồ)','gate_smooth.mjs','exit',420,0,1],   // đo nhịp vẽ → chạy riêng
  ['hiệu năng máy yếu','gate_perf.mjs','exit',900,0,1],            // phần tử thứ 6 = chạy RIÊNG một mình (đo thời gian, không để nhóm khác tranh CPU)
  ['bot đánh 10 ải','gate_bot.mjs','exit',900,1,1],
  ['ngâm Quần Hùng','gate_soak.mjs','exit',900,1,1],
  ...['handplay','touchdrag','touchpinch','selectarmy','edgecorner','boxselect','camera_maps','capital','territory','rally','rally_refill','afterbattle','afterbattle_ui','saveload','bigmap','royale_ai','royale_ally','boss10','supplycap','p2pui','frame','en_tour'].map(n=>['khói · '+n,n+'.mjs','smoke',n==='camera_maps'?900:240,n==='camera_maps'?1:0]),
].filter(t=>exists(t[1])&&!(FAST&&t[4])&&(!ONLY.length||ONLY.some(o=>t[1].includes(o))));
const run=(t)=>new Promise(res=>{ const t0=Date.now(); let out=''; const ch=spawn('node',['test/'+t[1]],{cwd:ROOT,env:Object.assign({},process.env,{NODE_OPTIONS:((process.env.NODE_OPTIONS||'')+' --import '+ROOT+'/test/_preload.mjs').trim()})});   /* (5.5) mọi bài thử: coi như đã học hướng dẫn lần đầu (trừ gate_tut) */
  ch.stdout.on('data',d=>out+=d); ch.stderr.on('data',d=>out+=d);
  const kill=setTimeout(()=>{ out+='\n[QUÁ GIỜ '+t[3]+'s]'; ch.kill('SIGKILL'); },t[3]*1000);
  ch.on('close',code=>{ clearTimeout(kill); let bad='';
    if(/QUÁ GIỜ/.test(out)) bad='quá giờ';
    else if(t[2]==='rules'){ const f=(out.match(/^FAIL .*/gm)||[]); const p=(out.match(/^PASS /gm)||[]).length; if(f.length||!p||code) bad=f.length? f.length+' FAIL: '+f[0] : 'không chạy được'; else out=`${p} PASS`; }
    else if(t[2]==='exit'){ if(code) bad=(out.match(/✗ .*/g)||['mã thoát '+code]).slice(0,6).join(' | '); }
    else { const m=out.match(/(?:errors?\s*(?:H|G)?\s*\[[^\]]+\]|TypeError[^\n]*|ReferenceError[^\n]*|Error: [^\n]*|Timeout[^\n]*exceeded)/); if(code||m) bad=m? m[0].slice(0,160) : 'mã thoát '+code; }
    res({t,bad,sec:((Date.now()-t0)/1000).toFixed(0),last:out.trim().split('\n').slice(-1)[0].slice(0,110)}); }); });
// 3) Máy thử chỉ có 2 nhân CPU: chặng 1 chạy các nhóm giao diện 2 luồng song song; chặng 2 chạy RIÊNG từng nhóm nặng CPU / đo thời gian.
//    Nhóm nào trượt ở chặng 1 được chạy lại MỘT lần khi máy rảnh: đạt thì coi là trượt do máy bận (vẫn ghi lại để soi), trượt nữa mới chặn phát hành.
const say=(t,r)=>console.log(`${r.bad?'✗':'✓'} ${t[0]} (${r.sec}s)${r.bad? ' — '+r.bad : t[2]==='smoke'?'':' — '+r.last}`);
const q=LIST.filter(t=>!t[5]), R=[], again=[]; await Promise.all(Array.from({length:2},async()=>{ while(q.length){ const t=q.shift(); const r=await run(t); if(r.bad){ again.push([t,r]); console.log(`… ${t[0]} (${r.sec}s) trượt khi chạy song song — sẽ chạy lại riêng: ${r.bad.slice(0,150)}`); } else { R.push(r); say(t,r); } } }));
const flaky=[]; for(const [t,r0] of again){ const r=await run(t); R.push(r); say(t,r); if(!r.bad) flaky.push(`${t[0]}: ${r0.bad.slice(0,110)}`); }
for(const t of LIST.filter(t=>t[5])){ let r=await run(t); if(r.bad&&t[2]==='exit'&&/perf/.test(t[1])){ console.log(`  (đo lại ${t[0]} một lần nữa: ${r.bad.slice(0,120)})`); r=await run(t); } R.push(r); say(t,r); }
if(flaky.length) console.log('\nTrượt khi máy bận nhưng ĐẠT khi chạy riêng (nên làm bài thử bớt phụ thuộc thời gian):\n  · '+flaky.join('\n  · '));
const bad=R.filter(r=>r.bad);
console.log(`\nCỔNG PHÁT HÀNH: ${R.length-bad.length}/${R.length} nhóm đạt${bad.length? ' — CHẶN PHÁT HÀNH: '+bad.map(r=>r.t[0]).join(', ') : ' — ĐƯỢC PHÉP PHÁT HÀNH'}`);
process.exit(bad.length?1:0);
