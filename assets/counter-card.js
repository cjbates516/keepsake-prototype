/* A customer-triggered local preview download. Never an upload or print file. */
window.KPCounterCard = (() => {
  function lines(ctx, value, width) {
    const result=[];
    for (const paragraph of String(value).split('\n')) {
      let line='';
      for (const word of paragraph.split(/\s+/)) {
        const candidate=line?line+' '+word:word;
        if (ctx.measureText(candidate).width<=width) {line=candidate;continue;}
        if(line)result.push(line);
        line='';
        const chars=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(word),s=>s.segment):Array.from(word);
        for(const char of chars){
          if(line && ctx.measureText(line+char).width>width){result.push(line);line='';}
          line+=char;
        }
      }
      result.push(line);
    }
    return result;
  }
  function bounds(canvas) {
    const w=canvas.width,h=canvas.height,p=canvas.getContext('2d').getImageData(0,0,w,h).data;
    let left=w,top=h,right=-1,bottom=-1;
    for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
      if(p[(y*w+x)*4+3]<16)continue;
      left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
    }
    if(right<left)throw Error('Case preview unavailable');
    return [Math.max(0,left-6),Math.max(0,top-6),Math.min(w,right+7)-Math.max(0,left-6),Math.min(h,bottom+7)-Math.max(0,top-6)];
  }
  function create({preview,code,rows}) {
    const crop=bounds(preview),card=document.createElement('canvas');card.width=900;
    const ctx=card.getContext('2d');
    ctx.font='700 34px Arial';
    const codeLines=lines(ctx,code,804);
    const entries=rows.map(([label,value])=>{
      ctx.font='28px Arial';const labels=lines(ctx,label,260);
      ctx.font='700 32px Arial';const values=lines(ctx,value,520);
      return {labels,values,height:Math.max(labels.length,values.length)*40+24};
    });
    const footer='Preview only. Confirm the design and total with the team before paying.';
    ctx.font='26px Arial';const footLines=lines(ctx,footer,804);
    card.height=180+460+codeLines.length*44+36+entries.reduce((n,r)=>n+r.height,0)+footLines.length*36+70;
    ctx.fillStyle='#fcfaf6';ctx.fillRect(0,0,card.width,card.height);ctx.textBaseline='top';
    ctx.fillStyle='#211f22';ctx.font='900 52px Arial';ctx.fillText('KEEPSAKE',48,42);
    ctx.font='28px Arial';ctx.fillText('Show this card at the counter',48,108);
    ctx.fillStyle='#e8e5ed';ctx.fillRect(48,166,804,460);
    const scale=Math.min(756/crop[2],428/crop[3]),w=crop[2]*scale,h=crop[3]*scale;
    ctx.drawImage(preview,...crop,(900-w)/2,166+(460-h)/2,w,h);
    let y=658;ctx.fillStyle='#a9232b';ctx.font='700 34px Arial';
    for(const text of codeLines){ctx.fillText(text,48,y);y+=44;}y+=24;
    for(const entry of entries){
      ctx.fillStyle='#595459';ctx.font='28px Arial';entry.labels.forEach((text,i)=>ctx.fillText(text,48,y+i*40));
      ctx.fillStyle='#211f22';ctx.font='700 32px Arial';entry.values.forEach((text,i)=>ctx.fillText(text,332,y+i*40));
      y+=entry.height;
    }
    ctx.fillStyle='#595459';ctx.font='26px Arial';y+=16;
    footLines.forEach((text,i)=>ctx.fillText(text,48,y+i*36));
    return new Promise((resolve,reject)=>card.toBlob(blob=>blob?resolve(blob):reject(Error('Could not create counter card')),'image/png'));
  }
  return {create};
})();
