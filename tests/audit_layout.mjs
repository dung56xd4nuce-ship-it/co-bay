// AUDIT BỐ CỤC — nhìn như người chơi: mọi phần tử HUD + mọi dòng chữ vẽ ra, trên nhiều cỡ máy / ngang-dọc /
// vùng tai thỏ-thanh trạng thái (safe-area), ở 10 trạng thái chơi (thông báo dồn dập, menu gọi quân + rút lui, menu lệnh ở 4 góc, dòng hướng dẫn, túi quân nhu).
// Báo: phần tử đè nhau · tràn khỏi màn hình · lấn vùng tai thỏ · nút quá nhỏ để chạm · CHỮ tràn khỏi khung/màn hình · chữ quá nhỏ.
// Cách chạy: node test/audit_layout.mjs [url] [--shots]
import { chromium } from 'playwright';
const URL=process.argv.find(a=>a.startsWith('http'))||'http://localhost:8766/index.html';
const SHOTS=process.argv.includes('--shots');
const VP=[ ['iPhone SE đời đầu ngang',568,320],['điện thoại nhỏ ngang',640,360],['iPhone SE ngang',667,375],['Android 780 ngang',780,360],['iPhone 14 ngang',852,393],['Pixel 7 ngang',915,412],
  ['điện thoại rất hẹp dọc',320,568],['điện thoại nhỏ dọc',360,640],['iPhone 14 dọc',393,852],['Pixel 7 dọc',412,915],['máy tính bảng ngang',1024,768],['máy tính bảng dọc',768,1024] ];
// [tên, top, left, right, bottom]
const INS=[ ['không viền',0,0,0,0], ['tai thỏ trái',0,47,0,21], ['tai thỏ phải',0,0,47,21], ['thanh trạng thái + tai thỏ (như máy bạn)',50,50,0,0] ];
const ONLY=(process.argv.find(a=>a.startsWith('--only='))||'').slice(7);
const jobs=[];
for(const [vn,w,h] of VP) for(const [inn,it,il,ir,ib] of INS) for(const mode of ['royale','1v1']){
  const portrait=h>w; if(portrait&&/tai thỏ (trái|phải)/.test(inn)) continue;
  if(ONLY&&!(`${w}x${h}`).includes(ONLY)) continue;
  jobs.push({vn,w,h,inn,it,il,ir,ib,mode,portrait}); }
const b=await chromium.launch(); const fails={}; let combos=0, checks=0;

