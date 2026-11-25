// ============ Bộ art: danh mục mã, nạp ảnh, xử lý nền, đổi màu phe ============
// Mỗi mục có MÃ dùng trong bộ lệnh ChatGPT (xem LENH_CHATGPT.md). Đặt tên file theo mã, ví dụ "U04.png" hoặc "U04_archer.png".
const ART_LIST = [
  // Nhân vật — áo/khăn màu xanh dương #3b82f6, game tự đổi sang màu từng phe
  ['U01','unit:general','units/general.png','unit','General'],
  ['U02','unit:scout','units/scout.png','unit','Scout'],
  ['U03','unit:assassin','units/assassin.png','unit','Assassin'],
  ['U04','unit:archer','units/archer.png','unit','Archer'],
  ['U05','unit:swordsman','units/swordsman.png','unit','Swordsman'],
  ['U06','unit:saber','units/saber.png','unit','Blademaster'],
  ['U07','unit:cavalry','units/cavalry.png','unit','Knight'],
  ['U08','unit:spear','units/spear.png','unit','Spearman'],
  ['U09','unit:shield','units/shield.png','unit','Shieldbearer'],
  ['U10','unit:crossbow','units/crossbow.png','unit','Crossbowman'],
  ['U11','unit:medic','units/medic.png','unit','Medic'],
  // Vũ khí tướng (biểu tượng Lò rèn + cầm trên tay tướng)
  ['W00','weapon:0','weapons/w0.png','icon','Village Bamboo Sword'],
  ['W01','weapon:1','weapons/w1.png','icon','Forged Iron Sword'],
  ['W02','weapon:2','weapons/w2.png','icon','Long Spear'],
  ['W03','weapon:3','weapons/w3.png','icon','Green Dragon Blade'],
  ['W04','weapon:4','weapons/w4.png','icon','Sky Halberd'],
  ['W05','weapon:5','weapons/w5.png','icon','Legendary Flip-Flops'],
  // Vật phẩm
  ['I01','item:bun','items/bun.png','icon','Revive Bun'],
  ['I02','item:tea','items/tea.png','icon','Ginger Revive Tea'],
  ['I03','item:plank','items/plank.png','icon','Bridge Plank'],
  ['I04','item:smoke','items/smoke.png','icon','Smoke Pouch'],
  ['I05','item:scarecrow','items/scarecrow.png','icon','Carry-the-Team Scarecrow'],
  ['I06','item:compass','items/compass.png','icon','Troop-Finder Compass'],
  ['I07','item:bandage','items/bandage.png','icon','Armor Patch Kit'],
  // Ô địa hình (vuông, lặp liền mạch)
  ['T01','tile:grass','tiles/grass.png','tile','Grassland'],
  ['T02','tile:road','tiles/road.png','tile','Dirt Road'],
  ['T03','tile:forest','tiles/forest_floor.png','tile','Forest ground'],
  ['T04','tile:reeds','tiles/reeds_floor.png','tile','Reed bed ground'],
  ['T05','tile:hill','tiles/hill.png','tile','Low Hill'],
  ['T06','tile:mud','tiles/mud.png','tile','Mud'],
  ['T07','tile:water','tiles/water.png','tile','Deep River'],
  ['T08','tile:plaza','tiles/plaza.png','tile','Drum stone arena'],
  ['T09','tile:station','tiles/station_floor.png','tile','Depot ground'],
  ['T10','tile:bridge','tiles/bridge.png','tile','Wooden bridge deck'],
  // Đạo cụ trên bản đồ (đứng trên ô, nhìn nghiêng)
  ['P01','prop:tree','props/tree.png','prop','Forest tree'],
  ['P02','prop:tree2','props/tree2.png','prop','Forest tree (variant)'],
  ['P03','prop:reeds','props/reeds.png','prop','Reed bush'],
  ['P04','prop:rock','props/rock.png','prop','Cliff block'],
  ['P05','prop:ruin','props/ruin.png','prop','Ruined wall'],
  ['P06','prop:tent','props/tent.png','prop','Tent (white canvas)'],
  ['P07','prop:station','props/station.png','prop','Supply depot rice sacks & pots'],
  ['P08','drum','props/drum.png','prop','War Drum of Chaos'],
  ['P09','prop:cart','props/cart.png','prop','Supply ox-cart'],
  ['P10','prop:granary','props/granary.png','prop','Granary'],
  ['P11','prop:ranch','props/ranch.png','prop','Ranch'],
  ['P12','prop:trainyard','props/trainyard.png','prop','Training ground'],
  // (5.6) đồ trang trí trại — mua bằng xu ở Armory → Camp decor
  ['DBONSAI','decor:bonsai','decor/bonsai.png','decor','Bonsai pot'],
  ['DLIONS','decor:lions','decor/lion.png','decor','Stone guardian lion'],
  ['DKOI','decor:koipond','decor/koipond.png','decor','Koi pond'],
  ['DCAT','decor:luckycat','decor/luckycat.png','decor','Lucky cat'],
  ['DDRUM','decor:drumtower','decor/drumtower.png','decor','War drum tower'],
  ['DCOIN','decor:coinstatue','decor/coinstatue.png','decor','Meme Coin statue'],
  ['DELEPH','decor:elephant','decor/elephant.png','decor','War elephant statue'],
  ['DDRAGON','decor:dragonstatue','decor/dragonstatue.png','decor','Jade dragon statue'],
  ['DGATE','decor:gate','decor/gate.png','decor','Festival gate'],
  ['DLAMP','decor:stonelamp','decor/stonelamp.png','decor','Stone lantern'],
  ['DSHRINE','decor:shrine','decor/shrine.png','decor','Little shrine'],
  ['DCHEST','decor:treasure','decor/treasure.png','decor','Treasure hoard'],
  ['DPAGODA','decor:pagoda','decor/pagoda.png','decor','Grand pagoda'],
  ['DPHOENIX','decor:phoenix','decor/phoenix.png','decor','Golden phoenix'],
  ['DTOWER','decor:watchtower','decor/watchtower.png','decor','Watch tower'],
  ['DBARREL','decor:barrels','decor/barrels.png','decor','Rice wine barrels'],
  ['DWARRIOR','decor:warrior','decor/warrior.png','decor','Stone warrior statue'],
  // Giao diện
  ['S01','struct:village','struct/village.png','prop','Village'],
  ['S02','struct:fort','struct/fort.png','prop','Small fort'],
  ['S03','struct:citadel','struct/citadel.png','prop','Great citadel'],
  ['S04','ter:forest','ter/forest.png','prop','Tree cluster'],
  ['S05','ter:mountain','ter/mountain.png','prop','Mountain'],
  ['S06','ter:desert','ter/desert.png','prop','Desert dune'],
  ['S07','ter:valley','ter/valley.png','prop','Valley grass'],
  ['S08','ter:bridge','ter/bridge.png','prop','Wooden bridge ford'],
  ['S09','prop:fieldcamp','prop/fieldcamp.png','prop','Field camp tent'],
  ['F01','fx:dust1','fx/dust1.png','prop','Small march dust'],
  ['F02','fx:dust2','fx/dust2.png','prop','Large march dust'],
  ['F03','fx:clash1','fx/clash1.png','prop','Gold impact flash'],
  ['F04','fx:clash2','fx/clash2.png','prop','Red impact flash'],
  ['F05','fx:smokebig','fx/smokebig.png','prop','Battle smoke'],
  ['F06','fx:leaves','fx/leaves.png','prop','Ambush leaves'],
  ['F07','fx:splash','fx/splash.png','prop','River splash'],
  ['F09','fx:swords','fx/swords.png','prop','Crossed swords'],
  ['G01E','ui:logo','ui/logo_en.png','logo','LOAN THE MEME logo'],
  ['G02','ui:menubg','ui/menu_bg.png','bg','Main menu background'],
  ['G03','ui:general','ui/icon_general.png','icon','General button'],
  ['G04','ui:army','ui/icon_army.png','icon','All troops button'],
  ['G05','ui:hold','ui/icon_hold.png','icon','Hold button'],
  ['G06','ui:follow','ui/icon_follow.png','icon','Follow button'],
  ['G07','ui:center','ui/icon_center.png','icon','Back-to-general button'],
  ['G08','ui:pause','ui/icon_pause.png','icon','Pause button'],
  ['G09','ui:sound','ui/icon_sound.png','icon','Sound button'],
  ['G10','ui:speed','ui/icon_speed.png','icon','Speed button'],
  ['G11','ui:forge','ui/icon_forge.png','icon','Forge (anvil & hammer)'],
  ['G12','ui:coin','ui/coin.png','icon','Meme Coin'],
  ['G13','ui:flag','ui/white_flag.png','icon','White flag of surrender'],
  ['G23','ui:bag','ui/icon_bag.png','icon','Supplies backpack'],
  ['G14','up:speed','ui/up_speed.png','icon','Speed upgrade'],
  ['G15','up:power','ui/up_power.png','icon','Power upgrade'],
  ['G16','up:armor','ui/up_armor.png','icon','Armor upgrade'],
  ['G17','up:stamina','ui/up_stamina.png','icon','Stamina upgrade'],
  ['G18','up:aura','ui/up_aura.png','icon','Aura upgrade'],
  ['G19E','ui:win','ui/banner_win_en.png','logo','VICTORY banner'],
  ['G20E','ui:lose','ui/banner_lose_en.png','logo','DEFEAT banner'],
].map(([code,key,file,kind,name])=>({code,key,file,kind,name}));
const ART_BY_KEY = Object.fromEntries(ART_LIST.map(a=>[a.key,a]));
const ArtUrls = {};
const ArtListeners = [];
function onArt(fn){ ArtListeners.push(fn); }
function artChanged(){ SpriteCache.clear(); TintCache.clear(); TINT_GEN++; for(const fn of ArtListeners) try{ fn(); }catch(e){} }

