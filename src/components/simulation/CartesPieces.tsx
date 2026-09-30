"use client";

import { CuisineDeFace, MobilierDeFace, MursDeFace, ProfessionnelDeFace, SalleDeBainDeFace } from "@/components/espace/Illustrations";

/**
 * Les cinq cartes « Quelle pièce transformons-nous ? » (mission 15, partie 4),
 * partagées par le simulateur et le module d'accueil. Une carte = le dessin
 * au trait fin de la pièce (`espace/Illustrations`) — la photo d'une vraie
 * réalisation prendra sa place quand `public/` en aura une (à fournir) —, le
 * libellé et la description venus du CRM. Le dessin est en gris léger, et
 * passe en couleur avec le trait d'accent quand la carte est choisie. Jamais
 * un emoji. Hauteur fixe : les cartes ne font pas bouger la page. Des boutons
 * `aria-pressed` dans un groupe (pas un `radiogroup` : choisir une carte fait
 * avancer le parcours, les flèches n'auraient pas leur sens de radio).
 */
export type PieceCarte = { id: string; libelle: string; description: string };

const DESSINS: Record<string, (p: { className?: string }) => React.ReactElement> = {
  cuisine: CuisineDeFace,
  "salle-de-bain": SalleDeBainDeFace,
  meubles: MobilierDeFace,
  "mur-plafond": MursDeFace,
  professionnel: ProfessionnelDeFace,
};

export function CartesPieces({ pieces, valeur, onChoisir, nom = "Pièce" }: { pieces: PieceCarte[]; valeur: string | null; onChoisir: (id: string) => void; nom?: string }) {
  return (
    <div role="group" aria-label={nom} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {pieces.map((p) => {
        const Dessin = DESSINS[p.id] ?? CuisineDeFace;
        const choisie = valeur === p.id;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={choisie}
            onClick={() => onChoisir(p.id)}
            className={`group flex min-h-[172px] flex-col items-stretch rounded-[var(--rayon-md)] border bg-white p-3 text-left transition-colors duration-[var(--duree-courte)] ease-[var(--ease)] ${choisie ? "border-accent ring-1 ring-accent" : "border-trait hover:border-encre-2"}`}
          >
            <span className={`block aspect-[120/92] w-full overflow-hidden rounded-[var(--rayon-sm)] bg-fond transition-[filter,opacity] duration-[var(--duree-moyenne)] ease-[var(--ease)] ${choisie ? "" : "opacity-80 grayscale group-hover:opacity-100"}`}>
              <Dessin className="h-full w-full" />
            </span>
            <span className="mt-2 block text-[15.5px] leading-snug font-semibold text-encre">{p.libelle}</span>
            <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-encre-2">{p.description}</span>
          </button>
        );
      })}
    </div>
  );
}
