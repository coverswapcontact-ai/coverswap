import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { Section } from "@/components/simulation/Section";
import revetements from "@/data/revetements.json";
import { ENTREPRISE } from "@/lib/entreprise";
import { MATIERES_PAR_PAGE, choixFamilles, type Matiere } from "@/lib/matieres";
import { metadonneesPage } from "@/lib/metadonnees";
import { NB_REFERENCES } from "@/lib/offre";
import { Matieres } from "./_components/Matieres";

/**
 * « Matières » (mission 16, partie 5) : choisir une matière et l'essayer. Remplace la page de transition de la
 * partie 1 et `/revetements` (301 ici, `?famille=` conservé). Le serveur rend le titre, l'intro et le premier lot de
 * 30 matières (référencement : noms, références, familles) ; `Matieres` (client) fait le reste — familles,
 * recherche, favoris, « Voir plus », la matière en grand et « Essayer sur ma photo » → `/simulateur?ref=<ref>`.
 * Textes de `/revetements` repris : sa description (qui porte sa phrase « bois, pierre, béton, métal, couleur, textile,
 * paillettes » ; à l'écran, ce sont les pastilles des familles) et ses mots-clés.
 */
const CATALOGUE = revetements as Matiere[];
const CHEMIN = "/matieres";

export const metadata: Metadata = {
  ...metadonneesPage({
    titre: `Matières Cover Styl' : bois, marbre, béton, couleurs — ${NB_REFERENCES} références | CoverSwap`,
    description: `Explorez notre catalogue complet de revêtements adhésifs Cover Styl'. Bois, pierre, béton, métal, couleur, textile, paillettes. ${NB_REFERENCES} références disponibles.`,
    chemin: CHEMIN,
  }),
  keywords: "catalogue cover styl, revêtement adhésif, covering mural, film adhésif décoratif, bois adhésif, marbre adhésif, béton adhésif",
};

export default function PageMatieres() {
  return (
    <div className="bg-fond">
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Matières", url: `${ENTREPRISE.site}${CHEMIN}` }]} />
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Matières" }]} />
          <p className="surtitre">Catalogue Cover Styl&apos;</p>
          <h1 className="titre-1 mt-2 text-encre">Choisissez votre matière</h1>
          {/* Deux lignes au plus à 390 px (la première rangée de tuiles reste dans le premier écran) ; les familles sont dans les pastilles. */}
          <p className="texte mt-4 max-w-2xl text-encre-2">{NB_REFERENCES} références Cover Styl&apos;. Touchez une matière pour la voir en grand.</p>
        </div>
      </section>
      <Section large className="pt-6 md:pt-6">
        <Matieres premieres={CATALOGUE.slice(0, MATIERES_PAR_PAGE)} familles={choixFamilles(CATALOGUE)} />
      </Section>
    </div>
  );
}
