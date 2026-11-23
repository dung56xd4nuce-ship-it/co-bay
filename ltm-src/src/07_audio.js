// ============ Âm thanh tổng hợp (WebAudio, không cần file) ============
class SoundFX {
  constructor(){ this.ctx=null; this.on=true; this.last={}; this.master=null; this.musicOn=true; }
  init(){ if(this.ctx) { if(this.ctx.state==='suspended') this.ctx.resume(); return; }
    try{ const AC=window.AudioContext||window.webkitAudioContext; this.ctx=new AC(); this.master=this.ctx.createGain(); this.master.gain.value=0.5; this.master.connect(this.ctx.destination);
      const len=this.ctx.sampleRate*0.5; this.noise=this.ctx.createBuffer(1,len,this.ctx.sampleRate); const d=this.noise.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; this.startMusic(); }catch(e){ this.ctx=null; } }
  ok(key,gap){ if(!this.ctx||!this.on) return false; const t=this.ctx.currentTime; if(this.last[key] && t-this.last[key]<gap) return false; this.last[key]=t; return true; }
  tone(f,dur,type='sine',vol=0.3,slide=0,delay=0){ const c=this.ctx, t=c.currentTime+delay; const o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t+dur+0.05); }
  nz(dur,freq,q=1,vol=0.3,type='bandpass',delay=0){ const c=this.ctx, t=c.currentTime+delay; const s=c.createBufferSource(); s.buffer=this.noise; const f=c.createBiquadFilter(); f.type=type; f.frequency.value=freq; f.Q.value=q; const g=c.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t+dur+0.05); }
  hit(tag){ if(!this.ok('hit',0.07)) return; this.nz(0.08,2400+Math.random()*1200,3,0.18); this.tone(tag?320:520,0.06,'square',0.05,0.5); if(tag) this.nz(0.2,600,1,0.25); }
  shoot(k){ if(!this.ok('shoot'+k,0.09)) return; if(k==='bolt'){ this.nz(0.12,900,2,0.25); this.tone(180,0.08,'triangle',0.12,0.6); } else this.nz(0.12,3200,1.5,0.12,'highpass'); }
  block(){ if(!this.ok('block',0.1)) return; this.tone(880,0.12,'triangle',0.12,0.8); this.nz(0.06,4000,4,0.12); }
  crack(){ if(!this.ok('crack',0.1)) return; this.nz(0.25,1500,0.8,0.3); this.tone(140,0.2,'sawtooth',0.08,0.5); }
  charge(){ if(!this.ok('charge',0.4)) return; for(let i=0;i<4;i++) this.nz(0.06,300,2,0.3,'lowpass',i*0.07); this.tone(392,0.12,'square',0.06,1,0.0); this.tone(523,0.18,'square',0.06,1,0.12); }
  death(big){ if(!this.ok('death',0.12)) return; this.tone(big?330:520,big?0.6:0.3,'triangle',0.12,0.4); this.nz(0.15,800,1,0.12); }
  recruit(){ if(!this.ok('rec',0.08)) return; this.tone(784,0.12,'triangle',0.16); this.tone(1175,0.22,'triangle',0.14,1,0.08); this.tone(1568,0.25,'sine',0.08,1,0.16); }
  reveal(){ if(!this.ok('rev',0.12)) return; this.tone(1320+Math.random()*300,0.08,'sine',0.06,1.4); }
  pickup(){ if(!this.ok('pick',0.1)) return; this.tone(660,0.1,'square',0.07); this.tone(990,0.16,'square',0.07,1,0.08); }
  flag(){ if(!this.ok('flag',0.3)) return; this.tone(440,0.4,'sawtooth',0.06,0.98); this.tone(554,0.4,'sawtooth',0.05,0.98,0.05); }
  drum(big){ if(!this.ok('drum',0.15)) return; this.tone(110,0.6,'sine',0.6,0.4); this.nz(0.2,180,1,0.4,'lowpass'); if(big){ this.tone(82,0.9,'sine',0.5,0.5,0.2); this.nz(0.3,150,1,0.4,'lowpass',0.2); } }
  fanfare(){ if(!this.ctx||!this.on) return; [523,659,784,1047].forEach((f,i)=>this.tone(f,0.25,'square',0.08,1,i*0.11)); }
  click(){ if(!this.ok('click',0.04)) return; this.tone(1200,0.04,'square',0.04); }
  order(){ if(!this.ok('order',0.08)) return; this.tone(600,0.05,'triangle',0.08); this.tone(900,0.07,'triangle',0.07,1,0.05); }
  win(){ if(!this.ctx) return; [523,659,784,1047,784,1047,1319].forEach((f,i)=>this.tone(f,0.3,'square',0.09,1,i*0.13)); for(let i=0;i<6;i++) this.drumHit(i*0.22); }
  lose(){ if(!this.ctx) return; [392,370,349,330].forEach((f,i)=>this.tone(f,0.45,'triangle',0.12,1,i*0.32)); }
  drumHit(d){ this.tone(100,0.4,'sine',0.45,0.45,d); this.nz(0.15,200,1,0.3,'lowpass',d); }
  startMusic(){ // nhịp trống trận nhẹ + ngũ cung
    const c=this.ctx; const bpm=96, beat=60/bpm; const scale=[293.7,329.6,392,440,523.3,587.3]; let step=0;
    const sched=()=>{ if(!this.ctx) return; if(this.on && this.musicOn && this.ctx.state==='running'){
        const t=step%16; const tension=this.tension||0;
        if(t%4===0) this.drumHit(0); if(t%8===6) { this.tone(160,0.15,'sine',0.18,0.5); }
        if(tension>0.3 && t%2===1) this.nz(0.05,5000,2,0.04,'highpass');
        if(t%2===0 && Math.random()<0.7){ const f=scale[(Math.random()*scale.length)|0]*(Math.random()<0.3?2:1); this.tone(f,beat*0.9,'triangle',0.035+tension*0.02); }
        if(t===0) this.tone(scale[0]/2,beat*3.8,'sine',0.05); }
      step++; setTimeout(sched, beat*500); };
    setTimeout(sched,500);
  }
}
