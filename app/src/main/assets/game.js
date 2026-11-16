'use strict';
const $=id=>document.getElementById(id), STORAGE='daktilo-bulmaca-v1';
function fresh(){return {current:0,solved:[],hints:10,score:0,entries:{},locks:{},sound:true,vibration:true,contentVersion:CONTENT_VERSION};}
let state=fresh();
try {
 const s=JSON.parse(localStorage.getItem(STORAGE));
 if(s&&s.version===1){
  state={...fresh(),...s};
  if(!s.contentVersion){
   const shift=map=>Object.fromEntries(Object.entries(map||{}).filter(([id])=>Number.isInteger(Number(id))&&Number(id)>=0&&Number(id)<LEGACY_OFFSET).map(([id,value])=>[Number(id)+LEGACY_OFFSET,value]));
   state.solved=(Array.isArray(s.solved)?s.solved:[]).filter(id=>Number.isInteger(id)&&id>=0&&id<LEGACY_OFFSET).map(id=>id+LEGACY_OFFSET);
   state.entries=shift(s.entries);state.locks=shift(s.locks);
   state.current=0;state.hints=Math.max(10,Number(s.hints)||0);
  }
  state.contentVersion=CONTENT_VERSION;
  state.current=Math.max(0,Math.min(QUESTIONS.length-1,Number(state.current)||0));
  state.solved=[...new Set(Array.isArray(state.solved)?state.solved:[])].filter(n=>Number.isInteger(n)&&n>=0&&n<QUESTIONS.length);
  state.hints=Math.max(0,Number(state.hints)||0);state.score=Math.max(0,Number(state.score)||0);
 }
}catch{}
let cursor=0,busy=false,autoAdvanceTimer=null;
const soundPools={};
for(const name of ['key_1','key_2','key_3','return']){
 soundPools[name]=Array.from({length:name==='return'?2:5},()=>{const clip=new Audio('sfx/'+name+'.wav');clip.preload='auto';clip.hidden=true;clip.dataset.sound=name;document.body.append(clip);clip.load();return clip;});
}
function pauseSounds(){Object.values(soundPools).flat().forEach(clip=>{clip.pause();clip.currentTime=0;});}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({...state,version:1}));}catch{}}
function q(){return QUESTIONS[state.current];}function entry(){let e=state.entries[q().id];if(!Array.isArray(e)||e.length!==q().answer.length)e=state.entries[q().id]=Array(q().answer.length).fill('');return e;}function locks(){let l=state.locks[q().id];if(!Array.isArray(l))l=state.locks[q().id]=[];return l;}
function isSolved(){return state.solved.includes(q().id);}
function sound(kind='key'){
 if(!state.sound)return;
 // Actual recordings of typebars, margin bell and carriage return, never synthesized beeps.
 const name=kind==='bell'||kind==='return'?'return':kind==='erase'||kind==='wrong'?'key_3':Math.random()<.23?'key_2':'key_1';
 const pool=soundPools[name];let clip=pool.find(c=>c.paused||c.ended)||pool[0];
 clip.currentTime=0;clip.volume=kind==='wrong'?.35:name==='key_2'?.42:name==='return'?.92:.95;
 const play=clip.play();if(play&&play.catch)play.catch(()=>{});
}
function animate(el,cls){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);}
function strike(letter,kind='key'){sound(kind);if(state.vibration&&navigator.vibrate)navigator.vibrate(8);animate($('typebar'),'strike');const key=[...document.querySelectorAll('.key')].find(k=>k.textContent===letter);if(key){key.classList.add('pressed');setTimeout(()=>key.classList.remove('pressed'),110);}}
function feedback(message,type=''){$('feedback').textContent=message;$('feedback').className=type;}
function render(){
 const item=q();entry();if(isSolved())state.entries[item.id]=item.answer.split('');
 $('category').textContent=item.category.toLocaleUpperCase('tr-TR');$('number').textContent=`SORU ${String(item.id+1).padStart(2,'0')}`;
 $('chapterLabel').textContent=`${String(item.chapter+1).padStart(2,'0')} · ${CHAPTERS[item.chapter].toLocaleUpperCase('tr-TR')}`;$('score').textContent=`${state.score} PUAN`;
 const done=QUESTIONS.filter(x=>x.chapter===item.chapter&&state.solved.includes(x.id)).length;$('progressBar').style.width=`${done*10}%`;
 $('question').textContent=item.clue;$('length').textContent=`${item.answer.length} HARF`;$('difficulty').textContent=item.difficulty;$('hintCount').textContent=state.hints;
 $('slots').replaceChildren();entry().forEach((letter,i)=>{const b=document.createElement('button');b.className='slot'+(locks().includes(i)?' fixed':'')+(cursor===i&&!isSolved()?' active':'');b.textContent=letter;b.setAttribute('aria-label',`${i+1}. harf: ${letter||'boş'}`);b.onclick=()=>{if(!busy&&!isSolved()){cursor=i;renderSlots();}};$('slots').append(b);});
 $('check').innerHTML=isSolved()?'SONRAKİ SORU <span>→</span>':'KONTROL ET <span>↵</span>';$('erase').disabled=isSolved();$('hint').disabled=isSolved()||state.hints===0;
 $('carriage').style.transform=`translateX(${-Math.min(cursor,12)*1.1}px)`;feedback(isSolved()?'Bu satır tamamlandı.':'');
}
function renderSlots(){const items=$('slots').children;entry().forEach((v,i)=>{items[i].textContent=v;items[i].classList.toggle('active',i===cursor&&!isSolved());items[i].classList.toggle('fixed',locks().includes(i));});$('carriage').style.transform=`translateX(${-Math.min(cursor,12)*1.1}px)`;}
function nextEditable(from){for(let n=0;n<entry().length;n++){const i=(from+n)%entry().length;if(!locks().includes(i)&&!entry()[i])return i;}for(let n=0;n<entry().length;n++){const i=(from+n)%entry().length;if(!locks().includes(i))return i;}return 0;}
function type(letter){if(busy||isSolved())return;if(locks().includes(cursor))cursor=nextEditable(cursor);if(locks().includes(cursor))return;strike(letter);entry()[cursor]=letter;cursor=nextEditable(cursor+1);renderSlots();feedback('');save();if(entry().every(Boolean))check();}
function erase(){if(busy||isSolved())return;let i=cursor;if(!entry()[i]||locks().includes(i)){let found=false;for(let n=1;n<=entry().length;n++){const p=(cursor-n+entry().length)%entry().length;if(!locks().includes(p)&&entry()[p]){i=p;found=true;break;}}if(!found)return;}entry()[i]='';cursor=i;strike('','erase');renderSlots();feedback('');save();}
function check(){if(busy)return;if(isSolved()){next();return;}if(!entry().every(Boolean)){feedback('Cevabın bütün harflerini tamamla.');return;}if(entry().join('')!==q().answer){sound('wrong');animate($('paper'),'shake');feedback('Bu cevap uymadı. Harfleri yeniden düşün.','error');return;}
 state.solved.push(q().id);const points=Math.max(20,100-locks().length*15);state.score+=points;if(state.solved.length%5===0)state.hints+=2;save();sound('bell');render();feedback(`Doğru! +${points} puan${state.solved.length%5===0?' · 2 harf açma kazandın':''}`,'success');busy=true;const completedId=q().id;autoAdvanceTimer=setTimeout(()=>{autoAdvanceTimer=null;busy=false;if(q().id!==completedId||!state.solved.includes(completedId))return;if(state.solved.length===QUESTIONS.length){show(`<h2>Bütün satırlar tamam!</h2><p>${QUESTIONS.length} sorunun tamamını çözdün.</p><p class="answer">${state.score} PUAN</p><button class="action" data-action="chapters">Bölümleri gör</button>`);}else{next(false);}},850);
}
function go(id){if(busy)return;state.current=id;cursor=nextEditable(0);save();render();animate($('paper'),'advance');}
function next(playSound=true){let id=(q().id+1)%QUESTIONS.length;for(let n=0;n<QUESTIONS.length;n++){const c=(q().id+1+n)%QUESTIONS.length;if(!state.solved.includes(c)){id=c;break;}}if(playSound)sound('return');go(id);}
function hint(){if(busy||isSolved()||state.hints<=0)return;let pos=entry().findIndex((c,i)=>c!==q().answer[i]&&!locks().includes(i));if(pos<0){check();return;}entry()[pos]=q().answer[pos];locks().push(pos);state.hints--;cursor=nextEditable(pos+1);strike(entry()[pos]);save();render();feedback('Bir harf açıldı.');if(entry().every(Boolean))check();}
function show(html){$('dialogContent').innerHTML=html;if(!$('dialog').open)$('dialog').showModal();}
function close(){$('dialog').close();}
function chapters(){show(`<h2>Sayfalar</h2><p>${state.solved.length} / ${QUESTIONS.length} soru tamamlandı · ${state.score} puan</p>${CHAPTERS.map((name,i)=>{const total=QUESTIONS.filter(x=>x.chapter===i&&state.solved.includes(x.id)).length;return `<button class="chapter" data-chapter="${i}">${String(i+1).padStart(2,'0')} · ${name}<small>${total}/10</small></button>`;}).join('')}`);}
function chapterQuestions(c){show(`<h2>${CHAPTERS[c]}</h2><p>Bir soru seç.</p>${QUESTIONS.filter(x=>x.chapter===c).map(x=>`<button class="chapter" data-question="${x.id}">${state.solved.includes(x.id)?'✓':'○'} Soru ${x.id+1}<small>${x.category} · ${x.answer.length} harf</small></button>`).join('')}<button class="action secondary" data-action="chapters">Bütün sayfalar</button>`);}
function settings(){show(`<h2>Daktilo ayarları</h2><button class="action secondary" data-action="sound">Mekanik sesler: ${state.sound?'AÇIK':'KAPALI'}</button><button class="action secondary" data-action="vibration">Tuş titreşimi: ${state.vibration?'AÇIK':'KAPALI'}</button><p>Harfleri daktilonun tuşlarıyla yaz. Yanlış bir harfi değiştirmek için kutusuna dokun. Doğru cevap 100 puan; açılan her harf 15 puan düşürür. Her 5 doğru cevapta 2 harf açma kazanırsın. Takıldığın soruyu sonra çözebilirsin.</p><button class="action secondary" data-action="reset">İlerlemeyi sıfırla</button>`);}
const KEY_ROWS=[
 {letters:'QWERTYUIOPĞÜ',xs:[66,139,210,279,350,418,486,553,621,687,752,812],y:1130},
 {letters:'ASDFGHJKLŞİ',xs:[83,158,231,305,378,451,523,596,668,740,805],y:1244},
 {letters:'ZXCVBNMÖÇ',xs:[113,197,281,363,445,528,612,696,778],y:1353}
];
const GLYPH_CENTERS=[[[66,1130],[141.5,1130],[211.5,1130],[276.5,1130],[346.5,1129.5],[413,1129.5],[481.5,1129.5],[549.5,1129.5],[615,1129.5],[680.5,1129.5],[748,1129.5],[812,1129.5]],[[84.5,1243],[159.5,1242],[233.5,1242.5],[307.5,1244],[380.5,1244],[452,1244],[520.5,1243],[591.5,1242],[662,1242],[734,1242],[802.5,1242]],[[114,1351],[196.5,1351.5],[279,1351.5],[360.5,1351.5],[442,1351],[524.5,1350.5],[607,1350.5],[686.5,1350.5],[769,1350.5]]];
KEY_ROWS.forEach((row,rowIndex)=>{const div=document.createElement('div');div.className='key-row';[...row.letters].forEach((letter,i)=>{const b=document.createElement('button');b.className='key';b.style.left=(row.xs[i]/863*100)+'%';b.style.top=((row.y-670)/955*100)+'%';const glyph=document.createElement('span');glyph.textContent=letter;const center=GLYPH_CENTERS[rowIndex][i];glyph.style.marginLeft=((center[0]-row.xs[i])/47)+'em';glyph.style.marginTop=((center[1]-row.y)/47)+'em';b.append(glyph);b.setAttribute('aria-label',letter+' harfi');b.onclick=()=>type(letter);div.append(b);});$('keys').append(div);});
// Keep the approved artwork's proportions and aligned touch targets at every screen size.
function fitMachine(){const viewport=$('machineViewport'),stage=$('machineStage');const scale=Math.max(0,Math.min(viewport.clientWidth/863,viewport.clientHeight/955));stage.style.width=(863*scale)+'px';stage.style.height=(955*scale)+'px';stage.style.fontSize=(47*scale)+'px';}
if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitMachine).observe($('machineViewport'));
window.addEventListener('resize',fitMachine);fitMachine();
document.addEventListener('keydown',e=>{if($('dialog').open)return;if(e.key==='Backspace'){e.preventDefault();erase();}else if(e.key==='Enter'){e.preventDefault();check();}else if(e.key.length===1){const letter=e.key.toLocaleUpperCase('tr-TR');if('ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZQWX'.includes(letter)){e.preventDefault();type(letter);}}});
$('erase').onclick=erase;$('check').onclick=check;$('returnKey').onclick=check;$('hint').onclick=hint;$('skip').onclick=()=>{if(!busy)next();};$('chapters').onclick=chapters;$('settings').onclick=settings;$('closeDialog').onclick=close;
$('dialogContent').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.chapter!==undefined){chapterQuestions(Number(b.dataset.chapter));return;}if(b.dataset.question!==undefined){close();go(Number(b.dataset.question));return;}switch(b.dataset.action){case'chapters':chapters();break;case'sound':state.sound=!state.sound;if(!state.sound)pauseSounds();save();settings();if(state.sound)sound();break;case'vibration':state.vibration=!state.vibration;save();settings();break;case'reset':show('<h2>Baştan başlansın mı?</h2><p>Çözülen sorular, puanlar ve açılan harfler silinir.</p><button class="action" data-action="reset-confirm">Evet, baştan başla</button><button class="action secondary" data-action="settings">Vazgeç</button>');break;case'reset-confirm':clearTimeout(autoAdvanceTimer);autoAdvanceTimer=null;state=fresh();cursor=0;busy=false;save();close();render();break;case'settings':settings();break;}});
window.addEventListener('pagehide',save);window.addEventListener('blur',pauseSounds);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseSounds();});
cursor=nextEditable(0);save();render();
