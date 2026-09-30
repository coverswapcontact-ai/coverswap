import Link from "next/link";
import Image from "next/image";
import { fondSrc } from "@/lib/images";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleSchema, BreadcrumbSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { DELAI_RENDU, NB_REFERENCES } from "@/lib/offre";
import {
  getArticleBySlug,
  getRelatedArticles,
  articles,
} from "@/data/blog-articles";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Blog CoverSwap`,
    description: article.excerpt,
    alternates: {
      canonical: `https://coverswap.fr/blog/${article.slug}`,
    },
  };
}

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article.relatedSlugs);
  const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white";

  return (
    <div className="bg-fond">
      <ArticleSchema
        title={article.title}
        description={article.excerpt}
        datePublished={article.dateIso}
        dateModified={article.dateModifiedIso}
        image={`https://coverswap.fr${article.image}-1600.jpg`}
        url={`https://coverswap.fr/blog/${article.slug}`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://coverswap.fr" },
          { name: "Blog", url: "https://coverswap.fr/blog" },
          {
            name: article.title,
            url: `https://coverswap.fr/blog/${article.slug}`,
          },
        ]}
      />

      {/* Ouverture */}
      <section className="bg-fond-2 px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-3xl">
          <p className="surtitre">{article.category}</p>
          <h1 className="titre-1 mt-2 text-encre">{article.title}</h1>
          <p className="mt-4 text-[14px] text-encre-2">
            {article.date} · {article.readTime} de lecture
          </p>
        </div>
      </section>

      {/* Contenu + colonne */}
      <div className="px-4 py-[var(--espace-5)] md:px-6">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_320px]">
          <article className="max-w-none">
            <div className={`${CARTE} p-6 md:p-10`}>
              <div className="relative mb-8 h-64 w-full overflow-hidden rounded-[var(--rayon-sm)] bg-fond-2 md:h-80">
                {/* Illustration sous le titre de l'article : alt vide (le h1 dit déjà le titre). */}
                <Image src={fondSrc(article.image, 1600)} alt="" fill sizes="(max-width: 1024px) 100vw, 700px" className="object-cover" />
              </div>

              <div className="texte space-y-6 text-encre-2">
                <p>{article.content.intro}</p>

                {article.content.sections.map((section, index) => (
                  <div key={index}>
                    <h2 className="titre-2 mt-10 mb-4 text-encre">{section.title}</h2>
                    <p>{section.text}</p>
                  </div>
                ))}

                {article.content.tip && (
                  <div className="my-8 border-l-4 border-encre bg-fond py-3 pl-6">
                    <p className="font-medium text-encre">Astuce CoverSwap : {article.content.tip}</p>
                  </div>
                )}

                <h2 className="titre-2 mt-10 mb-4 text-encre">Conclusion</h2>
                <p>{article.content.conclusion}</p>
              </div>
            </div>

            <div className={`${CARTE} mt-6 flex items-center justify-between gap-4 px-6 py-4`}>
              <div>
                <p className="text-[15px] font-semibold text-encre">Équipe CoverSwap</p>
                <p className="text-[13px] text-encre-2">Experts en covering adhésif</p>
              </div>
              <Link href="/blog" className="inline-flex min-h-[44px] items-center text-[15px] text-encre underline underline-offset-4">
                Retour au blog
              </Link>
            </div>
          </article>

          <aside className="space-y-6">
            <div className={`${CARTE} p-6`}>
              <h3 className="mb-2 text-[17px] font-semibold text-encre">Envie de tester ?</h3>
              <p className="texte-2 mb-5">Simulez gratuitement le rendu chez vous, en {DELAI_RENDU}.</p>
              <Lien href="/simulateur" plein>
                Simuler mon projet
              </Lien>
            </div>

            <div className={`${CARTE} p-6`}>
              <h3 className="mb-2 text-[17px] font-semibold text-encre">{NB_REFERENCES} finitions</h3>
              <p className="texte-2 mb-5">Explorez notre catalogue complet de revêtements Cover Styl&apos; : bois, marbre, béton, métal et plus.</p>
              <Lien href="/matieres" variante="secondaire" plein>
                Voir le catalogue
              </Lien>
            </div>

            <div className={`${CARTE} p-6`}>
              <h3 className="mb-4 text-[17px] font-semibold text-encre">Articles similaires</h3>
              <ul className="space-y-4">
                {related.map((rel) => (
                  <li key={rel.slug}>
                    <Link href={`/blog/${rel.slug}`} className="group block">
                      <span className="block text-[15px] leading-snug font-medium text-encre underline-offset-4 group-hover:underline">{rel.title}</span>
                      <span className="mt-1 inline-block text-[13px] text-encre-2">{rel.readTime} de lecture</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-12 text-center">
          <Lien href="/blog" variante="secondaire">
            Voir tous les articles
          </Lien>
        </div>
      </div>
    </div>
  );
}
