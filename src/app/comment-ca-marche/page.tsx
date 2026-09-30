import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { CartesAtouts, EtapesPrestation, QuestionsPrestation } from "@/components/BlocsPrestation";
import { CommentCaMarche } from "@/components/accueil/CommentCaMarche";
import { BreadcrumbSchema, FAQSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { articles } from "@/data/blog-articles";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { DESCRIPTION_PAGE, FAQ_RESTANTE, INTRO_GUIDES, INTRO_PAGE, LEGENDE_FOURCHETTES, LIGNES_FOURCHETTES, MOTS_CLES_GUIDES, NOTE_ETAPES, OBJECTIONS, PRIX_COMPRIS, PRIX_CONDITIONS, PRIX_MESURE, PRIX_REGLE, QUESTIONS_BALISEES, TITRE_PAGE } from "./contenu";
import { AVANTAGES_DEVIS_EN_LIGNE, ETAPES_DEVIS_EN_LIGNE, INTRO_DEVIS_EN_LIGNE, LIEN_DEVIS_EN_LIGNE, MOTS_CLES_DEVIS_EN_LIGNE, TITRE_DEVIS_EN_LIGNE } from "./devis-en-ligne";

/**
 * « Comment ça marche » (mission 16, partie 5) : le procédé, le prix, les objections — puis « Simuler ma cuisine ».
 *  1. Ouverture : le titre, une phrase (« Pas de travaux » de l'ancien accueil) ;
 *  2. les trois étapes avec image (`CommentCaMarche` de l'accueil) et le bouton principal ;
 *  3. « Le prix » (`#prix`) : au mètre linéaire, ce qui est compris, les fourchettes par pièce, le lien vers
 *     l'estimation du simulateur ;
 *  4. « Vos questions » (`#objections`) : une ligne et deux phrases au plus par objection, puis la FAQ générale
 *     (`#faq`, repliée) sans les questions que les objections reprennent déjà (`FAQ_RESTANTE`) ; UN balisage
 *     `FAQPage` pour les deux, chaque question une fois (`QUESTIONS_BALISEES`) ;
 *  5. le devis en ligne (`#devis`, textes de l'ancienne /devis, partie 4) ;
 *  6. « Pour aller plus loin » (`#guides`) : les guides `/blog/<slug>` (hors menu ; l'index /blog est redirigé ici)
 *     et les films pour vitrages ;
 *  7. le dernier appel, même bouton.
 * Composant serveur, synchrone.
 */
const CHEMIN = "/comment-ca-marche";

export const metadata: Metadata = {
  ...metadonneesPage({ titre: TITRE_PAGE, description: DESCRIPTION_PAGE, chemin: CHEMIN }),
  keywords: `${MOTS_CLES_DEVIS_EN_LIGNE}, ${MOTS_CLES_GUIDES}`,
};

const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white";

export default function PageCommentCaMarche() {
  return (
    <div className="bg-fond">
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Comment ça marche", url: `${ENTREPRISE.site}${CHEMIN}` }]} />
      <FAQSchema faqs={QUESTIONS_BALISEES} />

      {/* ── 1. Ouverture ── */}
      <section className="bg-fond-2 px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Comment ça marche" }]} />
          <h1 className="titre-1 max-w-3xl text-encre">Comment ça marche</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">{INTRO_PAGE}</p>
        </div>
      </section>

      {/* ── 2. Trois étapes, le bouton principal ── */}
      <CommentCaMarche titre="De la photo à la pose" note={NOTE_ETAPES} />

      {/* ── 3. Le prix ── */}
      <Section id="prix" large differee fond="fond-2" titre="Le prix" intro={PRIX_MESURE}>
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="texte-2 space-y-4">
            <p>{PRIX_REGLE}</p>
            <p>{PRIX_COMPRIS}</p>
            <p>{PRIX_CONDITIONS}</p>
          </div>
          <div>
            <table className={`${CARTE} w-full border-separate border-spacing-0 overflow-hidden text-left`}>
              <caption className="mb-3 text-left text-[15px] font-semibold text-encre">{LEGENDE_FOURCHETTES}</caption>
              <tbody>
                {LIGNES_FOURCHETTES.map((l, i) => (
                  <tr key={l.projet}>
                    <th scope="row" className={`px-4 py-3 text-[15px] font-normal text-encre-2${i > 0 ? " border-t border-trait" : ""}`}>
                      {l.projet}
                    </th>
                    <td className={`px-4 py-3 text-right text-[15px] font-semibold whitespace-nowrap text-encre${i > 0 ? " border-t border-trait" : ""}`}>{l.prix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6">
              <Lien href="/simulateur?projet=cuisine" variante="secondaire">
                Estimer sur ma photo
              </Lien>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 4. Vos questions : les objections, puis la FAQ générale (repliée) ── */}
      <Section id="objections" differee titre="Vos questions">
        <dl className="border-t border-trait">
          {OBJECTIONS.map((o) => (
            <div key={o.sujet} className="border-b border-trait py-5">
              <dt className="text-[17px] font-semibold text-encre">{o.q}</dt>
              <dd className="texte-2 mt-1">{o.a}</dd>
            </div>
          ))}
        </dl>
        <div id="faq" className="mt-10 scroll-mt-20">
          <h3 className="mb-4 text-[17px] font-semibold text-encre">Questions fréquentes</h3>
          <QuestionsPrestation faq={FAQ_RESTANTE} />
        </div>
      </Section>

      {/* ── 5. Le devis en ligne (textes de l'ancienne /devis) ── */}
      <Section large differee id="devis" fond="fond-2" titre={TITRE_DEVIS_EN_LIGNE} intro={INTRO_DEVIS_EN_LIGNE}>
        <EtapesPrestation etapes={ETAPES_DEVIS_EN_LIGNE} />
        <CartesAtouts atouts={AVANTAGES_DEVIS_EN_LIGNE} className="mt-6" />
        <div className="mt-8">
          <Lien href="/contact" variante="secondaire">
            {LIEN_DEVIS_EN_LIGNE}
          </Lien>
        </div>
      </Section>

      {/* ── 6. Pour aller plus loin : les guides, les vitrages ── */}
      <Section id="guides" differee titre="Pour aller plus loin" intro={INTRO_GUIDES}>
        <ul className="border-t border-trait">
          {articles.map((article) => (
            <li key={article.slug} className="border-b border-trait">
              <Link href={`/blog/${article.slug}`} className="flex min-h-[56px] flex-col justify-center py-3 transition-colors duration-[var(--duree-courte)] hover:text-encre-2">
                <span className="text-[17px] font-medium text-encre">{article.title}</span>
                <span className="text-[14px] text-encre-2">
                  {article.category} · {article.readTime} de lecture
                </span>
              </Link>
            </li>
          ))}
          <li className="border-b border-trait">
            <Link href="/prestations/vitrages" className="flex min-h-[56px] flex-col justify-center py-3 transition-colors duration-[var(--duree-courte)] hover:text-encre-2">
              <span className="text-[17px] font-medium text-encre">Films pour vitrages</span>
              <span className="text-[14px] text-encre-2">Intimité, décoration, protection solaire</span>
            </Link>
          </li>
        </ul>
      </Section>

      {/* ── 7. Dernier appel ── */}
      <Section differee titre="Voyez votre pièce transformée avant de décider" intro="Une photo suffit. Vos coordonnées ne sont demandées que si vous voulez recevoir le rendu et un devis." fond="fond-2">
        <Lien href="/simulateur?projet=cuisine">Simuler ma cuisine</Lien>
      </Section>
    </div>
  );
}
