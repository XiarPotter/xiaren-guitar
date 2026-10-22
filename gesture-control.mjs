// Dwell selection with smoothing and a dead band at zone boundaries.
export function createDwellControl({count=4,low=.12,high=.88,dwell=380,margin=.025}={}){
  let filtered, candidate=-1, since=0, committed=-1,lastSeen=-Infinity;
  return {reset(){filtered=undefined;candidate=-1;committed=-1;lastSeen=-Infinity;},
    update(value,time){
      if(time-lastSeen>650){filtered=undefined;candidate=-1;committed=-1;}
      lastSeen=time;
      filtered=filtered===undefined?value:filtered*.65+value*.35;
      const width=(high-low)/count;
      let zone=Math.max(0,Math.min(count-1,Math.floor((filtered-low)/width)));
      if(candidate>=0&&zone!==candidate&&filtered>low+candidate*width-margin&&filtered<low+(candidate+1)*width+margin)zone=candidate;
      if(zone!==candidate){candidate=zone;since=time;}
      const progress=Math.min(1,(time-since)/dwell);
      let trigger=false;
      if(progress>=1&&committed!==zone){committed=zone;trigger=true;}
      return {zone,progress,trigger,position:filtered};
    },missing(time){if(time-lastSeen>650){filtered=undefined;candidate=-1;committed=-1;} }
  };
}

// One downstroke per downward excursion; an upward return rearms it.
export function createDownstrokeControl({distance=.075,returnDistance=.055,cooldown=160}={}){
  let y,top,bottom,armed=true,lastSeen=-Infinity,lastHit=-Infinity;
  return {reset(){y=top=bottom=undefined;armed=true;lastSeen=-Infinity;lastHit=-Infinity;},
    update(value,time){
      if(time-lastSeen>450){y=top=bottom=value;armed=true;lastSeen=time;return false;}
      lastSeen=time;y=y*.45+value*.55;
      if(armed){top=Math.min(top,y);if(y-top>=distance&&time-lastHit>=cooldown){armed=false;bottom=y;lastHit=time;return true;}}
      else{bottom=Math.max(bottom,y);if(bottom-y>=returnDistance){armed=true;top=y;}}
      return false;
    }
  };
}

export function readFingerNumber(l){
  const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  const dot=(a,b,c)=>{const u=[a.x-b.x,a.y-b.y,a.z-b.z],v=[c.x-b.x,c.y-b.y,c.z-b.z];return u.reduce((n,x,i)=>n+x*v[i],0)/(Math.hypot(...u)*Math.hypot(...v)||1);};
  const open=[8,12,16,20].map(t=>d(l[t],l[0])>d(l[t-2],l[0])*1.14&&dot(l[t-1],l[t-2],l[t-3])<-.55);
  // Thumb extension is measured relative to palm size rather than a strict tip/IP ratio.
  const palmWidth=d(l[5],l[17]);
  const thumb=d(l[4],l[5])>palmWidth*.5
    &&dot(l[4],l[3],l[2])<-.35
    &&d(l[4],l[17])>d(l[3],l[17])*1.025;
  if(thumb&&open[3]&&!open[0]&&!open[1]&&!open[2])return 6;
  const count=open.filter(Boolean).length+(thumb?1:0);
  return count||null;
}
export function createNumberControl({dwell=150}={}){
  let candidate=null,since=0,lastSeen=-Infinity,committed=null;
  return {reset(){candidate=committed=null;lastSeen=-Infinity;},missing(time){if(time-lastSeen>350)candidate=null;},update(number,time){
    if(time-lastSeen>350||candidate!==number){candidate=number;since=time;}lastSeen=time;
    const progress=number===null?0:Math.min(1,(time-since)/dwell);
    const trigger=number!==null&&progress===1&&committed!==number;
    if(trigger)committed=number;
    return {zone:number===null?null:number-1,progress,trigger,number};
  }};
}

export function createOpenStrumControl(){
  let armed=false,pose=null,since=0,lastSeen=-Infinity;
  return {reset(){armed=false;pose=null;lastSeen=-Infinity;},get armed(){return armed;},
    update(fingerCount,time){
      if(time-lastSeen>450){armed=false;pose=null;}
      lastSeen=time;
      const next=fingerCount<=1?'fist':fingerCount>=4?'open':'between';
      if(next!==pose){pose=next;since=time;}
      if(pose==='fist'&&time-since>=70)armed=true;
      if(pose==='open'&&armed&&time-since>=60){armed=false;return true;}
      return false;
    }
  };
}
