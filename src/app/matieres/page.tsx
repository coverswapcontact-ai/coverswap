import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { BandeMatiere } from "@/components/revue/BandeMatiere";
import { Section } from "@/components/simulation/Section";
import revetements from "@/data/revetements.json";
import { ENTREPRISE } from "@/lib/entreprise";
import { cheminFamille } from "@/lib/familles-matieres";
import { vueDans } from "@/lib/indexation-matieres";
import { choixFinitions, premieresDuPresentoir, tiroirs, type Matiere } from "@/lib/matieres";
import { matiereCartel } from "@/lib/matieres-vedettes";
import { metadonneesPage } from "@/lib/metadonnees";
import { NB_REFERENCES } from "@/lib/offre";
import { Matieres } from "./_components/Matieres";

/**
 * « Matières », le présentoir (site 3.0, lot D2 ; énoncé, phase D ; mission 16, partie 5 : remplace la page de
 * transition et `/revetements`, 301 ici, `?famille=` conservé). Le serveur rend le titre, l'intro et les 30 premières
 * matières du nuancier (`premieresDuPresentoir` : le catalogue rangé par teinte ; référencement : noms, références,
 * familles, finitions), en échantillons ; `Matieres` (client) fait le reste — les sept tiroirs, la teinte, la finition,
 * « Vue dans une ambiance », la recherche, les favoris, « Voir plus », la matière en grand et « Essayer sur ma photo »
 * (`/simulateur?ref=<ref>&depuis=matieres`). Une bande de matière (chêne AA14) ferme le présentoir : en tête, elle
 * repousserait la première rangée d'échantillons hors du premier écran du téléphone.
 * Textes de `/revetements` repris : sa description (qui porte sa phrase « bois, pierre, béton, métal, couleur, textile,
 * paillettes » ; à l'écran, ce sont les tiroirs) et ses mots-clés.
 */
const CATALOGUE = revetements as Matiere[];
const CHEMIN = "/matieres";
/** La bande qui ferme le présentoir : un chêne, la famille la plus fournie. */
const BANDE = matiereCartel("AA14");

export const metadata: Metadata = {
  ...metadonneesPage({
    titre: `Matières Cover Styl' : bois, marbre, béton, couleurs — ${NB_REFERENCES} références | CoverSwap`,
    description: `Explorez notre catalogue complet de revêtements adhésifs Cover Styl'. Bois, pierre, béton, métal, couleur, textile, paillettes. ${NB_REFERENCES} références disponibles.`,
    chemin: CHEMIN,
  }),
  keywords: "catalogue cover styl, revêtement adhésif, covering mural, film adhésif décoratif, bois adhésif, marbre adhésif, béton adhésif",
};

/** « Vue dans » réduit à ce que la matière en grand affiche (l'ancre et le titre) : la page n'envoie rien de plus. */
/** Les sept tiroirs, calculés une fois : le présentoir et les liens vers les pages de famille (lot D3). */
const TIROIRS_DU_PRESENTOIR = tiroirs(CATALOGUE);
const FAMILLES_EN_DETAIL = TIROIRS_DU_PRESENTOIR.filter((t) => t.id !== "tout");

const VUES = Object.fromEntries(Object.entries(vueDans()).map(([ref, liste]) => [ref, liste.map(({ id, titre }) => ({ id, titre }))]));

export default function PageMatieres() {
  return (
    <div>
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Matières", url: `${ENTREPRISE.site}${CHEMIN}` }]} />
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Matières" }]} />
          <p className="surtitre">Catalogue Cover Styl&apos;</p>
          <h1 className="titre-1 mt-2 text-encre">Choisissez votre matière</h1>
          {/* Deux lignes au plus à 390 px (la première rangée d'échantillons reste dans le premier écran) ; les familles sont dans les tiroirs. */}
          <p className="texte mt-4 max-w-2xl text-encre-2">{NB_REFERENCES} références Cover Styl&apos;, rangées par teinte. Touchez-en une pour la voir.</p>
        </div>
      </section>
      <Section large className="pt-6 md:pt-6">
        <Matieres premieres={premieresDuPresentoir(CATALOGUE)} tiroirs={TIROIRS_DU_PRESENTOIR} finitions={choixFinitions(CATALOGUE)} vueDans={VUES} />
      </Section>
      {/* Lot D3 : les sept familles, une page chacune (ce que c'est, où ça se pose, l'entretien, les limites). */}
      <Section id="familles" large ton="papier-2" titre="Les familles, une par une" intro="Ce que c'est, où ça se pose, l'entretien et les limites de chaque famille, avec toutes ses teintes.">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FAMILLES_EN_DETAIL.map((t) => (
            <li key={t.id}>
              <Link href={cheminFamille(t.id)} className="flex min-h-[56px] items-center gap-3 rounded-[var(--rayon-sm)] border border-trait bg-blanc px-4 py-2 text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre">
                <span aria-hidden="true" className="flex shrink-0 -space-x-1.5">
                  {t.teintes.map((hex, i) => (
                    <span key={i} className="h-4 w-4 rounded-full ring-2 ring-blanc" style={{ backgroundColor: hex }} />
                  ))}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium">{t.libelle}</span>
                  <span className="block text-[13px] text-encre-2">{t.nombre} références</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      {BANDE ? <BandeMatiere matiere={BANDE} /> : null}
    </div>
  );
}
