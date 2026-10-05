import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { CartesAtouts, EtapesPrestation, QuestionsPrestation } from "@/components/BlocsPrestation";
import { CommentOnTravaille } from "@/components/accueil/CommentOnTravaille";
import { FormulaireRappel } from "@/components/accueil/FormulaireRappel";
import { BreadcrumbSchema, FAQSchema } from "@/components/JsonLd";
import { BandeMatiere } from "@/components/revue/BandeMatiere";
import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { Section } from "@/components/simulation/Section";
import { articles } from "@/data/blog-articles";
import { PHOTOS_UTILES } from "@/data/ambiances";
import { ENTREPRISE } from "@/lib/entreprise";
import { lienSimuler } from "@/lib/liens-simulateur";
import { matiereCartel } from "@/lib/matieres-vedettes";
import { metadonneesPage } from "@/lib/metadonnees";
import {
  A_PREPARER,
  DEROULE,
  DESCRIPTION_PAGE,
  ENTRETIEN,
  FAQ_RESTANTE,
  GUIDE_ENTRETIEN,
  INTRO_DEROULE,
  INTRO_GUIDES,
  INTRO_PAGE,
  LEGENDE_FOURCHETTES,
  LIGNES_FOURCHETTES,
  MOTS_CLES_GUIDES,
  NOTE_ETAPES,
  OBJECTIONS,
  PRIX_COMPRIS,
  PRIX_CONDITIONS,
  PRIX_MESURE,
  PRIX_REGLE,
  QUAND_RENOVER_NON,
  QUAND_RENOVER_OUI,
  QUESTIONS_BALISEES,
  RESTE_EN_PLACE,
  SIGNES_RENOVER,
  TITRE_DEROULE,
  TITRE_ENTRETIEN,
  TITRE_EN_PLACE,
  TITRE_PAGE,
  TITRE_QUAND_RENOVER,
} from "./contenu";
import { AVANTAGES_DEVIS_EN_LIGNE, ETAPES_DEVIS_EN_LIGNE, INTRO_DEVIS_EN_LIGNE, LIEN_DEVIS_EN_LIGNE, MOTS_CLES_DEVIS_EN_LIGNE, TITRE_DEVIS_EN_LIGNE } from "./devis-en-ligne";

/**
 * « Comment ça marche » (mission 16, partie 5 ; site 3.0, lot C3) : la page qui RASSURE — le procédé, les délais, ce qui
 * reste en place, l'entretien, le prix, les objections —, puis une seule action, « Simuler ma pièce »
 * (`depuis=comment-ca-marche`), en haut des étapes et au dernier appel.
 *  1. Ouverture : le titre, une phrase (« Pas de travaux » de l'ancien accueil) ;
 *  2. `#comment-ca-marche` : les quatre étapes de l'accueil (`CommentOnTravaille` : votre photo, la simulation,
 *     `echantillons-table`, `pose-mains`), la preuve de finition (`detail-chant`), les garanties, le bouton principal ;
 *  3. `#deroule` : le déroulé complet et ses délais (`mesure-visite`, `outils-pose`) ;
 *  4. `#en-place` : ce qui reste en place, ce que vous préparez ;
 *  5. `#entretien` : quatre gestes et le guide ; puis la bande de chêne AG13 ;
 *  6. `#prix` : au mètre linéaire, ce qui est compris, les fourchettes par pièce, le lien vers l'estimation ;
 *  7. `#objections` : une ligne et deux phrases au plus par objection, puis la FAQ générale (`#faq`, repliée) sans les
 *     questions que les objections reprennent ; UN balisage `FAQPage` pour les deux (`QUESTIONS_BALISEES`) ;
 *  8. `#quand-renover` : l'encart « Quand rénover ? » (`usure-detail`) ;
 *  9. `#devis` : le devis en ligne (textes de l'ancienne /devis, partie 4) ;
 * 10. `#guides` : les guides `/blog/<slug>` (hors menu ; l'index /blog est redirigé ici) et les films pour vitrages ;
 * 11. le dernier appel, en encre : le même principal, « Être rappelé » en `sur-encre`.
 * Chacune des six photos utiles une fois, étiquetée « Ambiance » ; la capture du simulateur, « Simulation ». Les blocs
 * prennent les filets (plus de cartes blanches). Composant serveur, synchrone (le rappel seul est client).
 */
const CHEMIN = "/comment-ca-marche";
const DEPUIS = "comment-ca-marche";
const LIEN_SIMULER = lienSimuler({ depuis: DEPUIS });

