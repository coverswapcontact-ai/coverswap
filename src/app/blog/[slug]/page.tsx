import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TextureBackground from "@/components/TextureBackground";
import { ArticleSchema, BreadcrumbSchema } from "@/components/JsonLd";
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

  return (
    <div className="min-h-screen pt-28 pb-20">
      <ArticleSchema
        title={article.title}
        description={article.excerpt}
        datePublished={article.date}
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

      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <TextureBackground
          src={article.image}
          overlay="rgba(0,0,0,0.80)"
          fadeTop={false}
          fadeBottom
        />

        <div className="container-custom relative z-20 max-w-3xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-rouge bg-rouge/10 px-4 py-1.5 rounded-full">
            {article.category}
          </span>

          <h1 className="font-display text-3xl md:text-5xl font-bold mt-6 mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center justify-center gap-4 text-sm text-gris-400">
            <span className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {article.date}
            </span>
            <span className="w-1 h-1 rounded-full bg-gris-600" />
            <span className="flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {article.readTime} de lecture
            </span>
          </div>
        </div>
      </section>

      {/* Content + sidebar */}
      <div className="container-custom mt-12">
        <div className="grid lg:grid-cols-[1fr_320px] gap-12">
          {/* Article body */}
          <article className="max-w-none">
            <div className="glass-card p-8 md:p-10">
              {/* Featured image */}
              <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden relative mb-8">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover"
                />
              </div>

              <div className="prose prose-invert max-w-none space-y-6 text-gris-300 leading-relaxed">
                <p className="text-lg">{article.content.intro}</p>

                {article.content.sections.map((section, index) => (
                  <div key={index}>
                    <h2 className="font-display text-2xl font-bold text-white mt-10 mb-4">
                      {section.title}
                    </h2>
                    <p>{section.text}</p>
                  </div>
                ))}

                {article.content.tip && (
                  <div className="border-l-4 border-rouge pl-6 py-2 my-8 bg-rouge/5 rounded-r-lg">
                    <p className="text-white font-medium">
                      Astuce CoverSwap : {article.content.tip}
                    </p>
                  </div>
                )}

                <h2 className="font-display text-2xl font-bold text-white mt-10 mb-4">
                  Conclusion
                </h2>
                <p>{article.content.conclusion}</p>
              </div>
            </div>

            {/* Author / share bar */}
            <div className="flex items-center justify-between mt-6 glass-card px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rouge/20 flex items-center justify-center text-rouge font-bold text-sm">
                  CS
                </div>
                <div>
                  <p className="text-sm font-semibold">Équipe CoverSwap</p>
                  <p className="text-xs text-gris-500">
                    Experts en covering adhésif
                  </p>
                </div>
              </div>
              <Link
                href="/blog"
                className="text-sm text-gris-400 hover:text-rouge transition-colors flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                Retour au blog
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* CTA simulation */}
            <div className="glass-card p-6 text-center border-rouge/20">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rouge/10 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-rouge"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg mb-2">
                Envie de tester ?
              </h3>
              <p className="text-sm text-gris-400 mb-5">
                Simulez gratuitement le rendu sur votre propre surface en 60
                secondes.
              </p>
              <Link
                href="/simulation"
                className="btn-primary text-sm px-6 py-3 w-full"
              >
                Lancer la simulation
              </Link>
            </div>

            {/* CTA catalogue */}
            <div className="glass-card p-6 text-center border-rouge/20">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rouge/10 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-rouge"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                  />
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg mb-2">
                +490 finitions
              </h3>
              <p className="text-sm text-gris-400 mb-5">
                Explorez notre catalogue complet de revetements Cover Styl&apos; : bois, marbre, beton, metal et plus.
              </p>
              <Link
                href="/revetements"
                className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-rouge/40 text-white hover:text-rouge rounded-xl text-sm px-6 py-3 w-full transition-colors font-semibold"
              >
                Voir le catalogue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Related articles */}
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-lg mb-4">
                Articles similaires
              </h3>
              <div className="space-y-4">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/blog/${rel.slug}`}
                    className="block group"
                  >
                    <p className="text-sm font-medium group-hover:text-rouge transition-colors leading-snug">
                      {rel.title}
                    </p>
                    <span className="text-xs text-gris-500 mt-1 inline-block">
                      {rel.readTime} de lecture
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-lg mb-2">
                Restez inspiré
              </h3>
              <p className="text-sm text-gris-400 mb-4">
                Recevez nos meilleurs conseils déco et covering chaque mois.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gris-500 focus:outline-none focus:border-rouge/50"
                />
                <button className="bg-rouge hover:bg-rouge-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  OK
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Back to blog */}
      <div className="container-custom mt-16 text-center">
        <Link href="/blog" className="btn-secondary">
          Voir tous les articles
        </Link>
      </div>
    </div>
  );
}
