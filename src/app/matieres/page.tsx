import type { Metadata } from "next";
import Link from "@/components/LienSite";
import Breadcrumb from "@/components/Breadcrumb";
import { BandeMatiere } from "@/components/revue/BandeMatiere";
import { Video } from "@/components/revue/Video";
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
 * Mission 22 (partie B) : le présentoir en boucle (`VIDEOS.presentoirBoucle`, 9,6 s, muet, `revue/Video` en mode
 * `boucle`) à droite du titre dès 1 024 px, sous le titre et l'intro au téléphone ; il ne joue qu'à l'écran, jamais
 * avec `prefers-reduced-motion` (affiche + « Lire »). Rien de différé sur cette page (barre collée).
 */
const CATALOGUE = revetements as Matiere[];
const CHEMIN = "/matieres";
/** La bande qui ferme le présentoir : un chêne, la famille la plus fournie. */
const BANDE = matiereCartel("AA14");

export const metadata: Metadata = {
  ...metadonneesPage({
    titre: `Films adhésifs Cover Styl' : ${NB_REFERENCES} matières | CoverSwap`,
    description: `${NB_REFERENCES} films adhésifs Cover Styl' rangés par teinte : bois, marbre, béton, couleurs unies, métal. Chaque référence a sa fiche et s'essaie sur votre photo.`,
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
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Matières", href: CHEMIN }]} />
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-12">
            <div>
              <p className="surtitre">Catalogue Cover Styl&apos;</p>
              <h1 className="titre-1 mt-2 text-encre">Choisissez votre matière</h1>
              {/* Deux lignes au plus à 390 px ; les familles sont dans les tiroirs. */}
              <p className="texte mt-4 max-w-2xl text-encre-2">{NB_REFERENCES} références Cover Styl&apos;, rangées par teinte. Touchez-en une pour la voir.</p>
            </div>
            <Video id="presentoirBoucle" mode="boucle" immediat tailles="(min-width: 1024px) 420px, calc(100vw - 32px)" className="mt-6 lg:mt-0" />
          </div>
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
      {/* Lot F6 : comment choisir, en quelques lignes (le texte utile de la page, 300 mots rendus au moins : mots.test.ts). */}
      <Section id="choisir" titre="Choisir sans se tromper">
        <div className="texte space-y-4 text-encre">
          <p>
            Un film Cover Styl&apos;, c&apos;est un décor (bois, pierre, couleur unie, métal, textile) imprimé sur un film adhésif, distribué en France par{" "}
            {ENTREPRISE.fournisseur.distributeur}. On le pose à chaud sur ce que vous avez déjà, nettoyé et dégraissé : façades, plan de travail, portes, murs.
            Rien n&apos;est démonté.
          </p>
          <p>
            Commencez par la teinte : les échantillons sont rangés du clair au foncé, et le filtre des teintes resserre le choix. Regardez ensuite la famille et la
            finition, qui changent la façon dont la lumière accroche la surface : un mat s&apos;efface, un brillant reflète la fenêtre, un veinage se lit de près.
          </p>
          <p>
            Un écran ne rend jamais une teinte exactement : la luminosité, son réglage et la lumière de la pièce la déplacent. C&apos;est pour ça qu&apos;on vient avec
            les vrais échantillons, posés contre vos meubles, avant de commander quoi que ce soit. En attendant, chaque référence s&apos;essaie sur une photo de
            votre pièce, depuis sa fiche.
          </p>
        </div>
      </Section>
      {BANDE ? <BandeMatiere matiere={BANDE} /> : null}
    </div>
  );
}