async function run(J){ const {vn,w,h,inn,it,il,ir,ib,mode,portrait}=J;
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(600);
  const st=portrait? (it?44:0):it, sl=portrait?0:il, sr=portrait?0:ir, sb=(portrait&&it)?34:ib;
  await p.evaluate(([st,sl,sr,sb])=>{ const s=document.documentElement.style;
    s.setProperty('--safe-t',st+'px'); s.setProperty('--safe-l',sl+'px'); s.setProperty('--safe-r',sr+'px'); s.setProperty('--safe-b',sb+'px');
    // ghi lại mọi dòng chữ HUD vẽ ra (vị trí thật trên màn hình) để soi chữ tràn
    // + ghi mọi khung bo góc theo đúng THỨ TỰ VẼ: khung chứa một dòng chữ = khung vẽ gần nhất trước nó mà bao lấy tâm chữ
    const P=CanvasRenderingContext2D.prototype, ft=P.fillText, rrP=P.roundRect; window.__texts=[]; window.__boxes=[]; window.__seq=0;
    const K=(c)=>c.canvas.width/c.canvas.getBoundingClientRect().width;
    const box=(c,x,y,w,h)=>{ if(!window.__rec) return; const tr=c.getTransform(), k=K(c); window.__boxes.push({seq:window.__seq++,x:(x*tr.a+tr.e)/k,y:(y*tr.d+tr.f)/k,w:w*tr.a/k,h:h*tr.d/k}); };
    const rr0=window.rr; window.rr=function(c,x,y,w,h,r){ box(c,x,y,w,h); return rr0.apply(this,arguments); };
    P.roundRect=function(x,y,w,h,r){ box(this,x,y,w,h); return rrP.apply(this,arguments); };
    P.fillText=function(t,x,y,mw){ if(window.__rec){ const m=this.measureText(t), tr=this.getTransform(), k=K(this);
        const al=this.textAlign, x0= al==='center'? x-m.width/2 : (al==='right'||al==='end')? x-m.width : x;
        const fs=parseFloat((this.font.match(/(\d+(?:\.\d+)?)px/)||[0,0])[1]);
        window.__texts.push({seq:window.__seq++,t:String(t), x:(x0*tr.a+tr.e)/k, y:((y-m.actualBoundingBoxAscent)*tr.d+tr.f)/k, w:m.width*tr.a/k, h:(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent)*tr.d/k, cy:(y*tr.d+tr.f)/k, fs:fs*tr.a/k}); }
      return ft.apply(this,arguments); }; },[st,sl,sr,sb]);
  await p.evaluate((mode)=>{ G.bwCfg= mode==='royale'? {royale:36,seed:91,map:2} : {map:3}; startBigWar(mode==='royale'?5:3); const bw=__ltm.bw; bw.intro=null;
    const dh=bw.drawHud.bind(bw); bw.drawHud=(...a)=>{ window.__texts=[]; window.__boxes=[]; window.__seq=0; window.__rec=true; try{ dh(...a); } finally{ window.__rec=false; } };
    bw.aiTurn=()=>{}; bw.nextAI=1e9; bw.update=()=>{}; bw.time=60; },mode);   // đứng hình thế trận để soi bố cục
  await p.waitForTimeout(500);
  const X0=sl, Y0=st, X1=w-sr, Y1=h-sb;
  const STATES={
    'thông báo dồn dập + mai phục + phóng to': ()=>{ const bw=__ltm.bw; bw.notes=[]; bw.hudSeen=performance.now()+1e7; bw.menu=null; bw.rallyOpen=false; bw.rallyPick=0; bw.focusB=null;
      const cap=bw.nodes.find(n=>n.camp&&n.owner===0); const n=bw.nodes.find(x=>x.owner===0&&!x.camp)||bw.nodes.find(x=>!x.camp); n.owner=0; n.count=500; n.ter='forest'; bw.sel=n; bw.selA=null; bw.selG=null;
      bw.note('⚠️ The realm fears your might — nations are forming an ALLIANCE AGAINST YOU!',cap.x,cap.y,'⚠️');
      bw.note('📣 Calling 10 nearest camps to rally · 7 ranches/training grounds sent troops to garrison',cap.x,cap.y,'📣');
      bw.note('🏳️ Overstretched 23456/20000 — granaries empty, 345 troops deserted!',cap.x,cap.y,'🏳️');
      bw.note('🏆 Victory!',cap.x,cap.y,'🏆');
      bw.zoom=bw.zoomTgt=1.5; bw.camX=cap.x-100; bw.camY=Math.max(0,cap.y-100); },
    'menu gọi quân + nút rút lui': ()=>{ const bw=__ltm.bw; bw.sel=null; bw.rallyOpen=true; bw.zoom=bw.zoomTgt=2.6;
      const cap=bw.nodes.find(n=>n.camp&&n.owner===0); const mine={owner:0,count:3000}; const B={id:777,x:cap.x+200,y:cap.y+60,done:false,A:{fid:0,es:[{kind:'army',ref:mine}]},B:{fid:1,es:[]}};
      bw.battleOf=(id)=>id===777?B:null; bw.focusB=777; bw.camX=cap.x-100; bw.camY=Math.max(0,cap.y-100); },
    'menu lệnh 5 dòng ở góc phải-dưới': ()=>{ const bw=__ltm.bw; bw.rallyOpen=false; bw.focusB=null; bw.zoom=bw.zoomTgt=1; bw.notes=[]; const sc=bw.scale*bw.zoom;
      bw.menu={wx:bw.camX+(bw.lastVw-4)/sc,wy:bw.camY+(bw.lastVh-4)/sc,opts:[{id:'ally',s:'🤝 Propose alliance'},{id:'attack',s:'⚔️ Attack'},{id:'siege',s:'⛓️ Siege (cut supply)'},{id:'scout',s:'🕵️ Scout'},{id:'cancel',s:'✖ Cancel'}]}; },
    'menu lệnh chữ dài ở góc trái-trên': ()=>{ const bw=__ltm.bw;
      bw.menu={wx:bw.camX+2,wy:bw.camY+2,opts:[{id:'move',s:'🛡️ Send troops here (merge/garrison) now'},{id:'cancel',s:'✖ Cancel'}]}; },
    'chọn điểm tập kết': ()=>{ const bw=__ltm.bw; bw.menu=null; bw.rallyPick=Infinity; },
    'dòng hướng dẫn đầu trận': ()=>{ const bw=__ltm.bw; bw.rallyPick=0; bw.time=2; bw.sel=null; },
    'thẻ binh chủng: đại quân kỵ binh trên núi': ()=>{ const bw=__ltm.bw; bw.time=60; bw.menu=null; bw.sel=null; bw.selG=null; const cap=bw.nodes.find(n=>n.camp&&n.owner===0);
      const a={id:99001,owner:0,type:'cavalry',count:123456,x:cap.x+80,y:cap.y+40,ter:'mountain',to:-1,trail:[],food:100}; bw.armies.push(a); bw.selA=a; },
    'thẻ binh chủng: gom 4 đạo quân khác loại': ()=>{ const bw=__ltm.bw; const cap=bw.nodes.find(n=>n.camp&&n.owner===0); const G4=['swordsman','crossbow','assassin','shield'].map((t,i)=>({id:99010+i,owner:0,type:t,count:23456+i*1111,x:cap.x+60+i*40,y:cap.y+90,to:-1,trail:[],food:100}));
      bw.armies=bw.armies.filter(a=>a.id!==99001).concat(G4); bw.selA=G4[0]; bw.selG=G4; },
    // (5.2) 🎒 túi quân nhu: bảng món mở cạnh / phía trên nút, trong lúc thẻ binh chủng đang hiện
    'túi quân nhu mở: 3 món tên dài, một món đang hồi': ()=>{ const bw=__ltm.bw; bw.rallyOpen=false; bw.rallyPick=0; bw.menu=null; bw.gear=[{id:'scarecrow',cd:0},{id:'bandage',cd:187},{id:'plank',cd:0}]; bw.gearApi={stock:()=>88}; bw.gearOpen=true; },
    'túi quân nhu mở: chưa mang món nào': ()=>{ const bw=__ltm.bw; bw.gear=[]; bw.gearOpen=true; },
  };
  for(const [sn,fn] of Object.entries(STATES)){
    await p.evaluate(fn); await p.waitForTimeout(260);
    const R=await p.evaluate(()=>{ const bw=__ltm.bw; return {R:bw.hudRects(),T:window.__texts.slice(),B:window.__boxes.slice(),vw:bw.lastVw,vh:bw.lastVh}; });
    const names=Object.keys(R.R), probs=[]; checks++;
    const ov=(a,c)=>a.x<c.x+c.w-1&&c.x<a.x+a.w-1&&a.y<c.y+c.h-1&&c.y<a.y+a.h-1;
    const menus=/^menu /;
    for(let i=0;i<names.length;i++){ const nm=names[i], a=R.R[nm]; const band=/băng/.test(nm);
      const off=a.x<-0.5||a.y<-0.5||a.x+a.w>R.vw+0.5||a.y+a.h>R.vh+0.5;
      if(off) probs.push(nm+' TRÀN khỏi màn hình');
      else if(!band&&(a.x<X0-0.5||a.y<Y0-0.5||a.x+a.w>X1+0.5||a.y+a.h>Y1+0.5)) probs.push(nm+' lấn vùng tai thỏ/thanh trạng thái');
      if(/^nút/.test(nm)&&nm!=='nút 🏠↻⏸'&&(a.w<40||a.h<36)) probs.push(nm+' quá nhỏ để chạm ('+Math.round(a.w)+'×'+Math.round(a.h)+')');
      for(let j=i+1;j<names.length;j++){ const nm2=names[j], c=R.R[nm2];
        // menu bật lên vẽ SAU CÙNG trên canvas và là hộp chọn "chặn" (chạm ra ngoài là đóng) nên được phép phủ các ô canvas khác;
        // thứ KHÔNG được phép: bị nút HTML (cụm 🏠↻⏸, băng xoay ngang) che mất, vì HTML luôn nằm trên canvas
        if((menus.test(nm)||menus.test(nm2))&&!/🏠|băng/.test(nm+nm2)) continue;
        if(ov(a,c)) probs.push(nm+' ĐÈ '+nm2); } }
    // chữ: không tràn màn hình, không tràn khỏi khung chứa nó, không nhỏ quá
    for(const t of R.T){ if(!t.t.trim()||t.w<1) continue; const lab='chữ "'+(t.t.length>26? t.t.slice(0,25)+'…':t.t)+'"';
      if(t.x<X0-1||t.x+t.w>X1+1||t.y<Y0-1||t.y+t.h>Y1+1) probs.push(lab+' tràn màn hình/vùng tai thỏ');
      if(t.fs&&t.fs<10.5&&/[A-Za-z0-9]/.test(t.t)) probs.push(lab+' quá nhỏ ('+t.fs.toFixed(0)+'px)');
      let best=null; const mx=t.x+t.w/2, my=t.cy-3; // khung chứa = khung bo góc vẽ gần nhất TRƯỚC dòng chữ mà bao lấy tâm chữ
      for(const r of R.B){ if(r.seq>t.seq) break; if(r.h<16) continue; if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) best=r; }
      if(best&&(t.x<best.x+2||t.x+t.w>best.x+best.w-2)) probs.push(lab+' tràn khỏi khung của nó'); }
    if(errs.length) probs.push('lỗi JS: '+errs[0]);
    if(probs.length){ fails[`${vn} ${w}×${h} · ${inn} · ${mode} · ${sn}`]=[...new Set(probs)]; }
    if(SHOTS&&(probs.length||(mode==='royale'&&inn!=='không viền'&&!/tai thỏ trái/.test(inn)))) await p.screenshot({path:`/tmp/layout_${w}x${h}_${it}_${il}_${ir}_${mode}_${Object.keys(STATES).indexOf(sn)}.png`});
  }
  combos++; await ctx.close(); }
// chạy 4 trang song song
const q=jobs.slice(); await Promise.all(Array.from({length:4},async()=>{ while(q.length){ await run(q.shift()); } }));
const nf=Object.keys(fails).length;
console.log(`BỐ CỤC: ${combos} tổ hợp máy × viền × chế độ, ${checks} màn hình soi — ${nf? nf+' màn hình CÓ LỖI':'tất cả đạt'}`);
const agg={}; for(const [k,v] of Object.entries(fails)) for(const pr of v){ (agg[pr]=agg[pr]||[]).push(k.split(' · ')[0]+(k.includes('như máy bạn')?'*':'')+' · '+k.split(' · ')[3]); }
for(const [pr,ks] of Object.entries(agg).sort((a,b)=>b[1].length-a[1].length).slice(0,40)) console.log(`  ✗ ${pr} — ${ks.length} lần (vd: ${[...new Set(ks)].slice(0,2).join('; ')})`);
await b.close(); process.exit(nf?1:0);
