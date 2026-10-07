import {mountOfficeEntry} from './office-entry.mjs?v=1';
const entry=mountOfficeEntry();
window.addEventListener('pagehide',()=>entry?.dispose());
