// Existing 3D consumers retain their portrait; shared controls live in the renderer-free core.
export * from './agent-workspace-core.mjs?v=retro1';
import {createWorkspace as createCoreWorkspace} from './agent-workspace-core.mjs?v=retro1';
import {mountAvatarCard} from './avatar-card.mjs?v=controls293';

export function createWorkspace(options) {
 return createCoreWorkspace({...options,mountAvatarCard});
}
