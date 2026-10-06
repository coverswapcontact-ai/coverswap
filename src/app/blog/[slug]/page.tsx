import Link from "next/link";
import { fondSrc, fondSrcSet } from "@/lib/images";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { ContenuPrix } from "@/components/BlocPrix";
import { ArticleSchema, BreadcrumbSchema } from "@/components/JsonLd";
import { CarteAmbiance } from "@/components/ambiances/CarteAmbiance";
import { Cartel } from "@/components/revue/Cartel";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { DELAI_RENDU, NB_REFERENCES } from "@/lib/offre";
import { chargerTarifs } from "@/lib/tarifs-site";
import { getArticleBySlug, getRelatedArticles, articles, type BlogArticle } from "@/data/blog-articles";
import { actionDuGuide, illustrationDe, imageDuBalisage, insecables, type IllustrationGuide } from "./illustration";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return metadonneesPage({ titre: `${article.titreSeo ?? article.title} | CoverSwap`, description: article.excerpt, chemin: `/blog/${article.slug}` });
}

/**
 * Un guide (mission 16, partie 5) : l'adresse reste (hors menu), l'index /blog est redirigé vers « Comment ça
 * marche », qui liste les guides (`#guides`) : le fil d'Ariane et les retours y mènent.
 *
 * Site 3.0, lot C7 : sur le papier du gabarit, sans carte blanche (des filets, comme les autres pages). L'ouverture est la photo
 * de fond des premiers guides (décorative, sans étiquette : une photo, pas une image générée), ou, pour les guides
 * écrits avec la bibliothèque, le curseur « Ambiance · avant / après » d'une paire (`paire`) ou une photo utile
 * « Ambiance » (`imagePreparee`), décrits ; une section peut porter une image de plus et les prix publiés du CRM
 * (`ContenuPrix`, lus seulement quand le guide en montre). Liens vers le simulateur : `depuis=blog`.
 */
const GUIDES = "/comment-ca-marche#guides";

/**
 * La largeur de la colonne de l'article : la page moins les gouttières (16 / 24 px), 768 px au plus, et à partir de
 * 1 024 px moins la colonne de 300 px et son écart de 64 px.
 */
const TAILLES_ILLUSTRATION = "(min-width: 1152px) 768px, (min-width: 1024px) calc(100vw - 412px), (min-width: 816px) 768px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

/** L'ouverture d'un guide écrit avec la bibliothèque : le curseur (premier écran, prioritaire) et ses cartels, ou la photo utile. */
function Ouverture({ illustration }: { illustration: IllustrationGuide }) {
  if (illustration.type === "photo") {
    return <Photo nom={illustration.nom} alt={illustration.alt} tailles={TAILLES_ILLUSTRATION} priorite etiquette="Ambiance" className="rounded-[var(--rayon-md)]" />;
  }
  const { cas } = illustration;
  return (
    <figure className="m-0">
      <AvantApres
        avant={cas.preparees.avant?.src ?? null}
        apres={cas.preparees.apres.src}
        alt={cas.ambiance.alt}
        altAvant={cas.altAvant}
        ratio={cas.ratio}
        preparees={{ avant: cas.preparees.avant, apres: cas.preparees.apres, tailles: TAILLES_ILLUSTRATION }}
        priorite
        outilsMobile="comparer"
        etiquette="Ambiance · avant / après"
      />
      <figcaption className="mt-3">
        <span className="block text-[15px] text-encre-2">{cas.nom}. Glissez le curseur&nbsp;: à gauche la pièce d&apos;origine, à droite les matières du catalogue.</span>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3" aria-label={`Matières posées : ${cas.nom}`}>
          {cas.matieres.map((m) => (
            <li key={m.matiere.id}>
              <span className="block text-[13px] text-encre-2">{m.surfaces}</span>
              <Cartel matiere={m.matiere} className="mt-1" />
            </li>
          ))}
        </ul>
        <Link href={cas.lien} className="mt-1 inline-flex min-h-[44px] items-center text-[15px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
          Essayer cette composition chez moi
        </Link>
      </figcaption>
    </figure>
  );
}

/** Une image de section : la carte d'une paire (titre, curseur, cartels, « Essayer »), ou la photo utile. */
function ImageSection({ illustration }: { illustration: IllustrationGuide }) {
  if (illustration.type === "photo") {
    return <Photo nom={illustration.nom} alt={illustration.alt} tailles={TAILLES_ILLUSTRATION} etiquette="Ambiance" className="mt-6 rounded-[var(--rayon-md)]" />;
  }
  return (
    <div className="mt-6 flex flex-col">
      <CarteAmbiance cas={illustration.cas} tailles={TAILLES_ILLUSTRATION} />
    </div>
  );
}

