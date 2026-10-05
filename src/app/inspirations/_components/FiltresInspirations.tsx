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
export function reglesFiltres(racine: string, ambiances: readonly { piece: string; teintes: string[] }[], pieces: readonly string[], teintes: readonly string[]): string {
  const choisi = (nom: string, valeur: string) => `:has(input[name="${nom}"][value="${valeur}"]:checked)`;
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

export function FiltresInspirations({ pieces, teintes }: { pieces: ChoixFiltre[]; teintes: ChoixFiltre[] }) {
  return (
    <div className="flex flex-col gap-3">
      <Groupe nom="piece" libelle="Pièce" choix={pieces} />
      <Groupe nom="teinte" libelle="Teinte" choix={teintes} />
      <p data-compte="" className="min-h-[24px] text-[14.5px] text-encre-2" />
    </div>
  );
}