// ---- IndexedDB: ảnh người chơi tự nạp (chỉ trong trình duyệt này)
const ArtDB = {
  db:null,
  open(){ return new Promise((res)=>{ try{ const r=indexedDB.open('ltm_art',1); r.onupgradeneeded=()=>r.result.createObjectStore('a'); r.onsuccess=()=>{ this.db=r.result; res(this.db); }; r.onerror=()=>res(null); }catch(e){ res(null); } }); },
  async all(){ const db=this.db||await this.open(); if(!db) return []; return new Promise((res)=>{ try{ const out=[]; const tx=db.transaction('a','readonly'); const st=tx.objectStore('a'); const rq=st.openCursor(); rq.onsuccess=()=>{ const c=rq.result; if(c){ out.push([c.key,c.value]); c.continue(); } else res(out); }; rq.onerror=()=>res(out); }catch(e){ res([]); } }); },
  async put(k,v){ const db=this.db||await this.open(); if(!db) return; return new Promise((res)=>{ try{ const tx=db.transaction('a','readwrite'); tx.objectStore('a').put(v,k); tx.oncomplete=()=>res(); tx.onerror=()=>res(); }catch(e){ res(); } }); },
  async clear(){ const db=this.db||await this.open(); if(!db) return; return new Promise((res)=>{ try{ const tx=db.transaction('a','readwrite'); tx.objectStore('a').clear(); tx.oncomplete=()=>res(); }catch(e){ res(); } }); },
};
function setArtImage(key,src,fromUser){ return new Promise((res)=>{ const im=new Image(); im.onload=()=>{ if(fromUser || !ArtImages[key]?._user){ im._user=!!fromUser; ArtImages[key]=im; ArtUrls[key]=src; } res(true); }; im.onerror=()=>res(false); im.src=src; }); }
async function loadArt(){
  const base=(window.LTM_ART_BASE||'art/');
  await Promise.all(ART_LIST.map(a=>{ const inl=(typeof ART_INLINE!=='undefined')&&ART_INLINE[a.file]; return inl? setArtImage(a.key, inl, false) : setArtImage(a.key, base+a.file, false); }));
  const saved=await ArtDB.all(); for(const [k,blob] of saved){ if(blob instanceof Blob) await setArtImage(k, URL.createObjectURL(blob), true); }
  artChanged();
}

