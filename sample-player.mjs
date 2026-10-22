export const sampleSets={
  nylon:[[40,'E2'],[45,'A2'],[50,'D3'],[55,'G3'],[59,'B3'],[64,'E4'],[69,'A4'],[76,'E5']],
  acoustic:[[40,'E2'],[45,'A2'],[50,'D3'],[55,'G3'],[59,'B3'],[64,'E4'],[69,'A4'],[72,'C5']]
};
export function nearestSample(samples,midi){return samples.reduce((best,item)=>Math.abs(item.midi-midi)<Math.abs(best.midi-midi)?item:best);}
export async function loadSamples(context,kind){
  if(!sampleSets[kind])throw Error('未知音源');
  return Promise.all(sampleSets[kind].map(async([midi,name])=>{
    const response=await fetch(new URL(`./samples/${kind}/${name}.mp3`,import.meta.url));
    if(!response.ok)throw Error(`音源加载失败：${response.status}`);
    const buffer=await context.decodeAudioData(await response.arrayBuffer());
    let peak=0;for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++)peak=Math.max(peak,Math.abs(data[i]));}
    return {midi,buffer,normalization:Math.min(3,.8/Math.max(.01,peak))};
  }));
}
export function playSample(context,output,samples,midi,delay,velocity,activeSources){
  const sample=nearestSample(samples,midi),source=context.createBufferSource(),gain=context.createGain();
  source.buffer=sample.buffer;source.playbackRate.value=2**((midi-sample.midi)/12);
  const start=context.currentTime+delay,duration=Math.min(5,sample.buffer.duration/source.playbackRate.value),end=start+duration;
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(velocity*sample.normalization,start+Math.min(.005,duration/4));
  gain.gain.setValueAtTime(velocity*sample.normalization,Math.max(start+.006,end-.12));gain.gain.linearRampToValueAtTime(0,end);
  source.connect(gain);gain.connect(output);activeSources.add(source);
  source.onended=()=>{activeSources.delete(source);source.disconnect();gain.disconnect();};source.start(start);source.stop(end);
}
