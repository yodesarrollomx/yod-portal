'use strict';
(function (root) {
  const M = root.JarvisGraph;
  let directory = null;
  const chosen = new Map();
  async function digest(bytes) {
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  async function inspect(file, expected) {
    M.safeParts(expected.path);
    if (file.name !== M.basename(expected.path)) throw Error('Elige el archivo ' + M.basename(expected.path));
    if (file.size > 5 * 1024 * 1024) throw Error('El archivo supera el límite de lectura de 5 MB.');
    const bytes = await file.arrayBuffer(), hash = await digest(bytes);
    const text = new TextDecoder().decode(bytes);
    if (text.includes('\0')) throw Error('El archivo no parece código de texto.');
    if (text.split('\n').length > 50000) throw Error('El archivo supera el límite de 50,000 líneas del visor.');
    return {text, hash, matches: hash === expected.sha256, name: file.name};
  }
  async function fromDirectory(expected) {
    if (!directory) return null;
    const parts = M.safeParts(expected.path);
    let different = null;
    // Only exact suffixes from the allowlisted manifest; never enumerate directories.
    for (let start = 0; start < parts.length; start++) {
      try {
        let parent = directory;
        for (const part of parts.slice(start, -1)) parent = await parent.getDirectoryHandle(part);
        const handle = await parent.getFileHandle(parts.at(-1));
        const result = await inspect(await handle.getFile(), expected);
        if (result.matches) return result;
        different ||= result;
      } catch (error) { if (!['NotFoundError', 'TypeMismatchError'].includes(error.name)) throw error; }
    }
    return different;
  }
  async function read(expected) {
    if (chosen.has(expected.path)) return inspect(chosen.get(expected.path), expected);
    return fromDirectory(expected);
  }
  function pick(expected) {
    // File inputs work in embedded viewers as well; no upload or persistent permission.
    return new Promise(resolve => {
      const input = document.createElement('input'); input.type = 'file';
      input.accept = '.' + M.basename(expected.path).split('.').pop();
      input.addEventListener('change', async () => {
        try { const file = input.files[0]; if (!file) return resolve(null); const result = await inspect(file, expected); chosen.set(expected.path, file); resolve(result); }
        catch (error) { resolve({error: error.message}); }
        finally { input.remove(); }
      }, {once: true});
      input.addEventListener('cancel', () => {input.remove(); resolve(null);}, {once: true});
      input.hidden = true; document.body.append(input); input.click();
    });
  }
  async function connect() {
    if (!window.showDirectoryPicker || window.top !== window.self) throw Error('Abre el visor en grande para conectar una carpeta; también puedes elegir un archivo aquí.');
    directory = await window.showDirectoryPicker({mode: 'read', id: 'jarvis-code'});
    return directory.name;
  }
  root.JarvisSource = {digest, inspect, read, pick, connect, disconnect() {directory = null; chosen.clear();}};
})(globalThis);