// ---- Nhận ảnh từ ChatGPT: khớp mã/tên, xoá nền trắng, căn khung
function matchArt(filename){
  const n=filename.toLowerCase(); const m=n.match(/\b([uwitpg])\s*0?(\d{1,2})\b|^([uwitpg])0?(\d{1,2})[_\-. ]/);
  const codeM = n.match(/(^|[^a-z])([uwitpg])(\d{2})(?=[^0-9]|$)/);
  if(codeM){ const code=(codeM[2]+codeM[3]).toUpperCase(); const a=ART_LIST.find(x=>x.code===code); if(a) return a; }
  const base=n.replace(/\.[a-z0-9]+$/,''); return ART_LIST.find(a=>a.file.split('/').pop().replace('.png','')===base) || null;
}
function removeBackground(c,W,H){
  const img=c.getImageData(0,0,W,H), d=img.data;
  // đã có nền trong suốt thì thôi
  let transparentCorners=0; for(const [x,y] of [[0,0],[W-1,0],[0,H-1],[W-1,H-1]]) if(d[(y*W+x)*4+3]<20) transparentCorners++;
  if(transparentCorners>=3) return;
  const bg=[0,0,0]; let n=0; for(const [x,y] of [[2,2],[W-3,2],[2,H-3],[W-3,H-3],[W>>1,2]]){ const i=(y*W+x)*4; bg[0]+=d[i]; bg[1]+=d[i+1]; bg[2]+=d[i+2]; n++; } bg[0]/=n; bg[1]/=n; bg[2]/=n;
  const tol=46*46; const seen=new Uint8Array(W*H); const q=new Int32Array(W*H); let h=0,e=0;
  const push=(p)=>{ if(seen[p]) return; const i=p*4; const dr=d[i]-bg[0], dg=d[i+1]-bg[1], db=d[i+2]-bg[2]; if(dr*dr+dg*dg+db*db>tol) return; seen[p]=1; q[e++]=p; };
  for(let x=0;x<W;x++){ push(x); push((H-1)*W+x); } for(let y=0;y<H;y++){ push(y*W); push(y*W+W-1); }
  while(h<e){ const p=q[h++]; d[p*4+3]=0; const x=p%W, y=(p/W)|0; if(x>0) push(p-1); if(x<W-1) push(p+1); if(y>0) push(p-W); if(y<H-1) push(p+W); }
  // làm mềm mép
  for(let p=0;p<W*H;p++){ if(seen[p]) continue; const x=p%W,y=(p/W)|0; let nb=0; if(x>0&&seen[p-1])nb++; if(x<W-1&&seen[p+1])nb++; if(y>0&&seen[p-W])nb++; if(y<H-1&&seen[p+W])nb++; if(nb>=2) d[p*4+3]=Math.min(d[p*4+3],150); }
  c.putImageData(img,0,0);
}
async function processArtFile(file, a){
  const url=URL.createObjectURL(file); const im=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
  const S = a.kind==='tile'? 128 : a.kind==='bg'? 0 : a.kind==='logo'? 0 : 512;
  let out;
  if(a.kind==='bg'){ out=document.createElement('canvas'); const k=Math.min(1,1600/im.width); out.width=Math.round(im.width*k); out.height=Math.round(im.height*k); out.getContext('2d').drawImage(im,0,0,out.width,out.height); }
  else if(a.kind==='tile'){ out=document.createElement('canvas'); out.width=out.height=S; const c=out.getContext('2d'); const m=Math.min(im.width,im.height); c.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,S,S); }
  else {
    const k=Math.min(1,1024/Math.max(im.width,im.height)); const W=Math.round(im.width*k), H=Math.round(im.height*k);
    const tmp=document.createElement('canvas'); tmp.width=W; tmp.height=H; const tc=tmp.getContext('2d',{willReadFrequently:true}); tc.drawImage(im,0,0,W,H); removeBackground(tc,W,H);
    // cắt sát hình
    const d=tc.getImageData(0,0,W,H).data; let x0=W,y0=H,x1=-1,y1=-1; for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(d[(y*W+x)*4+3]>24){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
    if(x1<0){ x0=0;y0=0;x1=W-1;y1=H-1; }
    const bw=x1-x0+1, bh=y1-y0+1;
    if(a.kind==='logo'){ out=document.createElement('canvas'); out.width=bw; out.height=bh; out.getContext('2d').drawImage(tmp,x0,y0,bw,bh,0,0,bw,bh); }
    else { out=document.createElement('canvas'); out.width=out.height=S; const c=out.getContext('2d');
      const fill = a.kind==='unit'? 0.9 : (a.kind==='prop'||a.kind==='decor')? 0.94 : 0.86; const sc=Math.min(S*fill/bw, S*fill/bh); const dw=bw*sc, dh=bh*sc;
      const dx=(S-dw)/2, dy= (a.kind==='unit'||a.kind==='prop'||a.kind==='decor')? S*0.97-dh : (S-dh)/2; c.drawImage(tmp,x0,y0,bw,bh,dx,dy,dw,dh); }
  }
  URL.revokeObjectURL(url);
  return await new Promise(res=>out.toBlob(b=>res(b),'image/png'));
}
async function importArtFiles(files){
  const done=[], skip=[];
  for(const f of files){ const a=matchArt(f.name); if(!a){ skip.push(f.name); continue; }
    try{ const blob=await processArtFile(f,a); await ArtDB.put(a.key,blob); await setArtImage(a.key,URL.createObjectURL(blob),true); done.push(a); }catch(e){ skip.push(f.name); } }
  artChanged(); return {done,skip};
}

