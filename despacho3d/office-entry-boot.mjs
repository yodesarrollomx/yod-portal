import {mountOfficeEntry} from './office-entry.mjs?v=143';
const entry=mountOfficeEntry();
window.addEventListener('pagehide',()=>entry?.dispose());
