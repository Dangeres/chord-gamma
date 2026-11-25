'use strict';
const $ = (selector) => document.querySelector(selector);
const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const syllables = ['До', 'Ре', 'Ми', 'Фа', 'Соль', 'Ля', 'Си'];
const natural = [0, 2, 4, 5, 7, 9, 11];
const roots = {
  major: ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'],
  minor: ['C','C♯','D','E♭','E','F','F♯','G','G♯','A','B♭','B']
};
const intervals = {major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10]};
const roles = [
  {base:0, name:'Тоника', color:'#c29aff', wash:'#2c2438', edge:'#48374f'},
  {base:3, name:'Субдоминанта', color:'#83dcb5', wash:'#1c2e29', edge:'#33483f'},
  {base:4, name:'Доминанта', color:'#f0b575', wash:'#322920', edge:'#4d4033'}
];
const romans = ['I','II','III','IV','V','VI','VII','VIII'];
const degreeNames = ['Тоника', 'Надтоника', 'Медианта', 'Субдоминанта', 'Доминанта', 'Субмедианта', 'Вводная ступень'];
const exampleSteps = [[0], [1,0], [0,2], [3,2], [4,7], [5,4], [6,7]];
let selectedDegree = 0;
const flightTime = 1000, noteDelay = 140;
const clefPath = 'M2 22 C-11 18 -13 9 -6 0 C-3 -4 1 -7 4 -11 C11 -19 11 -29 7 -36 C4 -40 0 -29 1 -20 L8 23 C10 35 -2 38 -5 30 C-7 24 0 21 2 26 C4 30 0 32 -2 31 C1 36 9 32 7 23 L0 -20 C-2 -30 3 -42 7 -40 C15 -29 10 -15 4 -7 C-1 0 -9 5 -8 12 C-8 19 -1 24 5 21 C15 17 12 6 6 5 C-2 3 -4 12 1 16 C-6 14 -7 8 -3 3 C4 -5 16 1 16 11 C16 19 9 24 2 22 Z';
let pitch = 0, mode = 'major', muted = false, context, master, currentPlay;
let timers = [], voices = [], flying = [], scale = [];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const playShape = '<path d="m5 3 10 6-10 6z" fill="currentColor"/>';
const stopShape = '<rect x="4" y="4" width="10" height="10" rx="2" fill="currentColor"/>';
function icon(shape) { return '<svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">'+shape+'</svg>'; }
function spell(pc, letter) {
  const distance = (pc - natural[letter] + 18) % 12 - 6;
  const sign = distance < 0 ? '♭'.repeat(-distance) : '♯'.repeat(distance);
  return {letter, sign, ru:syllables[letter]+sign, symbol:letters[letter]+sign};
}
function makeNote(index) {
  const rootLetter = letters.indexOf(roots[mode][pitch][0]);
  const step = rootLetter + index;
  const midi = 60 + pitch + intervals[mode][index % 7] + 12 * Math.floor(index / 7);
  return {...spell(midi % 12,step % 7),step,midi};
}
function clef(x,y,size=1) {
  return '<path d="'+clefPath+'" transform="translate('+x+' '+y+') scale('+size+')" fill="#a7a0b3"/>';
}
function lines(x1,x2,bottom,gap) {
  return Array.from({length:5},(_,i)=>'<path d="M'+x1+' '+(bottom-i*gap)+'H'+x2+'" stroke="#625d6b" stroke-width=".85"/>').join('');
}
function ledger(x,y,bottom,gap) {
  let out = '';
  for(let a=bottom+gap;a<=y+.1;a+=gap) out += '<path d="M'+(x-10)+' '+a+'h20" stroke="#96909e"/>';
  for(let a=bottom-5*gap;a>=y-.1;a-=gap) out += '<path d="M'+(x-10)+' '+a+'h20" stroke="#96909e"/>';
  return out;
}
function head(x,y,color,id='') {
  return '<ellipse '+id+' cx="'+x+'" cy="'+y+'" rx="6.8" ry="4.6" transform="rotate(-19 '+x+' '+y+')" fill="'+color+'"/>';
}
function accidental(note,x,y) {
  return note.sign ? '<text x="'+x+'" y="'+(y+5)+'" text-anchor="end" fill="#e1dce7" font-size="19" font-family="Georgia,serif">'+note.sign+'</text>' : '';
}
function drawScale() {
  const w = Math.max(285,Math.round($('#scale-score').clientWidth));
  const narrow = w < 600, start = narrow ? 36 : 79, end = narrow ? 17 : 40;
  const gap = narrow ? 9 : 11, bottom = 94;
  const xs = scale.map((_,i)=>start+i*(w-start-end)/7);
  let svg = lines(2,w-2,bottom,gap)+clef(narrow?13:25,bottom-gap*1.45,gap/11*.92);
  scale.forEach((n,i)=>{
    const x=xs[i], y=bottom+(2-n.step)*gap/2;
    const color=(roles.find(r=>r.base===i || (i===7 && r.base===0)) || {color:'#d3cedf'}).color;
    const down=n.step>=6, stemX=x+(down?-5.8:5.8);
    svg += '<g class="score-note" data-idx="'+i+'" role="button" tabindex="0" aria-label="Построить гамму от '+n.ru+'"><rect x="'+(x-(w-start-end)/16)+'" y="0" width="'+((w-start-end)/8)+'" height="160" fill="transparent"/><circle class="halo" cx="'+x+'" cy="'+y+'" r="16" fill="'+color+'"/>'+ledger(x,y,bottom,gap)+accidental(n,x-9,y)+'<path d="M'+stemX+' '+y+'v'+(down?31:-31)+'" stroke="'+color+'" stroke-width="1.9"/>'+head(x,y,color,'data-source="'+i+'"')+'<text x="'+x+'" y="132" text-anchor="middle" fill="'+color+'" font-size="'+(narrow?13:15)+'" font-weight="550">'+n.ru+'</text><text x="'+x+'" y="152" text-anchor="middle" font-size="12" fill="#aaa3b5" font-family="Georgia,serif">'+romans[i]+'</text></g>';
  });
  $('#scale-score').innerHTML='<svg viewBox="0 0 '+w+' 167" aria-label="Гамма '+scale[0].ru+'">'+svg+'</svg>';
}
function scalePosition(index) { return index <= 7 ? index : index % 7; }
function chordNotes(base) { return [0,2,4].map(offset=>makeNote(base+offset)); }
function degreeLesson(index) {
  const note = scale.map(n=>n.ru.toLowerCase());
  const major = mode === 'major';
  return [
    `Главная опора гаммы. Завершите фразу на ноте ${note[0]}, и появится ощущение, что мелодия пришла домой.`,
    `Отсюда до тоники один шаг вниз. Сыграйте ${note[1]}, а следом ${note[0]}, чтобы услышать, как напряжение ослабевает.`,
    `Эта нота задаёт окраску тонического трезвучия. Между ${note[0]} и ${note[2]} звучит ${major ? 'большая терция мажора' : 'малая терция минора'}.`,
    `На этой ступени строится субдоминантовое трезвучие. Сыграйте ход ${note[3]} → ${note[2]} и послушайте, как мелодия приходит к терции тоники.`,
    `В тоническом трезвучии ${note[4]} звучит устойчиво. Если взять её в басу и затем перейти на ${note[0]}, получится характерный ход от доминанты к тонике.`,
    `В трезвучии IV ступени эта нота звучит как терция. В мелодии она часто спускается на V ступень. Попробуйте ход ${note[5]} → ${note[4]}.`,
    major ? `От ${note[6]} до верхней тоники ${note[0]} всего полтона. Это тесное соседство создаёт сильное тяготение вверх.` :
      `В натуральном миноре от ${note[6]} до верхней тоники ${note[0]} целый тон. Тяготение вверх мягче, чем в мажоре.`
  ][index];
}
function chordFunction(base) {
  const target = scale[0].ru.toLowerCase();
  if (base === 0) return 'Даёт ощущение покоя. На этом аккорде фраза часто заканчивается.';
  if (base === 3) return 'Уводит от тоники. После него попробуйте сыграть доминанту, а затем вернуться к тонике.';
  if (mode === 'minor') return 'В натуральном миноре этот аккорд минорный. Он мягче ведёт к тонике, чем мажорная доминанта.';
  return `Создаёт ожидание тоники. Послушайте, как его терция ${scale[6].ru.toLowerCase()} тянется на полтона вверх к ${target}.`;
}
function renderLesson() {
  const i = selectedDegree;
  $('#degree-picker').innerHTML = scale.slice(0,7).map((n,j)=>
    `<button class="degree-choice" data-degree="${j}" aria-pressed="${i === j}"><span>${romans[j]}</span> ${n.ru}</button>`
  ).join('');
  const name = i === 6 && mode === 'minor' ? 'Натуральная VII ступень' : degreeNames[i];
  $('#degree-name').textContent = `${romans[i]} · ${scale[i].ru} — ${name.toLowerCase()}`;
  $('#degree-description').textContent = degreeLesson(i);
  const tones = ['основной тон','терция','квинта'];
  const membership = roles.flatMap(r=>{
    const position = [0,2,4].findIndex(offset=>(r.base+offset)%7 === i);
    if (position < 0) return [];
    return [tones[position]+' аккорда '+scale[r.base].symbol+(mode==='minor'?'m':'')];
  });
  $('#degree-chords').textContent = scale[i].ru+' — '+membership.join(' и ')+'.';
  updateExampleButton();
}
function updateExampleButton() {
  const playing = currentPlay === 'example';
  const example = exampleSteps[selectedDegree].map(step=>scale[step].ru).join(' → ');
  $('#degree-example').innerHTML = icon(playing ? stopShape : playShape)+(playing ? 'Остановить' : example);
  $('#degree-example').setAttribute('aria-label',playing ? 'Остановить пример' : 'Послушать пример '+example);
}
function staffForChord(role,notes) {
  const gap=8, bottom=64, x=87;
  const ys=notes.map(n=>bottom+(2-n.step)*gap/2);
  const shift=Math.max(0,8-ys[2]);
  const b=bottom+shift;
  let s=lines(1,150,b,gap)+clef(17,b-gap*1.45,.68);
  for(const y of ys) s+=ledger(x,y+shift,b,gap);
  notes.forEach((n,i)=>{
    const y=ys[i]+shift;
    s+=accidental(n,x-10-((i===1)?8:0),y)+head(x,y,role.color,'data-target="'+i+'"');
  });
  const down=notes[1].step>=6;
  s+='<path class="chord-stem" d="M'+(x+(down?-5.8:5.8))+' '+(ys[down?2:0]+shift)+'V'+(ys[down?0:2]+shift+(down?22:-22))+'" stroke="'+role.color+'" stroke-width="1.7"/>';
  return '<svg viewBox="0 0 152 94" class="chordstaff" aria-hidden="true">'+s+'</svg>';
}
function renderCards() {
  $('#cards').innerHTML=roles.map((r,i)=>{
    const notes=chordNotes(r.base), root=notes[0], minor=mode==='minor', idx=[0,2,4].map(k=>(r.base+k)%7+1);
    const name=root.ru+' '+(minor?'минор':'мажор');
    return '<button class="chordcard" data-card="'+i+'" aria-describedby="function-'+i+'" style="--tone:'+r.color+';--wash:'+r.wash+';--edge:'+r.edge+'" aria-label="Послушать аккорд '+name+', '+r.name+'"><div class="cardtop"><span class="degree"><span class="roman">'+(minor?romans[r.base].toLowerCase():romans[r.base])+'</span>'+r.name+'</span><span class="cardplay">'+icon(playShape)+'</span></div><div class="cardbody"><div><div class="chordsymbol">'+root.symbol+(minor?'m':'')+'</div><div class="chordname">'+name+'</div></div>'+staffForChord(r,notes)+'</div><p class="chord-function" id="function-'+i+'">'+chordFunction(r.base)+'</p><div class="cardfoot"><span>'+notes.map(n=>n.ru).join(' · ')+'</span><span class="formula">'+idx.join('–')+'</span></div></button>';
  }).join('');
}
function render() {
  scale=Array.from({length:8},(_,i)=>makeNote(i));
  $('#tonics').innerHTML=roots[mode].map((root,i)=>'<button class="pitch '+(root.length>1?'acc':'')+'" aria-label="'+syllables[letters.indexOf(root[0])]+root.slice(1)+'" aria-pressed="'+(i===pitch)+'" data-pitch="'+i+'">'+root+'</button>').join('');
  const name=scale[0].ru+' '+(mode==='major'?'мажор':'минор');
  $('#keyname').textContent=name;
  $('#status').textContent='Гамма '+name+'. '+scale.map(n=>n.ru).join(', ');
  drawScale(); renderCards(); buttons(); renderLesson();
}
function buttons() {
  const playing=currentPlay==='scale';
  $('#play-scale').innerHTML=icon(playing?stopShape:playShape)+(playing?'Остановить':'Слушать гамму');
  $('#sound').innerHTML=icon('<path d="M2 7h3l4-4v12l-4-4H2z" fill="currentColor"/><path d="'+(muted?'m12 7 4 4m0-4-4 4':'M12 6q3 3 0 6m2-9q6 6 0 12')+'" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>')+(muted?'Звук выкл.':'Звук вкл.');
  $('#sound').setAttribute('aria-pressed',String(!muted));
}
function stop() {
  timers.forEach(clearTimeout); timers=[];
  voices.forEach(voice=>{try{voice.stop()}catch{}}); voices=[];
  cancelFlights();
  document.querySelectorAll('.sounding,.active').forEach(el=>el.classList.remove('sounding','active'));
  document.querySelectorAll('.cardplay').forEach(el=>el.innerHTML=icon(playShape));
  currentPlay=null; buttons(); updateExampleButton();
}
function after(ms,fn){timers.push(setTimeout(fn,ms))}
function audioReady(){
  if(muted)return;
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  if(!context){context=new Audio();master=context.createGain();master.gain.value=.4;master.connect(context.destination)}
  if(context.state==='suspended')context.resume().catch(()=>{});
}
function tone(midi,duration=.55){
  if(!context||muted)return;
  const t=context.currentTime, freq=440*2**((midi-69)/12);
  [1,2,3].forEach((harmonic,i)=>{
    const o=context.createOscillator(),g=context.createGain();
    o.frequency.value=freq*harmonic;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime([.33,.09,.035][i],t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+duration+.03);voices.push(o);o.onended=()=>{o.disconnect();g.disconnect();voices=voices.filter(v=>v!==o)};
  });
}
function cancelFlights() {
  flying.forEach(animation=>animation.cancel());
  flying = [];
}
function trackFlight(animation, dot) {
  flying.push(animation);
  const cleanUp = () => {
    dot?.remove();
    flying = flying.filter(item=>item !== animation);
  };
  animation.onfinish = animation.oncancel = cleanUp;
}
function fly(cardIndex, delay = 0) {
  if (reduceMotion.matches) return;
  const role = roles[cardIndex];
  const card = document.querySelector('[data-card="'+cardIndex+'"]');
  const notes = [0,2,4].map((offset,j)=>{
    const source = document.querySelector('[data-source="'+scalePosition(role.base+offset)+'"]');
    const target = card.querySelector('[data-target="'+j+'"]');
    return {from:source.getBoundingClientRect(), to:target.getBoundingClientRect(), target};
  });
  const stem = card.querySelector('.chord-stem');
  trackFlight(stem.animate([{opacity:0},{opacity:1}],{
    duration:220, delay:delay+flightTime+(notes.length-1)*noteDelay-220, fill:'backwards'
  }));
  notes.forEach(({from, to, target}, j)=>{
    const x = from.left + from.width/2;
    const y = from.top + from.height/2;
    const dx = to.left + to.width/2 - x;
    const dy = to.top + to.height/2 - y;
    const lift = Math.min(88, Math.abs(dy)*0.22);
    const dot = document.createElement('span');
    dot.className = 'flying';
    dot.style.cssText = `--tone:${role.color};left:${x+scrollX}px;top:${y+scrollY}px;width:${from.width}px;height:${from.height}px`;
    document.body.append(dot);
    // Sample a shallow arc. A single easing curve controls the whole flight.
    const path = Array.from({length:33},(_,frame)=>{
      const t = frame/32;
      const height = dy*t - 4*lift*t*(1-t);
      const size = 1+(to.width/from.width-1)*t;
      return {
        transform:`translate(-50%, -50%) translate3d(${dx*t}px,${height}px,0) rotate(-19deg) scale(${size})`,
        opacity:Math.max(0,Math.min(1,t/0.1,(1-t)/0.1))
      };
    });
    const timing = {duration:flightTime, delay:delay+j*noteDelay, easing:'cubic-bezier(.38,0,.22,1)', fill:'backwards'};
    trackFlight(dot.animate(path,timing),dot);
    trackFlight(target.animate([{opacity:0},{offset:.9,opacity:0},{opacity:1}],timing));
  });
}
function selectKey(newPitch){
  stop();pitch=newPitch;render();audioReady();tone(scale[0].midi);
  roles.forEach((_,i)=>fly(i,i*245));
}
$('#tonics').onclick=e=>{const b=e.target.closest('[data-pitch]');if(b){selectKey(+b.dataset.pitch);$('#tonics [aria-pressed=true]').focus({preventScroll:true})}};
$('#mode').onchange=e=>{mode=e.target.value;selectKey(pitch)};
function chooseFromScore(e){
  const g=e.target.closest('[data-idx]');if(!g)return;
  selectKey(scale[+g.dataset.idx].midi%12);
  if(e.type==='keydown')document.querySelector('[data-idx="0"]').focus({preventScroll:true});
}
$('#scale-score').onclick=chooseFromScore;
$('#scale-score').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseFromScore(e)}};
$('#sound').onclick=()=>{muted=!muted;stop();if(!muted)audioReady()};
$('#play-scale').onclick=()=>{
  const toggle=currentPlay==='scale';stop();if(toggle)return;audioReady();currentPlay='scale';buttons();
  scale.forEach((n,i)=>after(i*300,()=>{
    document.querySelector('.sounding')?.classList.remove('sounding');
    document.querySelector('[data-idx="'+i+'"]').classList.add('sounding');tone(n.midi,.44);
  }));after(2580,stop);
};
$('#cards').onclick=e=>{
  const card=e.target.closest('[data-card]');if(!card)return;
  const i=+card.dataset.card,toggle=currentPlay===i;stop();if(toggle)return;
  audioReady();currentPlay=i;card.classList.add('active');card.querySelector('.cardplay').innerHTML=icon(stopShape);
  const role=roles[i],notes=chordNotes(role.base);
  [0,2,4].forEach(k=>document.querySelector('[data-idx="'+scalePosition(role.base+k)+'"]').classList.add('sounding'));
  selectedDegree=role.base;renderLesson();
  fly(i);notes.forEach((n,j)=>after(noteDelay*j,()=>tone(n.midi)));
  const arrival = flightTime + (notes.length-1)*noteDelay;
  after(arrival,()=>notes.forEach(n=>tone(n.midi,1)));after(arrival+1070,stop);
};
$('#degree-picker').onclick = e => {
  const choice = e.target.closest('[data-degree]');
  if (!choice) return;
  stop(); selectedDegree = Number(choice.dataset.degree); renderLesson();
  $('#degree-picker [aria-pressed=true]').focus({preventScroll:true});
};
$('#degree-example').onclick = () => {
  const playing = currentPlay === 'example';
  stop();
  if (playing) return;
  audioReady(); currentPlay = 'example'; updateExampleButton();
  const steps = exampleSteps[selectedDegree];
  steps.forEach((step,j)=>after(j*520,()=>{
    document.querySelector('.sounding')?.classList.remove('sounding');
    document.querySelector('[data-idx="'+step+'"]').classList.add('sounding');
    tone(scale[step].midi,.65);
  }));
  after((steps.length-1)*520+700,stop);
};
function wave(){
  const canvas=$('#wave'),box=canvas.getBoundingClientRect(),w=box.width,h=box.height,dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  for(let j=0;j<38;j++){
    const v=j/37;ctx.beginPath();
    for(let px=0;px<=w;px+=1.5){
      const t=px/w;
      const y=h*(.52+.12*Math.sin(t*6.5+v*2.7)+.24*Math.sin(t*10.8-v*3.45)*Math.sin(t*Math.PI)+.13*(v-.5));
      if(px===0)ctx.moveTo(px,y);else ctx.lineTo(px,y);
    }
    ctx.strokeStyle='hsla('+(257+v*21)+',78%,'+(62+v*14)+'%,'+(.4+v*.32)+')';ctx.lineWidth=.85;ctx.stroke();
  }
}
render();wave();
new ResizeObserver(()=>{cancelFlights();drawScale();wave()}).observe($('.panel'));
