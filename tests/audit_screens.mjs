// AUDIT CÁC MÀN HÌNH MENU (HTML): menu chính, chọn chế độ, chọn nước, hướng dẫn, kho quân nhu, lò rèn, P2P, tạm dừng, hộp hỏi lại, kết quả —
// trên nhiều cỡ máy ngang/dọc + tai thỏ. Báo: nút nằm ngoài màn hình (mà không cuộn tới được), nút đè nhau, nút quá nhỏ, chữ trong nút bị cắt.
import { launch, ok, finish, URL } from './lib.mjs';
const VP=[[568,320],[640,360],[780,360],[915,412],[320,568],[360,640],[412,915],[1024,768]];
const INS=[['không viền',0,0,0,0],['tai thỏ trái',0,47,0,21],['thanh trạng thái',50,0,0,0]];
const SCREENS=[
  ['menu chính', ()=>{ showScreen('menu'); }, '#menu'],
  ['chọn chế độ', ()=>{ showScreen('menu'); document.getElementById('bBW').click(); }, '#bossPick'],
  ['chọn chế độ (có ván lưu)', ()=>{ G.bwCfg={royale:36,seed:5,civ:'rome'}; startBigWar(5); __ltm.bw.time=900; stopBigWar(true); document.getElementById('bBW').click(); }, '#bossPick'],
  ['chọn nước', ()=>{ document.getElementById('bossPick').classList.add('hidden'); CivPick.open({stageMax:7,stage:7,onPick(){},onBack(){}}); }, '#civPick'],
  ['hướng dẫn', ()=>{ CivPick.close(); showScreen('help'); }, '#help'],
  ['kho quân nhu (đủ món, đã xếp 3)', ()=>{ save.xu=12345; save.inv={bun:99,tea:7,plank:1,smoke:0,scarecrow:12,compass:3,bandage:99}; save.pack=['bun','scarecrow','bandage']; openGear(); }, '#gear'],
  ['lò rèn (đang rèn dở)', ()=>{ save.up={speed:5,power:2,armor:0,stamina:3,aura:1,weapon:4}; openForge(); }, '#forge'],
  ['P2P bước 1', ()=>{ P2P.open(); }, '#p2p'],
  ['P2P bước 2', ()=>{ document.getElementById('p2pStep1').classList.add('hidden'); document.getElementById('p2pStep2').classList.remove('hidden'); document.getElementById('p2pMsg').textContent='Step 1: copy the INVITE CODE and send it to your friend → Step 2: paste their REPLY CODE below and tap Connect.'; }, '#p2p'],
  ['tạm dừng', ()=>{ showScreen(null); G.bwCfg={map:2,civ:'rome'}; startBigWar(2); __ltm.bw.intro=null; pause(true); }, '#pause'],
  ['hộp hỏi lại', ()=>{ pause(false); ask('Start a NEW Warlords game?','Your saved game (31 nations left, 128 min played) will be erased when the new game starts.','🌏 New game',()=>{}); }, '#ask'],
  ['kết quả thắng', ()=>{ document.getElementById('ask').classList.add('hidden'); G.paused=false; const bw=__ltm.bw; bw.over=true; bw.result={win:true}; bw.stats={eat:12345,win:57,lose:23,peak:45678}; showBwResult(); }, '#result'],
  ['kết quả thua (Quần Hùng)', ()=>{ document.getElementById('result').classList.add('hidden'); G.bwCfg={royale:36,seed:5,civ:'poland'}; startBigWar(5); const bw=__ltm.bw; bw.intro=null; bw.over=true; bw.result={win:false}; showBwResult(); }, '#result'],
  ['tướng lĩnh (đủ 8, 2 ô)', ()=>{ ['result','gear','forge'].forEach(i=>document.getElementById(i).classList.add('hidden')); save.xu=9999; save.gen={own:{vanguard:40,medic:7,ranger:0,guide:13},on:['vanguard','medic'],slot2:1}; showScreen('gens'); renderGens(); }, '#gens'],
  ['thử thách ngày/tuần', ()=>{ document.getElementById('gens').classList.add('hidden'); Chal.open(); }, '#chalScr'],
  ['thành tựu (có danh hiệu)', ()=>{ document.getElementById('chalScr').classList.add('hidden'); save.ach={done:{c1:1,c10:1,q3:1,w5000:1},title:'War Sage'}; Ach.open(); }, '#achScr'],
  ['sử ký 44 nước', ()=>{ document.getElementById('achScr').classList.add('hidden'); save.chron={rome:{asc:3,t:4000},japan:{asc:0}}; Chronicle.open(); }, '#chron'],
  ['chinh phạt (có ★)', ()=>{ document.getElementById('chron').classList.add('hidden'); save.conq={civ:'rome',diff:1,stage:3,best:{tribe:300}}; save.chronDone=1; save.ascMax=2; Conquest.open(); }, '#conquest'],
];
const b=await launch(); let combos=0; const agg={};
const jobs=[]; for(const [w,h] of VP) for(const ins of INS){ if(h>w&&ins[0]==='tai thỏ trái') continue; if(w>h&&ins[0]==='thanh trạng thái') continue; jobs.push([w,h,ins]); }
const run=async([w,h,[inn,it,il,ir,ib]])=>{ const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL); await p.waitForFunction(()=>window.__ltm); await p.waitForTimeout(400);
  await p.evaluate(([t,l,r,bm])=>{ const s=document.documentElement.style; s.setProperty('--safe-t',t+'px'); s.setProperty('--safe-l',l+'px'); s.setProperty('--safe-r',r+'px'); s.setProperty('--safe-b',bm+'px'); localStorage.removeItem('ltm_royale_save_v1'); },[it,il,ir,ib]);
  for(const [name,setup,root] of SCREENS){ await p.evaluate(setup); await p.waitForTimeout(260);
    const probs=await p.evaluate(([root,it,il,ir,ib])=>{ const R=document.querySelector(root), vw=innerWidth, vh=innerHeight, out=[]; if(!R||R.classList.contains('hidden')) return ['màn hình không hiện'];
      const vis=(e)=>{ const cs=getComputedStyle(e), r=e.getBoundingClientRect(); return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0&&!e.closest('.hidden'); };
      const lab=(e)=>'['+(e.id||e.textContent.trim().slice(0,18)||e.tagName)+']';
      const scroller=(e)=>{ for(let q=e.parentElement;q&&q!==document.body;q=q.parentElement){ const cs=getComputedStyle(q); if(/(auto|scroll)/.test(cs.overflowY+cs.overflowX)&&(q.scrollHeight>q.clientHeight+2||q.scrollWidth>q.clientWidth+2)) return q; } return null; };
      const els=[...R.querySelectorAll('button,input,textarea')].filter(vis); const fixed=[];
      for(const e of els){ const r=e.getBoundingClientRect(), sc=scroller(e);
        if(!sc){ fixed.push([e,r]); if(r.left<-1||r.top<-1||r.right>vw+1||r.bottom>vh+1) out.push(lab(e)+' nằm NGOÀI màn hình'); else if(r.left<il-1||r.top<it-1||r.right>vw-ir+1||r.bottom>vh-ib+1) out.push(lab(e)+' lấn vùng tai thỏ'); }
        else { const s=sc.getBoundingClientRect(); if(s.left<-1||s.top<-1||s.right>vw+1||s.bottom>vh+1) out.push('khung cuộn chứa '+lab(e)+' tràn màn hình'); const vert=sc.scrollHeight>sc.clientHeight+2; if(s.height<(vert?56:34)) out.push('khung cuộn chứa '+lab(e)+' chỉ cao '+Math.round(s.height)+'px'); }  // dải thẻ cuộn ngang chỉ cần đủ cao để chạm
        if(e.tagName==='BUTTON'){ if(r.width<34||r.height<30) out.push(lab(e)+' quá nhỏ ('+Math.round(r.width)+'×'+Math.round(r.height)+')'); if(e.scrollWidth>e.clientWidth+4) out.push(lab(e)+' chữ bị cắt'); } }
      // nút có bị thứ khác (băng "xoay ngang", thông báo nổi, số phiên bản...) đè lên không: người chơi chạm vào giữa nút phải trúng nút
      for(const [e,r] of fixed){ if(r.left<-1||r.top<-1||r.right>vw+1||r.bottom>vh+1) continue; for(const [fx,fy] of [[0.5,0.5],[0.25,0.5],[0.75,0.5],[0.5,0.8]]){ const top=document.elementFromPoint(r.left+r.width*fx,r.top+r.height*fy);
          if(top&&top!==e&&!e.contains(top)&&!top.contains(e)){ out.push(lab(e)+' bị '+lab(top)+' che'); break; } } }
      for(let i=0;i<fixed.length;i++) for(let j=i+1;j<fixed.length;j++){ const a=fixed[i][1], c=fixed[j][1]; if(fixed[i][0].contains(fixed[j][0])||fixed[j][0].contains(fixed[i][0])) continue; if(a.left<c.right-2&&c.left<a.right-2&&a.top<c.bottom-2&&c.top<a.bottom-2) out.push(lab(fixed[i][0])+' ĐÈ '+lab(fixed[j][0])); }
      // (5.2) phần KHÔNG phải nút cũng phải thấy được: logo, tiêu đề, dòng mô tả, thanh xu — không tràn màn hình, không bị băng "xoay ngang" hay thứ khác che
      for(const e of [...R.querySelectorAll('.logo,h1,h2,.sub,.coinbar,#rStats,#forgeStats,.note')].filter(vis)){ if(scroller(e)) continue; const r=e.getBoundingClientRect();
        if(r.left<-1||r.top<-1||r.right>vw+1||r.bottom>vh+1) out.push(lab(e)+' (chữ/hình, không phải nút) tràn khỏi màn hình '+Math.round(Math.max(-r.top,r.bottom-vh,-r.left,r.right-vw))+'px');
        else { const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height*0.5); if(top&&top!==e&&!e.contains(top)&&!top.contains(e)&&top.id==='rotate') out.push(lab(e)+' bị băng "xoay ngang" che'); } }
      const card=R.querySelector('.card'); if(card){ const r=card.getBoundingClientRect(); if(r.left<-1||r.top<-1||r.right>vw+1||r.bottom>vh+1) out.push('khung nội dung tràn màn hình ('+Math.round(r.width)+'×'+Math.round(r.height)+')'); }
      return [...new Set(out)]; },[root,it,il,ir,ib]);
    combos++; for(const pr of probs){ const k=name+': '+pr; (agg[k]=agg[k]||[]).push(`${w}×${h}${inn==='không viền'?'':' '+inn}`); } }
  if(errs.length) (agg['lỗi JS: '+errs[0]]=agg['lỗi JS: '+errs[0]]||[]).push(`${w}×${h}`);
  await ctx.close(); };
const q=jobs.slice(); await Promise.all(Array.from({length:4},async()=>{ while(q.length) await run(q.shift()); }));
const keys=Object.keys(agg); console.log(`MÀN HÌNH MENU: ${combos} màn hình × cỡ máy đã soi — ${keys.length? keys.length+' loại lỗi':'tất cả đạt'}`);
for(const k of keys.sort((a,b2)=>agg[b2].length-agg[a].length).slice(0,40)) console.log(`  ✗ ${k} — ${agg[k].length} máy (vd: ${[...new Set(agg[k])].slice(0,3).join('; ')})`);
ok(keys.length===0,'mọi màn hình menu gọn trong màn hình trên mọi cỡ máy');
await finish('MÀN HÌNH MENU',b);
