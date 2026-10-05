import Link from "next/link";
import { PICTOS_ELEMENTS, PICTOS_FAMILLES, Picto } from "@/components/espace/Illustrations";
import { Section } from "@/components/simulation/Section";
import { lienSimuler } from "@/lib/liens-simulateur";
import { ELEMENTS } from "@/lib/simulateur/elements";
import { styleTeinte, teintePrestation } from "@/lib/teintes-prestations";
import { ANCRES_ACCUEIL } from "./sections";

/**
 * 2. Par où commencer ? (site 3.0, lot B6 ; énoncé, § C.1) : douze pictos — les cinq pièces (cuisine, salle de bain,
 * meubles, murs, pro), puis sept éléments précis (portes, placards, plan de travail, meuble vasque, commode, porte
 * d'entrée, réfrigérateur). Chacun est un LIEN vers le simulateur avec la pièce choisie
 * (`?projet=…&choix=1&depuis=accueil`, et `element=` pour un élément) : le simulateur émet `PIECE_CHOISIE` dès
 * l'arrivée et ouvre l'écran Photo ; la zone de l'élément s'ouvre d'abord à l'écran des matières. Il remplace le module
 * « Essayez sur votre photo » de la mission 15 (aucun JavaScript ici).
 *
 * Pictos de 64 px au moins (80 px dès 768 px), décoratifs (`alt=""`), libellé visible dessous ; un filet de 3 px à la
 * teinte de la prestation au-dessus de chaque carte. Composant serveur.
 */
export type PictoAccueil = { cle: string; libelle: string; picto: string; projet: string; element?: string };

export const PIECES_ACCUEIL: readonly PictoAccueil[] = [
  { cle: "cuisine", libelle: "Cuisine", picto: PICTOS_FAMILLES.CUISINE, projet: "cuisine" },
  { cle: "salle-de-bain", libelle: "Salle de bain", picto: PICTOS_FAMILLES.SDB, projet: "salle-de-bain" },
  { cle: "meubles", libelle: "Meubles", picto: PICTOS_FAMILLES.MEUBLES, projet: "meubles" },
  { cle: "murs", libelle: "Murs", picto: PICTOS_FAMILLES.MURS, projet: "mur-plafond" },
  { cle: "pro", libelle: "Pro", picto: PICTOS_FAMILLES.PRO, projet: "professionnel" },
];

export const ELEMENTS_ACCUEIL: readonly PictoAccueil[] = ELEMENTS.map((e) => ({ cle: e.id, libelle: e.libelle, picto: PICTOS_ELEMENTS[e.id], projet: e.piece, element: e.id }));

/** Les douze, dans l'ordre de l'énoncé. */
export const PICTOS_ACCUEIL: readonly PictoAccueil[] = [...PIECES_ACCUEIL, ...ELEMENTS_ACCUEIL];

export const lienPicto = (p: PictoAccueil) => lienSimuler({ projet: p.projet, element: p.element, choix: true, depuis: "accueil" });

function Carte({ p }: { p: PictoAccueil }) {
  const teinte = (p.element ? teintePrestation(p.element) : null) ?? teintePrestation(p.projet);
  return (
    <li>
      <Link
        href={lienPicto(p)}
        style={styleTeinte(teinte)}
        className="group flex h-full min-h-[44px] flex-col items-center gap-2 border-t-[3px] border-[color:var(--teinte,var(--color-encre))] px-1 pt-3 pb-2 text-center transition-colors duration-[var(--duree-courte)] hover:bg-fond-2/70"
      >
        <Picto nom={p.picto} className="h-16 w-16 md:h-20 md:w-20" />
        <span className="text-[13.5px] leading-tight font-medium text-encre group-hover:underline sm:text-[14.5px] md:text-[15.5px]">{p.libelle}</span>
      </Link>
    </li>
  );
}

export function ParOuCommencer() {
  return (
    <Section id={ANCRES_ACCUEIL.parOuCommencer} large differee titre="Par où commencer ?" intro="Touchez ce que vous voulez changer : le simulateur s'ouvre avec la pièce choisie, il ne reste que votre photo.">
      <p className="surtitre">Une pièce</p>
      <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 md:gap-x-6">
        {PIECES_ACCUEIL.map((p) => (
          <Carte key={p.cle} p={p} />
        ))}
      </ul>
      <p className="surtitre mt-10">Ou un élément précis</p>
      <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-7 md:gap-x-6">
        {ELEMENTS_ACCUEIL.map((p) => (
          <Carte key={p.cle} p={p} />
        ))}
      </ul>
    </Section>
  );
}
