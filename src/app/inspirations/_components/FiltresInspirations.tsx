import { FOCUS_FICHIER, classesBouton } from "@/components/simulation/Bouton";

/**
 * Les filtres de /inspirations (mission 19), SANS JavaScript : deux groupes de boutons radio (pièce, teinte) et des
 * règles CSS écrites par le serveur (`:has()`), qui masquent les ambiances qui ne correspondent pas et affichent le
 * compte de chaque combinaison (« 3 ambiances », « Aucune ambiance… »). Le serveur rend toutes les ambiances
 * (référencement, page lisible partout) ; rien n'est chargé de plus dans le navigateur. Les attributs posés sur chaque
 * ambiance : `data-inspiration`, `data-piece`, `data-teintes` (liste de jetons, `teinteJeton`).
 */
export type ChoixFiltre = { id: string; libelle: string; nombre: number };

/** Le jeton CSS d'une teinte (« Bois clair » → « bois-clair »). */
export const teinteJeton = (teinte: string) =>
  teinte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const PASTILLE =
  "inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-[var(--rayon-sm)] border border-trait bg-white px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre has-[:checked]:border-encre has-[:checked]:bg-encre has-[:checked]:text-blanc has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-encre";

function Groupe({ nom, libelle, choix }: { nom: "piece" | "teinte"; libelle: string; choix: ChoixFiltre[] }) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{libelle}</legend>
      {/* `relative` : les boutons radio (`sr-only`, en absolu) restent dans la rangée qui défile, sans élargir la page. */}
      <div className="relative flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ id: "", libelle: "Tout", nombre: -1 }, ...choix].map((c) => (
          <label key={c.id || "tout"} className={PASTILLE}>
            <input type="radio" name={nom} value={c.id} defaultChecked={c.id === ""} className="sr-only" />
            <span>{c.libelle}</span>
            {c.nombre >= 0 ? <span className="text-[13px] opacity-70">{c.nombre}</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const pluriel = (n: number) => (n === 0 ? "Aucune ambiance pour ce choix : essayez une autre teinte." : `${n} ambiance${n > 1 ? "s" : ""}`);

/**
 * Les règles CSS des filtres, pour la page (`<style>`) : chaque choix masque ce qui ne lui correspond pas ; le compte de
 * chaque combinaison est écrit d'avance (`content`). `racine` : le sélecteur de l'élément qui contient les filtres ET
 * la liste.
 */
const choisi = (nom: string, valeur: string) => `:has(input[name="${nom}"][value="${valeur}"]:checked)`;

export function reglesFiltres(racine: string, ambiances: readonly { piece: string; teintes: string[] }[], pieces: readonly string[], teintes: readonly string[]): string {
  const regles: string[] = [];
  for (const p of pieces) regles.push(`${racine}${choisi("piece", p)} [data-inspiration]:not([data-piece="${p}"]) { display: none; }`);
  for (const t of teintes) regles.push(`${racine}${choisi("teinte", t)} [data-inspiration]:not([data-teintes~="${t}"]) { display: none; }`);
  for (const p of ["", ...pieces]) {
    for (const t of ["", ...teintes]) {
      const n = ambiances.filter((a) => (!p || a.piece === p) && (!t || a.teintes.includes(t))).length;
      regles.push(`${racine}${choisi("piece", p)}${choisi("teinte", t)} [data-compte]::after { content: "${pluriel(n)}"; }`);
    }
  }
  return regles.join("\n");
}

/* ── La suite (site 3.0, lot C4) ─────────────────────────────────── */

/**
 * La page montre d'abord les `PREMIERES` ambiances du choix en cours ; le reste attend « Voir toutes les ambiances »
 * (une case à cocher, toujours sans JavaScript). Le serveur rend TOUTES les ambiances (référencement, ancres) : celles
 * de la suite sont seulement masquées, et leurs images, différées, ne se chargent donc pas. Une ambiance visée par
 * l'adresse (`/inspirations#<id>`, `:target`) se montre toujours.
 */
export const PREMIERES = 12;

/** Le jeton d'une combinaison pièce × teinte (« tout » pour « Tout ») : `cuisine--tout`, `tout--vert`. */
export const combinaison = (piece: string, teinte: string) => `${piece || "tout"}--${teinte || "tout"}`;

const toutesLesCombinaisons = (pieces: readonly string[], teintes: readonly string[]) => ["", ...pieces].flatMap((p) => ["", ...teintes].map((t) => [p, t] as const));

/**
 * Pour chaque ambiance (dans l'ordre de la page), les combinaisons où elle vient APRÈS les `premieres` : la valeur de
 * son `data-suite` (vide si elle est toujours parmi les premières).
 */
export function suitesDesAmbiances(ambiances: readonly { piece: string; teintes: string[] }[], pieces: readonly string[], teintes: readonly string[], premieres = PREMIERES): string[] {
  const suites = ambiances.map(() => [] as string[]);
  for (const [p, t] of toutesLesCombinaisons(pieces, teintes)) {
    let rang = 0;
    ambiances.forEach((a, i) => {
      if ((p && a.piece !== p) || (t && !a.teintes.includes(t))) return;
      if (rang >= premieres) suites[i].push(combinaison(p, t));
      rang++;
    });
  }
  return suites.map((s) => s.join(" "));
}

/**
 * Les règles CSS de la suite : pour chaque combinaison qui compte plus de `premieres` ambiances, masquer sa suite tant
 * que « Voir toutes les ambiances » n'est pas cochée (sauf l'ambiance visée par l'adresse), montrer le bouton et dire
 * combien il en reste. Les combinaisons plus courtes n'écrivent rien : tout y est visible, le bouton reste masqué.
 */
export function reglesSuite(racine: string, ambiances: readonly { piece: string; teintes: string[] }[], pieces: readonly string[], teintes: readonly string[], premieres = PREMIERES): string {
  const regles: string[] = [];
  for (const [p, t] of toutesLesCombinaisons(pieces, teintes)) {
    const n = ambiances.filter((a) => (!p || a.piece === p) && (!t || a.teintes.includes(t))).length;
    if (n <= premieres) continue;
    const choix = `${racine}${choisi("piece", p)}${choisi("teinte", t)}:not(:has(input[name="suite"]:checked))`;
    const c = combinaison(p, t);
    regles.push(`${choix} [data-suite~="${c}"]:not(:target) { display: none; }`);
    regles.push(`${choix} [data-voir-plus] { display: flex; }`);
    regles.push(`${choix} [data-reste]::after { content: "${n - premieres} de plus"; }`);
  }
  return regles.join("\n");
}

/** Le libellé-bouton de la case : un bouton secondaire ; c'est lui qui montre le focus clavier. */
const PASTILLE_SUITE = `${classesBouton("secondaire")} relative cursor-pointer ${FOCUS_FICHIER}`;

/** « Voir toutes les ambiances » : masqué par défaut (`hidden`), montré par `reglesSuite` quand il reste une suite. */
export function VoirLaSuite() {
  return (
    <div data-voir-plus="" className="mt-4 hidden flex-col items-start gap-2">
      <label className={PASTILLE_SUITE}>
        <input type="checkbox" name="suite" className="sr-only" />
        <span>Voir toutes les ambiances</span>
        <span data-reste="" className="text-[14px] font-normal opacity-75" />
      </label>
    </div>
  );
}

export function FiltresInspirations({ pieces, teintes }: { pieces: ChoixFiltre[]; teintes: ChoixFiltre[] }) {
  return (
    <div className="flex flex-col gap-3">
      <Groupe nom="piece" libelle="Pièce" choix={pieces} />
      <Groupe nom="teinte" libelle="Teinte" choix={teintes} />
      <p data-compte="" className="min-h-[24px] text-[14.5px] text-encre-2" />
    </div>
  );
}