export const metadata: Metadata = {
  ...metadonneesPage({ titre: TITRE_PAGE, description: DESCRIPTION_PAGE, chemin: CHEMIN }),
  keywords: `${MOTS_CLES_DEVIS_EN_LIGNE}, ${MOTS_CLES_GUIDES}`,
};

/** Le texte alternatif d'une photo utile (`data/ambiances`), écrit avec la bibliothèque. */
const altPhoto = (nom: string) => PHOTOS_UTILES.find((p) => p.image === nom)?.alt ?? "";

const TAILLES_DEROULE = "(min-width: 1024px) 420px, (min-width: 768px) 50vw, calc(100vw - 32px)";
const BANDE = matiereCartel("AG13");
const GUIDE = articles.find((a) => a.slug === GUIDE_ENTRETIEN);

export default function PageCommentCaMarche() {
  return (
    <div>
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Comment ça marche", url: `${ENTREPRISE.site}${CHEMIN}` }]} />
      <FAQSchema faqs={QUESTIONS_BALISEES} />

      {/* ── 1. Ouverture ── */}
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Comment ça marche" }]} />
          <h1 className="titre-1 max-w-3xl text-encre">Comment ça marche</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">{INTRO_PAGE}</p>
        </div>
      </section>

      {/* ── 2. Les quatre étapes, la preuve de finition, les garanties, le bouton principal ── */}
      <CommentOnTravaille id="comment-ca-marche" titre="De la photo à la pose" intro={null} note={NOTE_ETAPES} depuis={DEPUIS} idBouton="etapes-simuler" preuve enTete />

      {/* ── 3. Le déroulé complet et ses délais ── */}
      <Section id="deroule" large differee ton="papier-2" titre={TITRE_DEROULE} intro={INTRO_DEROULE}>
        <ol className="border-b border-encre">
          {DEROULE.map((e) => (
            <li key={e.titre} className="grid gap-x-8 gap-y-2 border-t border-encre py-6 md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)_420px]">
              <p className="surtitre pt-1">{e.quand}</p>
              <div>
                <h3 className="font-display text-[22px] leading-tight font-semibold text-encre">{e.titre}</h3>
                <p className="texte-2 mt-2 max-w-xl">{e.texte}</p>
              </div>
              {e.photo ? <Photo nom={e.photo} alt={altPhoto(e.photo)} ratio="3 / 2" tailles={TAILLES_DEROULE} etiquette="Ambiance" className="mt-3 rounded-[var(--rayon-md)] md:col-start-2 lg:col-start-3 lg:row-start-1 lg:mt-0" /> : null}
            </li>
          ))}
        </ol>
      </Section>

      {/* ── 4. Ce qui reste en place, ce que vous préparez ── */}
      <Section id="en-place" large differee titre={TITRE_EN_PLACE}>
        <div className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-12">
          <dl className="grid gap-x-8 sm:grid-cols-2">
            {RESTE_EN_PLACE.map((r) => (
              <div key={r.titre} className="border-t border-encre py-4">
                <dt className="text-[17px] font-semibold text-encre">{r.titre}</dt>
                <dd className="texte-2 mt-1">{r.texte}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-encre pt-4">
            <h3 className="text-[17px] font-semibold text-encre">Ce que vous préparez</h3>
            <ul className="texte-2 mt-2 list-disc space-y-1 pl-5">
              {A_PREPARER.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="texte-2 mt-3">Le reste, on s&apos;en occupe.</p>
          </div>
        </div>
      </Section>

      {/* ── 5. L'entretien ── */}
      <Section id="entretien" large differee ton="papier-2" titre={TITRE_ENTRETIEN}>
        <dl className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRETIEN.map((g) => (
            <div key={g.titre} className="border-t border-encre py-4">
              <dt className="text-[17px] font-semibold text-encre">{g.titre}</dt>
              <dd className="texte-2 mt-1">{g.texte}</dd>
            </div>
          ))}
        </dl>
        {GUIDE ? (
          <p className="mt-4">
            <Link href={`/blog/${GUIDE.slug}`} className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
              Le guide de l&apos;entretien
            </Link>
          </p>
        ) : null}
      </Section>
      {BANDE ? <BandeMatiere matiere={BANDE} /> : null}

      {/* ── 6. Le prix ── */}
      <Section id="prix" large differee titre="Le prix" intro={PRIX_MESURE}>
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div className="texte-2 space-y-4">
            <p>{PRIX_REGLE}</p>
            <p>{PRIX_COMPRIS}</p>
            <p>{PRIX_CONDITIONS}</p>
          </div>
          <div>
            <table className="w-full border-collapse border-b border-encre text-left">
              <caption className="mb-3 text-left text-[15px] font-semibold text-encre">{LEGENDE_FOURCHETTES}</caption>
              <tbody>
                {LIGNES_FOURCHETTES.map((l) => (
                  <tr key={l.projet} className="border-t border-encre">
                    <th scope="row" className="py-3 pr-4 text-[15px] font-normal text-encre-2">
                      {l.projet}
                    </th>
                    <td className="py-3 text-right text-[15px] font-semibold whitespace-nowrap text-encre tabular-nums">{l.prix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6">
              <Lien href={LIEN_SIMULER} variante="secondaire">
                Estimer sur ma photo
              </Lien>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 7. Vos questions : les objections, puis la FAQ générale (repliée) ── */}
      <Section id="objections" large differee ton="papier-2" titre="Vos questions">
        <dl className="max-w-3xl border-t border-encre">
          {OBJECTIONS.map((o) => (
            <div key={o.sujet} className="border-b border-encre py-5">
              <dt className="text-[17px] font-semibold text-encre">{o.q}</dt>
              <dd className="texte-2 mt-1">{o.a}</dd>
            </div>
          ))}
        </dl>
        <div id="faq" className="mt-12 max-w-3xl scroll-mt-20">
          <h3 className="mb-4 font-display text-[22px] leading-tight font-semibold text-encre">Questions fréquentes</h3>
          <QuestionsPrestation faq={FAQ_RESTANTE} />
        </div>
      </Section>

      {/* ── 8. Quand rénover ? ── */}
      <Section id="quand-renover" large differee>
        <div className="grid gap-8 border-y border-encre py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center md:gap-12">
          <Photo nom="usure-detail" alt={altPhoto("usure-detail")} ratio="3 / 2" tailles="(min-width: 768px) 500px, calc(100vw - 32px)" etiquette="Ambiance" className="rounded-[var(--rayon-md)]" />
          <div>
            <h2 className="titre-2 text-encre">{TITRE_QUAND_RENOVER}</h2>
            <p className="texte-2 mt-3">{QUAND_RENOVER_OUI}</p>
            <ul className="texte-2 mt-2 list-disc space-y-1 pl-5">
              {SIGNES_RENOVER.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="texte-2 mt-4">{QUAND_RENOVER_NON}</p>
          </div>
        </div>
      </Section>

      {/* ── 9. Le devis en ligne (textes de l'ancienne /devis) ── */}
      <Section large differee id="devis" ton="papier-2" titre={TITRE_DEVIS_EN_LIGNE} intro={INTRO_DEVIS_EN_LIGNE}>
        <EtapesPrestation etapes={ETAPES_DEVIS_EN_LIGNE} />
        <CartesAtouts atouts={AVANTAGES_DEVIS_EN_LIGNE} className="mt-10" />
        <div className="mt-8">
          <Lien href="/contact" variante="secondaire">
            {LIEN_DEVIS_EN_LIGNE}
          </Lien>
        </div>
      </Section>

      {/* ── 10. Pour aller plus loin : les guides, les vitrages ── */}
      <Section id="guides" large differee titre="Pour aller plus loin" intro={INTRO_GUIDES}>
        <ul className="max-w-3xl border-t border-encre">
          {articles.map((article) => (
            <li key={article.slug} className="border-b border-encre">
              <Link href={`/blog/${article.slug}`} className="flex min-h-[56px] flex-col justify-center py-3 transition-colors duration-[var(--duree-courte)] hover:text-encre-2">
                <span className="text-[17px] font-medium text-encre">{article.title}</span>
                <span className="text-[14px] text-encre-2">
                  {article.category} · {article.readTime} de lecture
                </span>
              </Link>
            </li>
          ))}
          <li className="border-b border-encre">
            <Link href="/prestations/vitrages" className="flex min-h-[56px] flex-col justify-center py-3 transition-colors duration-[var(--duree-courte)] hover:text-encre-2">
              <span className="text-[17px] font-medium text-encre">Films pour vitrages</span>
              <span className="text-[14px] text-encre-2">Intimité, décoration, protection solaire</span>
            </Link>
          </li>
        </ul>
      </Section>

      {/* ── 11. Dernier appel, en encre ── */}
      <Section id="dernier-appel" large differee ton="encre" titre="Voyez votre pièce transformée avant de décider" intro="Une photo suffit. Vos coordonnées ne sont demandées que si vous voulez recevoir le rendu et un devis.">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Lien href={LIEN_SIMULER}>Simuler ma pièce</Lien>
          <FormulaireRappel depuis={DEPUIS} variante="sur-encre" />
        </div>
      </Section>
    </div>
  );
}
