export type AceAllow = boolean | undefined;

export interface AclApi {
  addAce(principal: string | number, ace: string, allow?: AceAllow): void;
  removeAce(principal: string | number, ace: string, allow?: AceAllow): void;

  addPrincipal(child: string | number, parent: string): void;
  removePrincipal(child: string | number, parent: string): void;
}