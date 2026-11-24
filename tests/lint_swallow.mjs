// SOÁT MÃ BỊ "NUỐT" VÀO CHÚ THÍCH: so mã nguồn hiện tại với bản đã phát hành gần nhất (repo co-bay/ltm-src);
// dòng nào mới sửa mà phần chú thích "// …" lại chứa nguyên câu lệnh của bản cũ → câu lệnh đó đã bị vô hiệu hoá do chèn chú thích giữa dòng.
// (Lỗi thật ở 5.2: chèn "// 🪙 …" giữa dòng trong startBigWar làm mất 6 câu lệnh đặt lại trạng thái trận.)
// Kèm theo: mọi tệp mã phải qua được trình phân tích cú pháp của Node.
import fs from 'fs'; import { execFileSync } from 'child_process';
const OLD='/home/claude/co-bay/ltm-src/src', NEW=new URL('../src/',import.meta.url).pathname;
let pass=0, fail=0; const ok=(c,m)=>{ if(c){ pass++; } else { fail++; console.log('  ✗ FAIL '+m); } };
// tách một dòng thành [mã, chú thích //] — bỏ qua "//" nằm trong chuỗi '…' "…" `…` và trong /* … */
function split(l){ let q=null; for(let i=0;i<l.length;i++){ const ch=l[i];
    if(q){ if(ch==='\\'){ i++; continue; } if(ch===q) q=null; }
    else if(ch==="'"||ch==='"'||ch==='`') q=ch;
    else if(ch==='/'&&l[i+1]==='/') return [l.slice(0,i),l.slice(i+2)];
    else if(ch==='/'&&l[i+1]==='*'){ const j=l.indexOf('*/',i+2); if(j<0) return [l.slice(0,i),'']; i=j+1; } }
  return [l,'']; }
const files=fs.readdirSync(NEW).filter(f=>f.endsWith('.js')&&f!=='05a0_art_inline.js').sort(); let checked=0, base=0; const hits=[];
for(const f of files){ const cur=fs.readFileSync(NEW+f,'utf8').split('\n');
  if(!fs.existsSync(OLD+'/'+f)) continue; base++;
  const old=fs.readFileSync(OLD+'/'+f,'utf8').split('\n'), oldSet=new Set(old);
  // câu lệnh của bản cũ (cắt theo dấu ;), chỉ lấy câu đủ dài để không bắt nhầm chữ thường
  const stm=new Set(); for(const l of old){ const [c]=split(l); for(const x of c.split(';')){ const t=x.trim(); if(t.length>14&&/[=(]/.test(t)) stm.add(t); } }
  for(let i=0;i<cur.length;i++){ const l=cur[i]; if(oldSet.has(l)) continue; checked++; const [c,t]=split(l); if(!t.trim()||!c.trim()) continue;
    for(const x of t.split(';')){ const s=x.trim(); if(s.length>14&&stm.has(s)){ hits.push(`${f}:${i+1}: "${s.slice(0,80)}"`); break; } } } }
ok(base>=10,`có bản đã phát hành để đối chiếu (${base} tệp trong ${OLD})`);
ok(hits.length===0,`không câu lệnh nào của bản cũ bị rơi vào chú thích "//" (soát ${checked} dòng mới sửa)`+(hits.length? ' — '+hits.slice(0,5).join(' | ') : ''));
// cú pháp: ghép như build rồi cho Node kiểm (không chạy)
{ const js=fs.readdirSync(NEW).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(NEW+f,'utf8')).join('\n'); fs.writeFileSync('/tmp/_ltm_syntax.js',js);
  let err=''; try{ execFileSync(process.execPath,['--check','/tmp/_ltm_syntax.js'],{stdio:'pipe'}); }catch(e){ err=String(e.stderr||e.message).split('\n').slice(0,4).join(' '); }
  ok(!err,'toàn bộ mã ghép lại đúng cú pháp'+(err? ': '+err : '')); }
console.log(`${fail?'✗':'✓'} SOÁT MÃ BỊ NUỐT VÀO CHÚ THÍCH: ${pass} đạt, ${fail} lỗi`); process.exit(fail?1:0);