// ---- Đổi màu phe cho ảnh nhân vật: xoay sắc độ vùng xanh dương sang màu phe
const TintCache=new Map(); let TINT_GEN=1;
// (5.1) Ảnh đổi màu được nhớ NGAY TRÊN ảnh gốc. Trước đây khoá tra cứu là cả chuỗi dữ liệu của ảnh (hàng chục nghìn ký tự) ghép thêm số phe —
// mỗi lần vẽ một cái lều là ghép và băm lại chuỗi đó: nguồn xả rác bộ nhớ lớn nhất của cả game (≈0,85 MB mỗi giây).
function tintSlot(im){ if(im._tg!==TINT_GEN){ im._tg=TINT_GEN; im._tints=new Map(); } return im._tints; }
function hexToHsl(hex){ const n=parseInt(hex.slice(1),16); let r=(n>>16)/255,g=((n>>8)&255)/255,b=(n&255)/255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b); let h=0,s=0,l=(mx+mn)/2; if(mx!==mn){ const d=mx-mn; s=l>0.5?d/(2-mx-mn):d/(mx+mn); h= mx===r? (g-b)/d+(g<b?6:0) : mx===g? (b-r)/d+2 : (r-g)/d+4; h/=6; } return [h,s,l]; }
function recolorUnit(im, fi){
  const slot=tintSlot(im), hit=slot.get(fi); if(hit) return hit; const key=fi, TC=slot;
  const S=256; const cv=document.createElement('canvas'); cv.width=cv.height=S; const c=cv.getContext('2d',{willReadFrequently:true}); c.drawImage(im,0,0,S,S); if(fi===0){ TC.set(key,cv); return cv; }
  if(fi!==0){ let img; try{ img=c.getImageData(0,0,S,S); }catch(e){ TC.set(key,cv); return cv; } const d=img.data;
    let th=0, ts=0, neutral=fi===NEUTRAL; if(!neutral){ [th,ts]=hexToHsl(FACTIONS[fi].color); }
    for(let i=0;i<d.length;i+=4){ if(d[i+3]<10) continue; const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b); if(mx-mn<0.12) continue;
      let h; const dd=mx-mn; h= mx===r? (g-b)/dd+(g<b?6:0) : mx===g? (b-r)/dd+2 : (r-g)/dd+4; h/=6;
      if(h<0.52||h>0.72) continue; // chỉ vùng xanh dương
      const l=(mx+mn)/2, s=dd/(1-Math.abs(2*l-1)||1);
      let nh=th, ns=neutral?0.08:Math.min(1,s*(0.6+ts*0.5)), nl=neutral? l*0.9+0.1 : l;
      const q=nl<0.5?nl*(1+ns):nl+ns-nl*ns, p=2*nl-q; const f=(t)=>{ t=(t%1+1)%1; return t<1/6?p+(q-p)*6*t: t<1/2?q: t<2/3?p+(q-p)*(2/3-t)*6 : p; };
      d[i]=f(nh+1/3)*255; d[i+1]=f(nh)*255; d[i+2]=f(nh-1/3)*255; }
    c.putImageData(img,0,0); }
  TC.set(key,cv); return cv;
}
function tintProp(im, color){
  const slot=tintSlot(im), key='c|'+color, hit=slot.get(key); if(hit) return hit;
  const cv=document.createElement('canvas'); cv.width=im.width; cv.height=im.height; const c=cv.getContext('2d'); c.drawImage(im,0,0);
  c.globalCompositeOperation='multiply'; c.fillStyle=color; c.fillRect(0,0,cv.width,cv.height); c.globalCompositeOperation='destination-in'; c.drawImage(im,0,0);
  slot.set(key,cv); return cv;
}
