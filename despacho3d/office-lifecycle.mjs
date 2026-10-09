// CHG-DESPACHO-INTEGRAL-126: disposed runtimes are never reused after history restoration.
export const RECOVERY_PARAMETER = 'office_recovery';
export function recoveryAddress(address) {
  const url = new URL(address);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Origen de despacho no válido');
  url.hash = '';
  url.searchParams.set(RECOVERY_PARAMETER, 'history');
  return url.href;
}

export function installOfficeLifecycle({window: win, document: doc, navigate,
  schedule = callback => win.setTimeout(callback, 0), cancel = id => win.clearTimeout(id)} = {}) {
  if (!win || !doc) throw new Error('El ciclo del despacho requiere una ventana');
  let phase = 'active', timer = null, curtain = null, notice = null, disposed = false;
  const address = new URL(win.location.href);
  let needsExplicitVoice = address.searchParams.get(RECOVERY_PARAMETER) === 'history';
  const recovered = needsExplicitVoice;
  const replace = navigate || (url => win.location.replace(url));
  // Only a public lifecycle marker crosses navigation. No case, draft, transcript or credential.
  if (recovered) {
    address.searchParams.delete(RECOVERY_PARAMETER);
    try { win.history.replaceState(null, '', address.href); } catch {}
    notice = doc.createElement('aside');
    notice.dataset.officeRecoveryNotice = '';
    notice.setAttribute('role', 'status');
    notice.style.cssText = 'position:fixed;z-index:2147483646;left:16px;right:16px;top:16px;padding:14px 18px;border:1px solid #cad5cc;border-radius:16px;background:#f6f7f1;color:#203d36;box-shadow:0 8px 30px #142d251f;font:14px/1.5 system-ui;display:flex;align-items:center;gap:16px';
    const message = doc.createElement('span');
    message.textContent = 'Volviste al despacho. El acceso se valida de nuevo. Pulsa Hablar para iniciar otra conversación.';
    const close = doc.createElement('button');
    close.type = 'button'; close.textContent = 'Entendido';
    close.style.cssText = 'margin-left:auto;padding:8px 12px;border:1px solid #c5d0c7;border-radius:10px;background:transparent;color:inherit;cursor:pointer';
    close.addEventListener('click', () => { notice?.remove(); notice = null; });
    notice.append(message, close); doc.body.append(notice);
  }
  function renderCurtain(failed = false) {
    // Hide every old panel before the BFCache snapshot can become interactive.
    doc.documentElement.setAttribute('data-office-recovery', 'retired');
    if (!curtain) {
      curtain = doc.createElement('section');
      curtain.dataset.officeRecovery = '';
      curtain.setAttribute('role', 'alertdialog');
      curtain.setAttribute('aria-modal', 'true');
      curtain.setAttribute('aria-labelledby', 'office-recovery-title');
      curtain.tabIndex = -1;
      curtain.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;gap:14px;padding:32px;background:#f6f4ed;color:#203d36;font:16px/1.6 system-ui';
      const style = doc.createElement('style');
      style.textContent = 'html[data-office-recovery="retired"] body > :not([data-office-recovery]){visibility:hidden!important}html[data-office-recovery="retired"] [data-office-recovery]{visibility:visible!important}';
      const title = doc.createElement('h1');
      title.id = 'office-recovery-title'; title.textContent = 'Recuperando tu despacho';
      title.style.cssText = 'font-size:clamp(24px,4vw,36px);font-weight:600;margin:0';
      const message = doc.createElement('p'); message.dataset.recoveryMessage = '';
      message.style.cssText = 'max-width:44ch;margin:0';
      const retry = doc.createElement('button');
      retry.type = 'button'; retry.textContent = 'Recuperar despacho';
      retry.style.cssText = 'justify-self:start;border:0;border-radius:12px;background:#203d36;color:white;padding:12px 20px;font:inherit;cursor:pointer';
      retry.addEventListener('click', retryNavigation);
      curtain.append(style, title, message, retry); doc.body.append(curtain);
    }
    curtain.querySelector('[data-recovery-message]').textContent = failed
      ? 'La oficina no pudo recargarse. Inténtalo de nuevo para validar tu acceso y recuperar sus controles.'
      : 'Estamos abriendo una oficina nueva y validando tu acceso. La conversación anterior no se reanudará.';
    curtain.focus({preventScroll: true});
  }
  function retryNavigation() {
    if (disposed || phase !== 'recovering') return;
    try { replace(recoveryAddress(win.location.href)); }
    catch { renderCurtain(true); }
  }
  function blockRetiredInput(event) {
    if (phase === 'active' || curtain?.contains(event.target)) return;
    event.preventDefault(); event.stopImmediatePropagation();
  }
  function retire() {
    if (disposed) return;
    phase = 'retired'; needsExplicitVoice = true;
    if (timer !== null) { cancel(timer); timer = null; }
    renderCurtain();
  }
  function restore(event) {
    if (disposed || !event.persisted || phase === 'recovering') return;
    phase = 'recovering'; needsExplicitVoice = true; renderCurtain();
    timer = schedule(() => { timer = null; retryNavigation(); });
  }
  const inputs = ['click', 'pointerdown', 'keydown', 'submit'];
  inputs.forEach(type => win.addEventListener(type, blockRetiredInput, true));
  win.addEventListener('pagehide', retire, true);
  win.addEventListener('pageshow', restore, true);
  return Object.freeze({
    automaticVoiceAllowed: () => !disposed && phase === 'active' && !needsExplicitVoice,
    allowVoiceFromGesture() {
      if (disposed || phase !== 'active') return false;
      needsExplicitVoice = false; notice?.remove(); notice = null; return true;
    },
    snapshot: () => Object.freeze({phase, recovered, needsExplicitVoice}),
    dispose() {
      disposed = true;
      if (timer !== null) cancel(timer);
      win.removeEventListener('pagehide', retire, true);
      win.removeEventListener('pageshow', restore, true);
      inputs.forEach(type => win.removeEventListener(type, blockRetiredInput, true));
      // Never uncover the retired private panels. Disposal is not recovery.
      notice?.remove(); notice = null;
    }
  });
}
if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.YodOfficeLifecycle)
  window.YodOfficeLifecycle = installOfficeLifecycle({window, document});
