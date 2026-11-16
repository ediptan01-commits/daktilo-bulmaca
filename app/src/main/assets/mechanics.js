'use strict';
// All coordinates are in the approved photograph's original 863 × 1823 space.
const KEY_DIAMETER=74,KEY_PITCH=81.5;
const KEY_ROWS=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM','ĞÜŞİÖÇ'];
const PHOTO_KEYS=[
 ...[...'QWERTYUIOPĞÜ'].map((letter,i)=>({letter,x:[66,141.5,211.5,276.5,346.5,413,481.5,549.5,615,680.5,748,812][i],y:1130})),
 ...[...'ASDFGHJKLŞİ'].map((letter,i)=>({letter,x:[84.5,159.5,233.5,307.5,380.5,452,520.5,591.5,662,734,802.5][i],y:1243})),
 ...[...'ZXCVBNMÖÇ'].map((letter,i)=>({letter,x:[114,196.5,279,360.5,442,524.5,607,686.5,769][i],y:1351}))
];
const TYPEWRITER_KEYS=KEY_ROWS.flatMap((row,r)=>[...row].map((letter,i)=>{
 const source=PHOTO_KEYS.find(k=>k.letter===letter);
 return {letter,x:431.5+(i-(row.length-1)/2)*KEY_PITCH,y:1095+r*94,sourceX:source.x,sourceY:source.y};
}));
const TYPEWRITER_STRIKE={x:431.5,y:768};
function typebarGeometry(letter){
 const key=TYPEWRITER_KEYS.find(k=>k.letter===letter);if(!key)return null;
 // Links from the keys fan out to separate pivots along the type basket.
 const ordered=[...TYPEWRITER_KEYS].sort((a,b)=>a.x-b.x||a.y-b.y),index=ordered.indexOf(key);
 const angle=-1.18+index/(ordered.length-1)*2.36;
 return {pivot:{x:431.5+216*Math.sin(angle),y:849+119*Math.cos(angle)},strike:{...TYPEWRITER_STRIKE},key};
}
class TypewriterMechanism {
 constructor(canvas,image,paper){
  this.canvas=canvas;this.image=image;this.paper=paper;this.ctx=canvas.getContext('2d');
  canvas.width=863;canvas.height=955;this.queue=[];this.active=null;this.column=0;this.limit=1;this.feed=0;this.spool=0;this.raf=null;
  this.draw();if(!image.complete)image.addEventListener('load',()=>this.draw());
 }
 setColumn(column,limit){this.column=Math.max(0,column);this.limit=Math.max(1,limit);this.canvas.dataset.column=String(this.column);this.syncPaper();this.draw();}
 carriageOffset(){const scale=this.canvas.clientWidth/863||.4;return -Math.min(this.column*1.25,7/scale);}
 syncPaper(){if(this.paper)this.paper.style.setProperty('--carriage-offset',(this.carriageOffset()*(this.canvas.clientWidth/863||.4))+'px');}
 isWorking(){return !!this.active||this.queue.length>0;}
 clearQueued(){this.queue=[];}
 enqueue(job){this.queue.push(job);this.startNext();}
 startNext(){if(this.active||!this.queue.length)return;this.active={...this.queue.shift(),started:null,hit:false};this.canvas.dataset.lastKey=this.active.letter||'RETURN';const g=typebarGeometry(this.active.letter);if(g){this.canvas.dataset.pivotX=String(g.pivot.x);this.canvas.dataset.pivotY=String(g.pivot.y);}this.active.onStart?.();this.raf=requestAnimationFrame(t=>this.frame(t));}
 frame(t){const a=this.active;if(!a)return;if(a.started===null)a.started=t;const elapsed=t-a.started;
  a.progress=Math.min(1,elapsed/(a.kind==='return'?780:170));
  if(!a.hit&&elapsed>=(a.kind==='return'?210:65)){a.hit=true;if(a.kind==='return'){this.column=0;this.feed=(this.feed+1)%3;}else if(a.kind==='key'){this.spool+=.008;}this.canvas.dataset.impacts=String((Number(this.canvas.dataset.impacts)||0)+1);a.onImpact?.();this.syncPaper();}
  a.onProgress?.(a.progress);this.draw();
  if(a.progress>=1){this.active=null;a.onDone?.();this.draw();this.startNext();}else this.raf=requestAnimationFrame(next=>this.frame(next));
 }
 returnCarriage(onImpact,onDone,onProgress){this.clearQueued();this.enqueue({kind:'return',onImpact,onDone,onProgress});}
 drawKey(key,depth=0){
  const c=this.ctx,x=key.x,y=key.y-670+depth;
  // Preserve the photographic brass rim and barrel; enlarge the cream face and ink.
  c.save();c.shadowColor='#000';c.shadowBlur=7;c.shadowOffsetY=5;
  c.beginPath();c.ellipse(x,y+7,37,43,0,0,Math.PI*2);c.fillStyle='#302214';c.fill();
  c.shadowBlur=0;c.shadowOffsetY=0;c.clip();
  c.drawImage(this.image,key.sourceX-34,key.sourceY-38,68,84,x-37,y-39,74,88);
  const ivory=c.createRadialGradient(x-9,y-12,2,x,y,31);
  ivory.addColorStop(0,'#fff3cc');ivory.addColorStop(.7,'#f3dfaf');ivory.addColorStop(1,'#ddc18a');
  c.beginPath();c.ellipse(x,y-2,30.5,30.5,0,0,Math.PI*2);c.fillStyle=ivory;c.fill();
  c.fillStyle='#211b13';c.font='italic bold 44px Georgia, serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText(key.letter,x,y-1);c.restore();
 }
 drawKeyboard(){
  const c=this.ctx;
  c.save();c.beginPath();c.roundRect(27,385,815,385,24);c.clip();
  const well=c.createLinearGradient(0,385,0,770);well.addColorStop(0,'#10150e');well.addColorStop(.55,'#212017');well.addColorStop(1,'#0d130d');
  c.fillStyle=well;c.fillRect(27,385,815,385);
  // Individual metal stems retain the mechanical depth behind the separated caps.
  for(const key of TYPEWRITER_KEYS){const y=key.y-670;c.fillStyle='#655236';c.fillRect(key.x-3,y+16,6,48);c.fillStyle='#b3955e';c.fillRect(key.x-2,y+18,2,44);}
  const activeKey=this.active?.kind==='key'?this.active.letter:null;
  const p=this.active?.progress||0,depth=Math.max(0,(p<.38?p/.38:(1-p)/.62)*6);
  for(const key of TYPEWRITER_KEYS)this.drawKey(key,key.letter===activeKey?depth:0);
  c.restore();
 }

