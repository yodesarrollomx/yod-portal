import {mountOfficeEntry} from './office-entry.mjs?v=126';
const entry=mountOfficeEntry();
window.addEventListener('pagehide',()=>entry?.dispose());
