import {mountOfficeEntry} from './office-entry.mjs?v=2';
const entry=mountOfficeEntry();
window.addEventListener('pagehide',()=>entry?.dispose());
