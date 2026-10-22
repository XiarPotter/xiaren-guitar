import {createDwellControl,createOpenStrumControl,createNumberControl,readFingerNumber} from './gesture-control.mjs?v=open-strum-1';
const $=id=>document.getElementById(id);
const chords=[{id:'C',name:'C 大三和弦',notes:[48,52,55,60,64],names:'C · E · G',frets:[-1,3,2,0,1,0]},{id:'G',name:'G 大三和弦',notes:[43,47,50,55,59,67],names:'G · B · D',frets:[3,2,0,0,0,3]},{id:'Am',name:'A 小三和弦',notes:[45,52,57,60,64],names:'A · C · E',frets:[-1,0,2,2,1,0]},{id:'F',name:'F 大三和弦',notes:[41,48,53,57,60,65],names:'F · A · C',frets:[1,3,3,2,1,1]},{id:'Em',name:'E 小三和弦',notes:[40,47,52,55,59,64],names:'E · G · B',frets:[0,2,2,0,0,0]},{id:'Dm',name:'D 小三和弦',notes:[50,57,62,65],names:'D · F · A',frets:[-1,-1,0,2,3,1]}];
let selected=0,mode='strum',audio,master,stream,tracker,running=false,starting=false,demo=false,raf,lastFrame=-1,lastProcess=0,handStates=[{},{}],autoAllowed=false,autoTimer,arp=0,lastPluck=0,activeSources=new Set();
function diagram(frets){let s='<svg viewBox="0 0 120 104" aria-label="当前和弦吉他指法" role="img">';for(let i=0;i<6;i++)s+=`<path d="M${20+i*16} 22V94" stroke="#9eaa93" stroke-width="${.7+i*.1}"/>`;for(let i=0;i<5;i++)s+=`<path d="M20 ${22+i*18}H100" stroke="#9eaa93" stroke-width="${i?1:3}"/>`;frets.forEach((f,i)=>s+=f>0?`<circle cx="${20+i*16}" cy="${22+(f-.5)*18}" r="5" fill="#607c4e"/>`:`<text x="${20+i*16}" y="14" text-anchor="middle" font-size="11" fill="#819172">${f<0?'×':'○'}</text>`);return s+'</svg>';}
$('chords').innerHTML=chords.map((c,i)=>`<button class="chord-card" data-chord="${i}" aria-label="${c.name}，快捷键 ${i+1}"><b>${c.id}<small>${['明亮','开阔','温柔','温暖','沉静','细腻'][i]}</small></b><span>快捷键 ${i+1}</span></button>`).join('');
function selectChord(i){selected=i;const c=chords[i];$('chord').textContent=c.id;$('chordName').textContent=c.name;$('notes').textContent=c.names;$('diagram').innerHTML=diagram(c.frets);document.querySelectorAll('[data-chord]').forEach((b,n)=>{b.classList.toggle('active',n===i);b.setAttribute('aria-pressed',String(n===i));});}
selectChord(0);
async function initAudio(){if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=+$('volume').value/100*.65;const limiter=audio.createDynamicsCompressor();limiter.threshold.value=-15;limiter.ratio.value=6;master.connect(limiter);limiter.connect(audio.destination);}await audio.resume();}
function pluck(midi,delay=0,velocity=.65){if(!audio||audio.state!=='running')return;const freq=440*2**((midi-69)/12),size=Math.round(audio.sampleRate/freq),length=Math.floor(audio.sampleRate*2.7),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0),ring=new Float32Array(size);for(let i=0;i<size;i++)ring[i]=(Math.random()*2-1)*velocity;let p=0;for(let i=0;i<length;i++){const v=ring[p];ring[p]=.497*(v+ring[(p+1)%size]);data[i]=v*Math.min(1,i/100)*Math.exp(-i/(audio.sampleRate*2));p=(p+1)%size;}const source=audio.createBufferSource();source.buffer=buffer;source.connect(master);activeSources.add(source);source.onended=()=>activeSources.delete(source);source.start(audio.currentTime+delay);}
function pop(label){$('chordPop').textContent=label;$('chordPop').classList.remove('pop');void $('chordPop').offsetWidth;$('chordPop').classList.add('pop');}
function strum(reverse=false){const ns=[...chords[selected].notes];if(reverse)ns.reverse();ns.forEach((n,i)=>pluck(n,i*.023,.45));pop(chords[selected].id);}
function silence(){activeSources.forEach(s=>{try{s.stop();}catch{}});activeSources.clear();}
function resetAuto(){clearTimeout(autoTimer);function tick(){if($('auto').checked&&(demo||autoAllowed)){const ns=chords[selected].notes;pluck(ns[arp++%ns.length],0,.4);if(arp%ns.length===1)pop(chords[selected].id);}autoTimer=setTimeout(tick,60000/+$('tempo').value/2);}tick();}
$('auto').onchange=async()=>{await initAudio();resetAuto();};$('tempo').oninput=()=>{$('tempoOut').textContent=$('tempo').value+' BPM';resetAuto();};$('volume').oninput=()=>{$('volumeOut').textContent=$('volume').value+'%';if(master)master.gain.setTargetAtTime(+$('volume').value/100*.65,audio.currentTime,.03);};
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});resetGestures();updateGuide();});
document.querySelectorAll('[data-chord]').forEach(b=>b.onclick=async()=>{await initAudio();selectChord(+b.dataset.chord);strum();});$('strum').onclick=async()=>{await initAudio();strum();};
document.addEventListener('keydown',async e=>{if(e.repeat||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;if(['1','2','3','4','5','6',' '].includes(e.key)){e.preventDefault();await initAudio();if(e.key!==' ')selectChord(+e.key-1);strum();}else if('asdfghjk'.includes(e.key.toLowerCase())){await initAudio();const i='asdfghjk'.indexOf(e.key.toLowerCase());pluck([60,62,64,65,67,69,71,72][i]);pop(['C','D','E','F','G','A','B','C'][i]);}});
function enterDemo(){demo=true;$('empty').hidden=true;$('status').textContent='● 键盘 / 鼠标模式';$('hint').textContent='1–6 切换和弦 · 空格扫弦 · A S D F G H J K 弹旋律';$('stop').hidden=false;$('stop').textContent='退出试玩';$('notice').textContent='随时点击「退出试玩」开启摄像头。旋律快捷键 A–K 对应 C 大调音阶。';resetAuto();}
$('demo').onclick=async()=>{await initAudio();enterDemo();};
let controlStyle='easy';
const downstroke=createOpenStrumControl();
const numberControl=createNumberControl();
const chordControl=createDwellControl({count:chords.length,low:.15,high:.85,dwell:450}), melodyControl=createDwellControl({count:8,low:.15,high:.85,dwell:220,margin:.018});
function resetGestures(){handStates=[{},{}];downstroke.reset();numberControl.reset();chordControl.reset();melodyControl.reset();}
$('controlStyle').onchange=()=>{controlStyle=$('controlStyle').value;resetGestures();updateGuide();};
function updateGuide(){$('zoneLeft').textContent=controlStyle==='easy'?(mode==='strum'?'左区比数字 1–6 · 停稳锁定':'单手上下移动 · 停稳即弹'):'选和弦区 · 数字 1–6';$('zoneRight').textContent=controlStyle==='easy'?(mode==='strum'?'右区握拳准备 · 张开弹奏':'无需比手势'):(mode==='strum'?'演奏区 · 握拳后张开':'演奏区 · 上下选音，捏合弹奏');$('zones').classList.toggle('easy',controlStyle==='easy');}
updateGuide();
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function fingers(l){return [8,12,16,20].filter(t=>dist(l[t],l[0])>dist(l[t-2],l[0])*1.16).length;}
const edges=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function processHands(result,time){const cv=$('overlay'),ctx=cv.getContext('2d');cv.width=$('stage').clientWidth;cv.height=$('stage').clientHeight;const scale=Math.min(cv.width/$('video').videoWidth,cv.height/$('video').videoHeight),w=$('video').videoWidth*scale,h=$('video').videoHeight*scale,ox=(cv.width-w)/2,oy=(cv.height-h)/2;const xy=p=>[ox+(1-p.x)*w,oy+p.y*h];if(controlStyle==='easy'&&mode==='strum'){
  let left=false,right=false;
  const palm=l=>({x:(l[0].x+l[5].x+l[9].x+l[17].x)/4,y:(l[0].y+l[5].y+l[9].y+l[17].y)/4});
  const hands=[...result.landmarks].sort((a,b)=>dist(b[0],b[9])-dist(a[0],a[9]));
  let candidate;
  for(const l of hands){
    const p=palm(l),x=1-p.x;
    if(x<.46&&!left){left=true;candidate=numberControl.update(readFingerNumber(l),time);if(candidate.trigger){selectChord(candidate.zone);pop(chords[selected].id+' 已锁定');}}
    else if(x>.54&&!right){right=true;if(downstroke.update(fingers(l),time))strum();}
    ctx.strokeStyle=x<.5?'#d5ec9b':'#f7d5a1';ctx.lineWidth=2;
    edges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(...xy(l[a]));ctx.lineTo(...xy(l[b]));ctx.stroke();});
    const [cx,cy]=xy(p);ctx.beginPath();ctx.arc(cx,cy,7,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();
    if(x<.46&&candidate){ctx.beginPath();ctx.arc(cx,cy,23,-Math.PI/2,-Math.PI/2+Math.PI*2*candidate.progress);ctx.lineWidth=4;ctx.stroke();}
  }
  if(!left)numberControl.missing(time);
  for(let i=0;i<chords.length;i++){
    const x=ox+w*.08,y=oy+h*(.15+i*(.7/chords.length)),rw=w*.36,rh=h*.7/chords.length;
    ctx.fillStyle=selected===i?'#d5ec9b44':'#ffffff0c';ctx.fillRect(x,y,rw,rh);ctx.strokeStyle='#d5ec9b55';ctx.lineWidth=1;ctx.strokeRect(x,y,rw,rh);
    ctx.fillStyle='#e4ffb1';ctx.font='bold 22px sans-serif';ctx.textAlign='left';ctx.fillText((i+1)+' · '+chords[i].id+(selected===i?' ✓':''),x+12,y+rh/2+7);
  }
  ctx.strokeStyle='#f7d5a166';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ox+w*.62,oy+h*.55);ctx.lineTo(ox+w*.94,oy+h*.55);ctx.stroke();ctx.fillStyle='#f7d5a1';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText(downstroke.armed?'✋ 张开五指，弹奏':'✊ 先握拳，再张开',ox+w*.78,oy+h*.7);
  $('status').textContent='● '+(candidate?.number?'识别 '+candidate.number+' · ':'')+chords[selected].id+' 已锁定';$('hint').textContent=left&&candidate?.zone!==null&&candidate?.progress<1?'识别数字 '+candidate.number+' · 保持一下，选择 '+chords[candidate.zone].id:'左区比 1–5 指；6 = 拇指＋小指 · 握拳保持和弦，右区握拳后张开弹奏';autoAllowed=right;
  return;
}
if(controlStyle==='easy'){
  const hands=[...result.landmarks].sort((a,b)=>dist(b[0],b[9])-dist(a[0],a[9]));
  const l=hands[0];
  if(!l){chordControl.missing(time);melodyControl.missing(time);autoAllowed=false;$('status').textContent='● 举起一只手即可';$('hint').textContent='让手掌完整进入画面，不用比手势。';return;}
  const center={x:(l[0].x+l[5].x+l[9].x+l[17].x)/4,y:(l[0].y+l[5].y+l[9].y+l[17].y)/4};
  const state=mode==='strum'?chordControl.update(1-center.x,time):melodyControl.update(1-center.y,time);
  const count=mode==='strum'?chords.length:8,lo=mode==='strum'?.12:.15,hi=mode==='strum'?.88:.85,labels=mode==='strum'?chords.map(c=>c.id):['C','D','E','F','G','A','B','C'];
  ctx.font='bold 22px sans-serif';ctx.textAlign='center';
  for(let i=0;i<count;i++){
    const size=(hi-lo)/count;
    const x=mode==='strum'?ox+(lo+i*size)*w:ox+w*.1, y=mode==='strum'?oy+h*.12:oy+(1-hi+i*size)*h;
    const rw=mode==='strum'?size*w:w*.8,rh=mode==='strum'?h*.72:size*h;
    const index=mode==='strum'?i:count-1-i;
    ctx.fillStyle=index===state.zone?'#d5ec9b33':'#ffffff08';ctx.fillRect(x,y,rw,rh);
    ctx.strokeStyle=index===state.zone?'#d5ec9b99':'#ffffff22';ctx.strokeRect(x,y,rw,rh);
    ctx.fillStyle=index===state.zone?'#e4ffb1':'#ffffff88';ctx.fillText(labels[index],x+rw/2,y+(mode==='strum'?rh-20:rh*.7));
  }
  ctx.strokeStyle='#d5ec9b';ctx.lineWidth=2;edges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(...xy(l[a]));ctx.lineTo(...xy(l[b]));ctx.stroke();});
  const [cx,cy]=xy(center);ctx.beginPath();ctx.arc(cx,cy,21,-Math.PI/2,-Math.PI/2+Math.PI*2*state.progress);ctx.lineWidth=5;ctx.strokeStyle='#e4ffb1';ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  $('status').textContent='● 单手轻松模式';$('hint').textContent=state.progress<1?'保持一下… '+labels[state.zone]:'已弹奏 '+labels[state.zone]+' · 移到下一区域继续';autoAllowed=true;
  if(state.trigger){if(mode==='strum'){selectChord(state.zone);strum();}else{pluck([60,62,64,65,67,69,71,72][state.zone]);pop(labels[state.zone]);}}
  return;
}
let seen=[false,false],chordVisible=false;for(const l of result.landmarks){const side=1-l[9].x<.5?0:1;seen[side]=true;const st=handStates[side],count=side===0?(readFingerNumber(l)||0):fingers(l);ctx.strokeStyle=side?'#f7d5a1':'#d5ec9b';ctx.lineWidth=2;edges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(...xy(l[a]));ctx.lineTo(...xy(l[b]));ctx.stroke();});l.forEach(p=>{ctx.beginPath();ctx.arc(...xy(p),3,0,Math.PI*2);ctx.fillStyle='#eff8db';ctx.fill();});if(side===0){chordVisible=count>0;if(st.candidate!==count){st.candidate=count;st.since=time;}if(time-st.since>240){if(count>0&&count<=6&&selected!==count-1){selectChord(count-1);pop(chords[selected].id);}}}else{const y=l[9].y,dy=st.y===undefined?0:y-st.y,dt=time-(st.time||time),velocity=dt>0?dy/dt:0;st.y=y;st.time=time;if(mode==='strum'&&downstroke.update(count,time)){strum();lastPluck=time;}if(mode==='melody'&&count>0){const notes=[60,62,64,65,67,69,71,72],idx=Math.max(0,Math.min(7,Math.floor((.85-l[8].y)/.7*8))),pinch=dist(l[4],l[8])/dist(l[0],l[9]);$('hint').textContent='旋律 '+['C','D','E','F','G','A','B','C'][idx]+' · 捏合拇指与食指弹奏';if(pinch<.3&&!st.pinched&&time-lastPluck>180){pluck(notes[idx]);pop(['C','D','E','F','G','A','B','C'][idx]);lastPluck=time;}if(pinch<.3)st.pinched=true;else if(pinch>.48)st.pinched=false;}}}
autoAllowed=chordVisible;seen.forEach((s,i)=>{if(!s)handStates[i]={};});if(!seen.some(Boolean)){autoAllowed=false;$('status').textContent='● 请将双手放入画面';if(mode==='strum')$('hint').textContent='在明亮环境中，手掌朝向摄像头，露出全部手指。';}else{$('status').textContent='● 已识别 '+seen.filter(Boolean).length+' 只手';if(mode==='strum')$('hint').textContent='左侧手选和弦 · 右侧手握拳后张开弹奏';}}
function frame(time){if(!running)return;try{const v=$('video');if(v.readyState>=2&&v.currentTime!==lastFrame&&time-lastProcess>45){lastFrame=v.currentTime;lastProcess=time;processHands(tracker.detectForVideo(v,time),time);$('fps').textContent='TRACKING / ON';}raf=requestAnimationFrame(frame);}catch(e){$('notice').textContent='识别中断：'+e.message+'。请关闭摄像头后重试，或使用键盘试玩。';stop();}}
async function start(){if(starting||running)return;starting=true;$('start').disabled=true;$('start').textContent='正在打开摄像头…';$('notice').textContent='';try{await initAudio();if(!navigator.mediaDevices?.getUserMedia)throw Error('当前环境不支持摄像头，请在 HTTPS 或 localhost 中用 Chrome / Edge 打开');stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:960},height:{ideal:600},facingMode:'user'},audio:false});$('video').srcObject=stream;await $('video').play();$('start').textContent='正在加载手势模型…';if(!tracker){const {HandLandmarker,FilesetResolver}=await import('./vendor/vision_bundle.mjs');const files=await FilesetResolver.forVisionTasks('./vendor/wasm');tracker=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./vendor/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.6,minHandPresenceConfidence:.6,minTrackingConfidence:.6});}running=true;demo=false;resetGestures();lastFrame=-1;$('empty').hidden=true;$('zones').hidden=false;$('stop').hidden=false;$('stop').textContent='关闭摄像头';resetAuto();raf=requestAnimationFrame(frame);}catch(e){stop();const reasons={NotAllowedError:'摄像头权限未开启。请在浏览器地址栏允许摄像头，再点击重试。',NotFoundError:'未找到摄像头，请连接摄像头后重试。',NotReadableError:'摄像头可能被其他应用占用，请关闭后重试。'};$('notice').textContent=reasons[e.name]||'启动失败：'+e.message+'。请刷新重试，或先用键盘 / 鼠标试玩。';$('notice').scrollIntoView({block:'nearest',behavior:'smooth'});}finally{starting=false;$('start').disabled=false;$('start').textContent='开启摄像头，开始弹奏 ↗';}}
function stop(){running=false;demo=false;autoAllowed=false;cancelAnimationFrame(raf);clearTimeout(autoTimer);silence();stream?.getTracks().forEach(t=>t.stop());stream=null;$('video').srcObject=null;$('overlay').getContext('2d').clearRect(0,0,$('overlay').width,$('overlay').height);$('empty').hidden=false;$('zones').hidden=true;$('stop').hidden=true;$('status').textContent='● 等待开始';$('fps').textContent='CAMERA / OFF';$('hint').textContent='准备好，弹出你的第一个和弦。';}
$('start').onclick=start;$('stop').onclick=stop;window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden){silence();autoAllowed=false;clearTimeout(autoTimer);}else if(running||demo)resetAuto();});
