import crypto from "crypto";

/**
 * La signature que `prepare` pose sur la demande du visiteur (mission 15,
 * partie 4) : le site ne construit plus de prompt, il signe la pièce, les
 * sélections `{ surface, ref }`, l'expiration et le parcours. Le CRM recalcule
 * la même chaîne (`crm/src/lib/site/contrat-simulate.ts › chaineSigneeSelections`)
 * avec le secret partagé SIMULATE_TOKEN_SECRET et relit lui-même zones et
 * références. Une ligne par élément, dans l'ordre envoyé, préfixée `v2`.
 */

export type SelectionSignee = { surface: string; ref: string };
export type EntreeSignature = { parcoursId: string; projet: string; selections: SelectionSignee[]; exp: number };

export function chaineSignee(entree: EntreeSignature): string {
  return `v2\n${entree.parcoursId}\n${entree.projet}\n${entree.selections.map((s) => `${s.surface}:${s.ref}`).join(",")}\n${entree.exp}`;
}

export function signerSelections(secret: string, entree: EntreeSignature): string {
  return crypto.createHmac("sha256", secret).update(chaineSignee(entree)).digest("hex");
}

/** Le navigateur a ce délai pour transmettre la demande signée au CRM. */
export const VALIDITE_SIGNATURE_MS = 90_000;