/** L'illustration de l'ouverture : celle de la bibliothèque, sinon `null` (la photo de fond). */
function illustrationOuverture(article: BlogArticle): IllustrationGuide | null {
  const nom = article.paire ?? article.imagePreparee;
  return nom ? illustrationDe(nom) : null;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const related = getRelatedArticles(article.relatedSlugs);
  const ouverture = illustrationOuverture(article);
  // Les tarifs ne sont lus que pour un guide qui les montre : les autres restent sans appel au CRM.
  const tarifs = article.content.sections.some((s) => s.prix) ? await chargerTarifs() : null;
  const action = actionDuGuide(article);
  const BLOC = "border-t border-encre pt-4";

  return (
    <div>
      <ArticleSchema
        title={article.title}
        description={article.excerpt}
        datePublished={article.dateIso}
        dateModified={article.dateModifiedIso}
        image={imageDuBalisage(article)}
        url={`${ENTREPRISE.site}/blog/${article.slug}`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: ENTREPRISE.site },
          { name: "Comment ça marche", url: `${ENTREPRISE.site}/comment-ca-marche` },
          {
            name: article.title,
            url: `${ENTREPRISE.site}/blog/${article.slug}`,
          },
        ]}
      />

      {/* Titre */}
      <section className="px-4 pt-6 pb-8 md:px-6 md:pt-10 md:pb-10">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Comment ça marche", href: GUIDES }, { label: "Guide" }]} />
          <p className="surtitre">{article.category}</p>
          <h1 className="titre-1 mt-2 max-w-3xl text-balance text-encre">{insecables(article.title)}</h1>
          <p className="mt-4 text-[14px] text-encre-2">
            {article.date} · {article.readTime} de lecture
          </p>
          {/* Au téléphone (et jusqu'à 1 024 px), la colonne passe sous l'article : son bouton principal aussi au premier écran (relecture des lots B et C). */}
          <div className="mt-6 lg:hidden">
            <Lien href={action.href}>{action.libelle}</Lien>
          </div>
        </div>
      </section>

      {/* Contenu + colonne */}
      <div className="px-4 pb-[var(--espace-5)] md:px-6">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <article className="min-w-0 max-w-3xl">
            {ouverture ? (
              <Ouverture illustration={ouverture} />
            ) : (
              <div className="relative h-64 w-full overflow-hidden rounded-[var(--rayon-md)] bg-fond-2 md:h-80">
                {/*
                  Illustration sous le titre de l'article : alt vide (le h1 dit déjà le titre). `images.unoptimized` :
                  next/image ne rendrait que le 1600 px ; le navigateur choisit ici entre 800 et 1600 (`fondSrcSet`) à la
                  largeur réelle de la colonne (hauteur réservée par le cadre). Au premier écran d'un téléphone : priorité haute.
                */}
                {/* eslint-disable-next-line @next/next/no-img-element -- fichiers locaux déjà dimensionnés (800 / 1600), servis par srcset */}
                <img
                  src={fondSrc(article.image ?? "", 800)}
                  srcSet={fondSrcSet(article.image ?? "")}
                  sizes={TAILLES_ILLUSTRATION}
                  alt=""
                  decoding="async"
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            )}

            <div className="texte mt-8 text-encre-2">
              <p>{insecables(article.content.intro)}</p>

              {article.content.sections.map((section) => {
                const image = section.image ? illustrationDe(section.image) : null;
                return (
                  <section key={section.title} className="mt-10">
                    <h2 className="titre-2 mb-4 text-encre">{insecables(section.title)}</h2>
                    <p>{insecables(section.text)}</p>
                    {image ? <ImageSection illustration={image} /> : null}
                    {section.prix ? <ContenuPrix tarifs={tarifs} familles={section.prix} sansIntro className="mt-6" /> : null}
                  </section>
                );
              })}

              {article.content.tip && (
                <div className="my-10 border-l-4 border-encre bg-fond-2 py-3 pr-4 pl-6">
                  <p className="font-medium text-encre">Astuce CoverSwap&nbsp;: {insecables(article.content.tip)}</p>
                </div>
              )}

              <h2 className="titre-2 mt-10 mb-4 text-encre">Conclusion</h2>
              <p>{insecables(article.content.conclusion)}</p>
            </div>

            {article.liens?.length ? (
              <nav aria-labelledby="plus-loin" className="mt-12">
                <h2 id="plus-loin" className="surtitre">
                  Pour aller plus loin
                </h2>
                <ul className="mt-3 border-t border-encre">
                  {article.liens.map((l) => (
                    <li key={l.href} className="border-b border-encre">
                      <Link href={l.href} className="flex min-h-[56px] items-center py-3 text-[17px] font-medium text-encre transition-colors duration-[var(--duree-courte)] hover:text-encre-2">
                        {insecables(l.libelle)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <div className="mt-12 flex items-center justify-between gap-4 border-t border-trait pt-4">
              <div>
                <p className="text-[15px] font-semibold text-encre">Équipe CoverSwap</p>
                <p className="text-[13px] text-encre-2">Poseurs de covering adhésif</p>
              </div>
              <Link href="/comment-ca-marche" className="inline-flex min-h-[44px] items-center text-[15px] text-encre underline underline-offset-4">
                Comment ça marche
              </Link>
            </div>
          </article>

          <aside className="space-y-10">
            <div className={BLOC}>
              <h2 className="mb-2 text-[17px] font-semibold text-encre">Envie de tester ?</h2>
              <p className="texte-2 mb-5">Voyez le rendu sur votre propre photo, gratuitement, en {DELAI_RENDU}.</p>
              <Lien href={action.href} plein>
                {action.libelle}
              </Lien>
            </div>

            <div className={BLOC}>
              <h2 className="mb-2 text-[17px] font-semibold text-encre">{NB_REFERENCES} finitions</h2>
              <p className="texte-2 mb-5">Le catalogue complet des revêtements Cover Styl&apos; : bois, marbre, béton, métal et plus.</p>
              <Lien href="/matieres" variante="secondaire" plein>
                Voir le catalogue
              </Lien>
            </div>

            <div className={BLOC}>
              <h2 className="mb-4 text-[17px] font-semibold text-encre">Articles similaires</h2>
              <ul className="space-y-4">
                {related.map((rel) => (
                  <li key={rel.slug}>
                    <Link href={`/blog/${rel.slug}`} className="group block">
                      <span className="block text-[15px] leading-snug font-medium text-encre underline-offset-4 group-hover:underline">{insecables(rel.title)}</span>
                      <span className="mt-1 inline-block text-[13px] text-encre-2">{rel.readTime} de lecture</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-12 text-center">
          <Lien href={GUIDES} variante="secondaire">
            Voir tous les guides
          </Lien>
        </div>
      </div>
    </div>
  );
}
