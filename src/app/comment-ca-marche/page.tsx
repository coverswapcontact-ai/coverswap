import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { CommentCaSePasse, QuestionsFrequentes } from "@/components/SectionsCommentCaMarche";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { articles } from "@/data/blog-articles";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_RENDU, DELAI_REPONSE, GARANTIE_ANS, PRIX_PLAGE } from "@/lib/offre";

/**
 * « Comment ça marche » (mission 16, partie 1) : page de transition. Elle rend
 * les sections « Comment ça se passe » et les questions fréquentes de
 * l'accueil, telles quelles, sur le thème clair, puis les liens vers les
 * guides (« Pour aller plus loin » : ils n'ont plus d'entrée au menu ni au
 * pied). La partie 5 la réécrit (procédé, prix, objections).
 */
const URL_PAGE = `${ENTREPRISE.site}/comment-ca-marche`;
const TITRE = "Comment ça marche — covering adhésif, de la photo à la pose | CoverSwap";
const DESCRIPTION = `Une photo et une simulation en ${DELAI_RENDU}, un devis ${DELAI_REPONSE}, une journée de pose : ${PRIX_PLAGE} fourni et posé selon la complexité de la pose, garantie ${GARANTIE_ANS} ans. Les réponses à vos questions.`;

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  alternates: { canonical: URL_PAGE },
  openGraph: { title: TITRE, description: DESCRIPTION, url: URL_PAGE, type: "website", siteName: "CoverSwap", locale: "fr_FR", images: [{ url: `${ENTREPRISE.site}/og-image.jpg`, width: 1200, height: 630 }] },
};

export default function PageCommentCaMarche() {
  return (
    <div className="bg-fond">
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Comment ça marche", url: URL_PAGE }]} />
      <section className="bg-fond-2 px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Comment ça marche" }]} />
          <h1 className="titre-1 max-w-3xl text-encre">Comment ça marche</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">
            Une photo, un devis {DELAI_REPONSE}, une journée de pose. Un film Cover Styl&apos; posé sur vos surfaces existantes, réversible, garanti {GARANTIE_ANS} ans.
          </p>
          <div className="mt-8">
            <Lien href="/simulateur?projet=cuisine">Simuler ma cuisine</Lien>
          </div>
        </div>
      </section>
      <CommentCaSePasse />
      <QuestionsFrequentes fond="fond-2" />
      <Section titre="Pour aller plus loin">
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
        </ul>
      </Section>
      <Section titre="Voyez votre pièce transformée avant de décider" intro="Une photo suffit. Vos coordonnées ne sont demandées que si vous voulez recevoir le rendu et un devis.">
        <Lien href="/simulateur">Simuler sur ma photo</Lien>
      </Section>
    </div>
  );
}
