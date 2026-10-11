import {mountOfficeEntry} from './office-entry.mjs?v=132';
const entry=mountOfficeEntry();
window.addEventListener('pagehide',()=>entry?.dispose());
