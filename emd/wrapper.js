(function () {
  'use strict';
  // Stay invisible and never load Google when embedded by another page.
  if (window.top !== window.self) return;
  const protocol = window.EMDProtocol;
  const frame = document.getElementById('portal');
  const status = document.getElementById('status');
  const message = document.getElementById('message');
  const retry = document.getElementById('retry');
  let session = null;
  let timer = null;
  document.body.hidden = false;

  function stop() {
    clearTimeout(timer);
    if (session) session.close();
    session = null;
    frame.hidden = true;
    frame.removeAttribute('src');
  }

  function fail(text, canRetry) {
    stop();
    status.hidden = false;
    message.textContent = text;
    retry.hidden = !canRetry;
  }

  function start() {
    stop();
    // Personal access belongs only in the parent fragment, never in a query.
    if (location.search || !protocol.validFragment(location.hash)) {
      fail('El enlace no es válido. Abre el enlace personal completo que recibiste.', false);
      return;
    }
    status.hidden = false;
    message.textContent = 'Cargando tu evaluación…';
    retry.hidden = true;
    try {
      const nonce = protocol.createNonce(window.crypto);
      const url = protocol.frameURL(window.EMD_ENDPOINT, nonce);
      session = protocol.createSession(nonce, location.hash, function () {
        clearTimeout(timer);
        status.hidden = true;
        frame.hidden = false;
      });
      timer = setTimeout(function () {
        fail('No pudimos conectar con la evaluación. Puedes reintentar la conexión.', true);
      }, protocol.TIMEOUT_MS);
      frame.src = url;
    } catch (_) {
      fail('No pudimos iniciar la conexión segura. Puedes reintentar.', true);
    }
  }

  window.addEventListener('message', function (event) {
    if (session) session.receive(event);
  });
  window.addEventListener('hashchange', function () {
    fail('El enlace cambió. Reabre tu enlace personal para continuar.', false);
  });
  frame.addEventListener('error', function () {
    fail('No pudimos cargar la evaluación. Puedes reintentar la conexión.', true);
  });
  retry.addEventListener('click', start);
  start();
})();
