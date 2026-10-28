import {mountOfficeEntry} from './office-entry.mjs?v=status1';
const entry=mountOfficeEntry();
window.addEventListener('pagehide',()=>entry?.dispose());
