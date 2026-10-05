import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { preload } from "react-dom";
import { CommentCaMarche } from "@/components/accueil/CommentCaMarche";
import { Confiance } from "@/components/accueil/Confiance";
import { DernierAppel } from "@/components/accueil/DernierAppel";
import { InspirationsAccueil } from "@/components/accueil/InspirationsAccueil";
import { choisirEtudes, choisirOuverture, prechargementsOuverture } from "@/components/accueil/etudes";
import { MatieresAccueil } from "@/components/accueil/MatieresAccueil";
import { Ouverture } from "@/components/accueil/Ouverture";
import { RealisationsAccueil } from "@/components/accueil/RealisationsAccueil";
import { ANCRES_ACCUEIL, CIBLES_BOUTON_COLLE, DESCRIPTION_META_ACCUEIL, TITRE_META_ACCUEIL, lienSimulerCuisine, sectionsAccueil, type IdSectionAccueil } from "@/components/accueil/sections";
import { TroisFaits } from "@/components/accueil/TroisFaits";
import { SimulationSection } from "@/components/HomeClient";
import { ServiceSchema } from "@/components/JsonLd";
import { BoutonColle } from "@/components/simulation/BoutonColle";
import { Lien } from "@/components/simulation/Lien";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { chargerPublications } from "@/lib/publications";
import { chargerZonesSimulateur } from "@/lib/simulateur/zones";

/**
 * L'accueil (mission 16, partie 3) : huit sections, dans l'ordre de
 * `sectionsAccueil()`, rien d'autre — ouverture, essai sur photo, trois faits,
 * matières, réalisations, comment ça marche, confiance, dernier appel. Un seul
 * geste : « Simuler ma cuisine ». Sur téléphone, ce bouton se colle en bas une
 * fois l'ouverture passée, et s'efface quand un autre bouton principal est à
 * l'écran. Relu toutes les cinq minutes (publications du CRM ; avis Google :
 * une heure).
 */
export const revalidate = 300;

/** Mission 16 (partie 5) : les métadonnées de toutes les pages passent par `metadonneesPage` (canonical absolu, Open Graph et carte de partage). */
export const metadata: Metadata = metadonneesPage({ titre: TITRE_META_ACCUEIL, description: DESCRIPTION_META_ACCUEIL, chemin: "/" });

export default async function PageAccueil() {
  const [zones, { realisations }] = await Promise.all([chargerZonesSimulateur(), chargerPublications()]);
  // Mission 15 (partie 4) : les cinq cartes du module de simulation sont celles du simulateur (pièces et zones du CRM).
  const pieces = zones.pieces.map((piece) => ({ id: piece.id, libelle: piece.libelle, description: piece.zones.map((z) => z.libelle).join(", ") }));
  const ouverture = choisirOuverture(realisations);
  // Mission 16 (partie 6) : l'image « avant » de l'ouverture est le LCP — préchargée ici, sur l'accueil seulement
  // (`<link rel="preload" as="image" imagesrcset imagesizes type fetchpriority="high">` dans le <head>).
  for (const prechargement of prechargementsOuverture(ouverture)) preload(prechargement.href, prechargement.options);

  const sections: Record<IdSectionAccueil, ReactNode> = {
    ouverture: <Ouverture choix={ouverture} />,
    essayer: <SimulationSection pieces={pieces} />,
    faits: <TroisFaits />,
    matieres: <MatieresAccueil />,
    realisations: <RealisationsAccueil choix={choisirEtudes(realisations)} />,
    inspirations: <InspirationsAccueil />,
    comment: <CommentCaMarche depuis="accueil-etapes" idBouton={ANCRES_ACCUEIL.boutonEtapes} fond="fond-2" />,
    confiance: <Confiance />,
    "dernier-appel": <DernierAppel />,
  };

  return (
    <>
      <ServiceSchema
        name="Covering adhésif : rénovation de cuisine sans travaux"
        description={DESCRIPTION_META_ACCUEIL}
        url={ENTREPRISE.site}
        urlOffre={`${ENTREPRISE.site}/simulateur`}
      />
      {sectionsAccueil().map((s) => (
        <Fragment key={s.id}>{sections[s.id]}</Fragment>
      ))}
      <BoutonColle mobileSeulement masquerSurSaisie cibles={CIBLES_BOUTON_COLLE}>
        <Lien href={lienSimulerCuisine("accueil-colle")} plein>
          Simuler ma cuisine
        </Lien>
      </BoutonColle>
    </>
  );
}
