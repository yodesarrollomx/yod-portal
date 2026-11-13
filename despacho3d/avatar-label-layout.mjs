// Pixel-space presentation only. Preserve the projected world anchor after decluttering.
export function avatarConnector({anchor,rect,viewport,visible=true}={}){
 if(!visible||!anchor||!rect||!viewport)return null;
 const {x:ax,y:ay}=anchor,{x,y,w,h}=rect,{width,height}=viewport;
 if(![ax,ay,x,y,w,h,width,height].every(Number.isFinite)||w<=0||h<=0||width<=0||height<=0)return null;
 if(ax<0||ay<0||ax>width||ay>height||x<0||y<0||x+w>width||y+h>height)return null;
 // The ordinary centered label already has its small tail, 8px above the anchor.
 if(Math.abs(ax-(x+w/2))<=1&&Math.abs(ay-(y+h+8))<=1)return null;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),pad=Math.min(9,w/2,h/2);
 let from;
 if(ay>=y+h)from={x:clamp(ax,x+pad,x+w-pad),y:y+h};
 else if(ay<=y)from={x:clamp(ax,x+pad,x+w-pad),y};
 else if(ax<=x)from={x,y:clamp(ay,y+pad,y+h-pad)};
 else if(ax>=x+w)from={x:x+w,y:clamp(ay,y+pad,y+h-pad)};
 else return null;
 if(Math.hypot(from.x-ax,from.y-ay)<1)return null;
 return {from,to:{x:ax,y:ay}};
}
