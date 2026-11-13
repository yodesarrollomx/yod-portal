// One coordinate contract for the monitor's visible (+Z) side and the seated character.
export const PROJECT_DESK=Object.freeze([7,-7.1]);
export function deskSeat(x,z){return {position:[x,0,z+.85],rotationY:Math.PI};}
const seat=deskSeat(...PROJECT_DESK);
export const PROJECT_SEAT=Object.freeze({position:Object.freeze(seat.position),rotationY:seat.rotationY});
export const PROJECT_SCREEN=Object.freeze([7,1.23,-7.2]);