 draw(){const c=this.ctx;c.clearRect(0,0,863,955);if(!this.image.complete||!this.image.naturalWidth)return;
  const a=this.active,p=a?.progress||0,returning=a?.kind==='return';
  const carriage=this.carriageOffset()*(returning?1-Math.min(1,p*2):1);
  // The roller is a photographic patch; the stationary body and print guide never move.
  c.fillStyle='#0c1710';c.fillRect(0,0,863,62);
  c.drawImage(this.image,0,670,863,62,carriage,0,863,62);
  if(this.spool){for(const [x,y] of [[163,819],[696,820]]){c.save();c.translate(x,y-670);c.scale(1,.49);c.beginPath();c.arc(0,0,69,0,Math.PI*2);c.clip();c.rotate(this.spool);c.drawImage(this.image,x-69,y-34,138,68,-69,-69,138,138);c.restore();}}
  this.drawKeyboard();
  if(!a)return;
  if(returning){
   // Feed roller and return lever move together on a new line.
   const lift=Math.sin(p*Math.PI)*4;c.save();c.globalAlpha=.9;c.drawImage(this.image,17,728,75,211,17-lift,58,75,211);c.restore();return;
  }
  const key=TYPEWRITER_KEYS.find(k=>k.letter===a.letter);
  const depth=(p<.38?p/.38:(1-p)/.62)*5;

  if(a.kind==='erase'){c.save();c.globalAlpha=.15;c.fillStyle='#000';c.fillRect(686,770,118,79);c.restore();return;}
  if(a.kind!=='key'||!key)return;
  const g=typebarGeometry(a.letter),rise=p<=.39?Math.sin(p/.39*Math.PI/2):Math.cos((p-.39)/.61*Math.PI/2);
  const length=.07+.93*Math.max(0,rise),end={x:g.pivot.x+(g.strike.x-g.pivot.x)*length,y:g.pivot.y+(g.strike.y-g.pivot.y)*length};
  c.save();c.lineCap='round';c.beginPath();c.moveTo(g.pivot.x,g.pivot.y-670);c.lineTo(end.x,end.y-670);c.strokeStyle='#13150d';c.lineWidth=8;c.stroke();
  const metal=c.createLinearGradient(g.pivot.x-3,0,g.pivot.x+3,0);metal.addColorStop(0,'#675333');metal.addColorStop(.45,'#f2dc9e');metal.addColorStop(1,'#7b6844');c.strokeStyle=metal;c.lineWidth=4;c.stroke();
  c.translate(end.x,end.y-670);c.rotate(Math.atan2(end.x-g.pivot.x,g.pivot.y-end.y));c.fillStyle='#cfb681';c.fillRect(-5,-9,10,12);c.fillStyle='#423c2c';c.fillRect(-4,-8,8,3);c.restore();
 }
}
