// In-memory display lease shared by the catalog and current resident. No persistent authority.
export const AUTHORITY_LEASE_MS=120000;
export const AUTHORITY_REFRESH_MS=55000;
const transient=new Set(['unavailable','timeout','transport_busy','session_pending','lock_busy','backend_unavailable']);
export const isTransientAuthorityError=error=>transient.has(error?.message||error);
export const authorityIsCurrent=(checkedAt,now)=>Number.isFinite(checkedAt)&&Number.isFinite(now)&&now>=checkedAt&&now-checkedAt<AUTHORITY_LEASE_MS;

// Event wakeups reuse a fresh validation; regular refresh and expiry remain unchanged.
export function authorityRefreshDue(snapshot,now=Date.now()){
 return !snapshot||!['current','standby','observe','preparing','offline'].includes(snapshot.phase)||
  !authorityIsCurrent(snapshot.checked_at,now)||now-snapshot.checked_at>=AUTHORITY_REFRESH_MS;
}
