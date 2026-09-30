import { CarteRealisation, CLASSE_CARTE_REALISATION, RATIO_CARTE_REALISATION } from "@/components/CarteRealisation";
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

function CarteSimulee({ etude }: { etude: EtudeSimulee }) {
  return (
    <article className={CLASSE_CARTE_REALISATION}>
      {etude.image.type === "avant-apres" ? (
        <AvantApres apres={etude.image.apres} avant={etude.image.avant} alt={etude.alt} altAvant={`${etude.titre} avant la pose`} ratio={RATIO_CARTE_REALISATION} preparees={{ ...etude.image.preparees, tailles: TAILLES_CARTE }} sansOutils etiquette={etude.etiquette} />
      ) : (
        <Photo nom={etude.image.nom} alt={etude.alt} ratio={RATIO_CARTE_REALISATION} tailles={TAILLES_CARTE} etiquette={etude.etiquette} />
      )}
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
    <Section id="realisations" large titre={choix.titre} intro={choix.mode === "simulees" ? "Des exemples simulés et les prix constatés par projet. Les photos de nos chantiers arrivent." : undefined}>
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
