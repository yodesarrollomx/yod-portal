import {mountOfficeEntry} from './office-entry.mjs?v=records2';
const entry=mountOfficeEntry();
window.addEventListener('pagehide',()=>entry?.dispose());
