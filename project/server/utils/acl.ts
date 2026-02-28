import type { AclApi, AceAllow } from '../../common/types/acl';

function allowAce(allow: AceAllow): 'allow' | 'deny' {
  return allow === false ? 'deny' : 'allow';
}

function normalizePrincipal(p: string | number): string {
  return typeof p === 'number' ? `player.${p}` : p;
}

export const acl: AclApi = {
  addAce(principal, ace, allow) {
    const p = normalizePrincipal(principal);
    ExecuteCommand(`add_ace ${p} ${ace} ${allowAce(allow)}`);
  },

  removeAce(principal, ace, allow) {
    const p = normalizePrincipal(principal);
    ExecuteCommand(`remove_ace ${p} ${ace} ${allowAce(allow)}`);
  },

  addPrincipal(child, parent) {
    const c = normalizePrincipal(child);
    ExecuteCommand(`add_principal ${c} ${parent}`);
  },

  removePrincipal(child, parent) {
    const c = normalizePrincipal(child);
    ExecuteCommand(`remove_principal ${c} ${parent}`);
  },
};

// Convenience named exports (matches what commands.ts expects)
export const addAce = acl.addAce;
export const removeAce = acl.removeAce;
export const addPrincipal = acl.addPrincipal;
export const removePrincipal = acl.removePrincipal;
