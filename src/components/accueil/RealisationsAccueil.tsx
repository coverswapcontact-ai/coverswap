import { CarteRealisation, CLASSE_CARTE_REALISATION, RATIO_CARTE_REALISATION } from "@/components/CarteRealisation";
import { LegendeMatieres } from "@/components/ambiances/LegendeMatieres";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { Section } from "@/components/simulation/Section";
import type { ChoixEtudes, EtudeSimulee } from "./etudes";

/**
 * 5. Réalisations (mission 16, partie 3) : trois études de cas au plus.
 * `choisirEtudes` (`etudes.ts`) décide : les réalisations publiées par le CRM
 * (« Ils l'ont fait » : la carte de `/realisations`, `CarteRealisation` —
 * avant / après, matières posées, prix et durée publiés sinon habituels
 * libellés comme tels, ville) et un bouton secondaire vers `/realisations` ;
 * sinon trois études simulées (« Ce que ça donne » : chaque image étiquetée,
 * la fourchette d'`offre.ts`, la durée de pose — jamais un prix réel ni une
 * ville), SANS bouton vers `/realisations`, qui n'aurait rien à montrer (le
 * « Simuler ma cuisine » de la section suivante suit). Composant serveur.
 */
const TAILLES_CARTE = "(min-width: 768px) 360px, 100vw";

/**
 * La carte d'une étude simulée (image étiquetée, fourchette et durée d'`offre.ts`) : aussi rendue par `/realisations` et
 * les pages par pièce (partie 5). Mission 19 : une paire d'ambiance garde son cadre d'origine (les étiquettes matière
 * sont placées en % de l'image) et porte sa légende sous l'image.
 */
export function CarteSimulee({ etude, tailles = TAILLES_CARTE }: { etude: EtudeSimulee; tailles?: string }) {
  return (
    <article className={CLASSE_CARTE_REALISATION}>
      {etude.image.type === "avant-apres" ? (
        <AvantApres apres={etude.image.apres} avant={etude.image.avant} alt={etude.alt} altAvant={etude.altAvant ?? `${etude.titre} avant la pose`} ratio={etude.matieres ? `${etude.image.preparees.apres.largeur} / ${etude.image.preparees.apres.hauteur}` : RATIO_CARTE_REALISATION} preparees={{ ...etude.image.preparees, tailles }} sansOutils etiquette={etude.etiquette} matieres={etude.matieres} />
      ) : (
        <Photo nom={etude.image.nom} alt={etude.alt} ratio={RATIO_CARTE_REALISATION} tailles={tailles} etiquette={etude.etiquette} />
      )}
      {etude.matieres && etude.lienComposition ? <LegendeMatieres matieres={etude.matieres} lienComposition={etude.lienComposition} className="px-5" /> : null}
      <div className="p-5">
        <h3 className="text-[17px] font-semibold text-encre">{etude.titre}</h3>
        <p className="texte-2 mt-1">
          {etude.prix} fourni et posé · pose en {etude.duree}
        </p>
      </div>
    </article>
  );
}

export function RealisationsAccueil({ choix }: { choix: ChoixEtudes }) {
  return (
    <Section id="realisations" large differee titre={choix.titre} intro={choix.mode === "simulees" ? "Des ambiances avant / après aux teintes réelles du catalogue, et les prix habituels par projet. Les photos de nos chantiers arrivent." : undefined}>
      <div className="grid gap-5 md:grid-cols-3">
        {choix.mode === "reelles" ? choix.etudes.map((e) => <CarteRealisation key={e.id} etude={e} tailles={TAILLES_CARTE} />) : choix.etudes.map((e) => <CarteSimulee key={e.id} etude={e} />)}
      </div>
      {choix.mode === "reelles" ? (
        <div className="mt-8 md:mt-10">
          <Lien href="/realisations" variante="secondaire">
            Voir les réalisations
          </Lien>
        </div>
      ) : null}
    </Section>
  );
}
