import { AvantApres } from "@/components/simulation/AvantApres";
import { Lien } from "@/components/simulation/Lien";
import { FormulaireRappel } from "./FormulaireRappel";
import { ANCRES_ACCUEIL, LIGNE_ACCUEIL, TITRE_ACCUEIL, lienSimulerAccueil } from "./sections";
import { TAILLES_OUVERTURE, type ChoixOuverture } from "./etudes";

/**
 * 1. L'ouverture (site 3.0, lot B6 ; énoncé, § C.1) : l'avant / après en pleine largeur, avec son curseur, son
 * étiquette (« Ambiance · avant / après », ou « Réalisation, <ville> ») et sa légende ; la promesse en très grand
 * (`titre-0`, Playfair 900) ; UNE action principale, « Voir ma pièce transformée » (`depuis=accueil-ouverture`), et
 * une secondaire, « Être rappelé » (une feuille, `FormulaireRappel`).
 *
 * Mise en page : dans le document, le titre et les boutons viennent AVANT l'image (lecteurs d'écran, clavier : le
 * bouton est le premier arrêt après l'en-tête). Sur téléphone, l'image passe en haut (`max-md:order-first`), le titre
 * vient sous elle ; dès 768 px, le titre court sur toute la largeur au-dessus de la photo. Le plan prévoyait le titre
 * posé dans le tiers haut de la photo, sur un voile d'encre : les façades vert profond NF13 occupent ce tiers (meubles
 * hauts), le voile les aurait noircies — le titre reste donc hors de la photo à toutes les largeurs.
 *
 * L'image « avant » est le LCP (`fetchpriority="high"`, AVIF préparé ; WebP réduit par le CRM pour une réalisation) ;
 * la page d'accueil la précharge (`prechargementsOuverture`, mêmes `srcset` et `sizes`). Composant serveur (le curseur
 * et la feuille de rappel sont clients). Jamais `100vh` : la photo ne dépasse pas `100svh` (`LARGEUR_OUVERTURE`).
 */
/**
 * La largeur du bloc : toute la largeur de la page (1 152 px au plus, celle de l'en-tête et des sections), mais jamais une photo plus haute que l'écran utile — `100svh`
 * moins l'en-tête (60 px) et un peu d'air, multiplié par le rapport de la photo (3 / 2). Le titre et la photo gardent
 * les mêmes bords.
 */
export const LARGEUR_OUVERTURE = "min(72rem, calc((100svh - 84px) * 1.5))";

export function Ouverture({ choix }: { choix: ChoixOuverture | null }) {
  return (
    <section aria-labelledby="titre-accueil" className="px-4 pt-4 pb-2 md:px-6 md:pt-10 md:pb-6">
      <div className="mx-auto flex w-full flex-col" style={{ maxWidth: LARGEUR_OUVERTURE }}>
        <div className="mt-4 md:mt-0">
          <h1 id="titre-accueil" className="titre-0 max-w-[15ch] text-balance text-encre md:max-w-none">
            {TITRE_ACCUEIL}
          </h1>
          <div className="mt-3 flex flex-col gap-4 md:mt-6 md:flex-row md:items-center md:justify-between md:gap-10">
            <p className="texte max-w-md text-encre-2">{LIGNE_ACCUEIL}</p>
            <div id={ANCRES_ACCUEIL.boutonOuverture} className="flex flex-col gap-3 sm:flex-row md:shrink-0">
              <Lien href={lienSimulerAccueil("accueil-ouverture")} className="w-full sm:w-auto">
                Voir ma pièce transformée
              </Lien>
              <FormulaireRappel depuis="accueil-ouverture" className="w-full sm:w-auto" />
            </div>
          </div>
        </div>
        {choix ? (
          <figure className="m-0 w-full max-md:order-first md:mt-10">
            <AvantApres
              avant={choix.avant}
              apres={choix.apres}
              alt={choix.alt}
              altAvant={choix.altAvant}
              ratio={choix.ratio}
              preparees={{ ...choix.preparees, tailles: TAILLES_OUVERTURE }}
              priorite
              outilsMobile="aucun"
              etiquette={choix.etiquette}
            />
            <figcaption className="mt-2 max-w-3xl text-[14px] leading-snug text-encre-2 md:mt-3 md:text-[15px]">{choix.legende}</figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
