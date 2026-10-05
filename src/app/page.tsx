import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { preload } from "react-dom";
import { AvisPrix } from "@/components/accueil/AvisPrix";
import { CommentOnTravaille } from "@/components/accueil/CommentOnTravaille";
import { CuisinesCommeLaVotre } from "@/components/accueil/CuisinesCommeLaVotre";
import { choisirOuverture, imageObjetOuverture, partageOuverture, prechargementsOuverture } from "@/components/accueil/etudes";
import { Ouverture } from "@/components/accueil/Ouverture";
import { ParOuCommencer } from "@/components/accueil/ParOuCommencer";
import { Presentoir } from "@/components/accueil/Presentoir";
import { ProAccueil } from "@/components/accueil/ProAccueil";
import { QuestionsAccueil } from "@/components/accueil/QuestionsAccueil";
import { RealisationsAccueil, realisationsAccueil } from "@/components/accueil/RealisationsAccueil";
import { ANCRES_ACCUEIL, BANDES_ACCUEIL, CIBLES_BOUTON_COLLE, DESCRIPTION_META_ACCUEIL, TITRE_META_ACCUEIL, lienSimulerAccueil, sectionsAccueil, type IdSectionAccueil } from "@/components/accueil/sections";
import { DonneesStructurees, ServiceSchema } from "@/components/JsonLd";
import { BandeMatiere } from "@/components/revue/BandeMatiere";
import { BoutonColle } from "@/components/simulation/BoutonColle";
import { Lien } from "@/components/simulation/Lien";
import { ENTREPRISE } from "@/lib/entreprise";
import { matiereCartel } from "@/lib/matieres-vedettes";
import { metadonneesPage } from "@/lib/metadonnees";
import { chargerPublications } from "@/lib/publications";

/**
 * L'accueil du site 3.0 (lot B6) : neuf sections, dans l'ordre de `sectionsAccueil()` (énoncé, § C.1), rien d'autre —
 * ouverture, par où commencer, des cuisines comme la vôtre, comment on travaille, le présentoir, réalisations,
 * professionnels, avis et prix, questions puis le dernier appel —, séparées par les bandes de matière
 * (`BANDES_ACCUEIL` : chêne, marbre, vert profond dans le présentoir, terracotta, bleu nuit). Sur téléphone, « Simuler
 * ma pièce » se colle en bas une fois l'ouverture passée, s'efface quand un autre appel est à l'écran, et pendant une
 * saisie ou une feuille ouverte (`masquerSurSaisie`). Relu toutes les cinq minutes (publications du CRM ; avis Google
 * et tarifs : une heure).
 */
export const revalidate = 300;

/** Mission 16 (partie 5) : les métadonnées de toutes les pages passent par `metadonneesPage` ; site 3.0 : l'image de partage suit l'ouverture (`partageOuverture`). */
export async function generateMetadata(): Promise<Metadata> {
  const { realisations } = await chargerPublications();
  const image = partageOuverture(choisirOuverture(realisations));
  return metadonneesPage({ titre: TITRE_META_ACCUEIL, description: DESCRIPTION_META_ACCUEIL, chemin: "/", ...(image ? { image } : {}) });
}

/** La bande de matière posée après une section (la référence du catalogue, `BANDES_ACCUEIL`). */
function bandeApres(id: IdSectionAccueil): ReactNode {
  const bande = BANDES_ACCUEIL.find((b) => b.apres === id);
  const matiere = bande ? matiereCartel(bande.ref) : null;
  return matiere ? <BandeMatiere matiere={matiere} /> : null;
}

export default async function PageAccueil() {
  const { realisations } = await chargerPublications();
  const ouverture = choisirOuverture(realisations);
  // Mission 16 (partie 6) : l'image « avant » de l'ouverture est le LCP — préchargée ici, sur l'accueil seulement
  // (`<link rel="preload" as="image" imagesrcset imagesizes type fetchpriority="high">` dans le <head>).
  for (const prechargement of prechargementsOuverture(ouverture)) preload(prechargement.href, prechargement.options);

  const sections: Record<IdSectionAccueil, ReactNode> = {
    ouverture: <Ouverture choix={ouverture} />,
    "par-ou-commencer": <ParOuCommencer />,
    cuisines: <CuisinesCommeLaVotre />,
    comment: <CommentOnTravaille depuis="accueil-etapes" idBouton={ANCRES_ACCUEIL.boutonEtapes} preuve />,
    presentoir: <Presentoir />,
    realisations: <RealisationsAccueil reelles={realisationsAccueil(realisations)} />,
    pro: <ProAccueil />,
    "avis-prix": <AvisPrix />,
    questions: <QuestionsAccueil />,
  };

  return (
    <>
      <ServiceSchema
        name="Covering adhésif : rénovation de cuisine sans travaux"
        description={DESCRIPTION_META_ACCUEIL}
        url={ENTREPRISE.site}
        urlOffre={`${ENTREPRISE.site}/simulateur`}
      />
      <DonneesStructurees data={imageObjetOuverture(ouverture)} />
      {sectionsAccueil().map((s) => (
        <Fragment key={s.id}>
          {sections[s.id]}
          {bandeApres(s.id)}
        </Fragment>
      ))}
      <BoutonColle mobileSeulement masquerSurSaisie cibles={CIBLES_BOUTON_COLLE}>
        <Lien href={lienSimulerAccueil("accueil-colle")} plein>
          Simuler ma pièce
        </Lien>
      </BoutonColle>
    </>
  );
}
