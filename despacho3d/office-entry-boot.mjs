import {mountOfficeEntry} from './office-entry.mjs?v=records1';
const entry=mountOfficeEntry();
window.addEventListener('pagehide',()=>entry?.dispose());
