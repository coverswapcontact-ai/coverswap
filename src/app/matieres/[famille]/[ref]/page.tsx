import type { Metadata } from "next";
import Link from "@/components/LienSite";
import { notFound } from "next/navigation";
import { preconnect } from "react-dom";
import { insecables } from "@/app/blog/[slug]/illustration";
import Breadcrumb from "@/components/Breadcrumb";
import { CarteRealisation } from "@/components/CarteRealisation";
import { LiensAmbiance } from "@/components/ambiances/LiensAmbiance";
import { Prechargements } from "@/components/Prechargements";
import { Cartel } from "@/components/revue/Cartel";
import { Echantillon, OMBRE_ECHANTILLON } from "@/components/revue/Echantillon";
import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { Section } from "@/components/simulation/Section";
import { GLOSES_FINITIONS, NOTES_MATIERES, REPERES_FAMILLES } from "@/data/notes-matieres";
import { lienInspiration } from "@/lib/ambiances";
import { familleDuCartel, libelleFinition } from "@/lib/cartel";
import { versEtudeReelle } from "@/lib/etude-de-cas";
import { TIROIRS, cheminFamille } from "@/lib/familles-matieres";
import { ambiancesDeLaFiche, descriptionFiche, ecartLisible, estFicheIndexee, ficheDe, parametresDesFiches, photosUtilesDeLaFiche, prochesDeLaFiche, realisationsDeLaMatiere, resumeFiche, titreFiche } from "@/lib/fiches-matieres";
import { prestationsDeFamille } from "@/lib/indexation-matieres";
import { avecDepuis } from "@/lib/liens-simulateur";
import { lienEssayer, tiroirs, type Matiere } from "@/lib/matieres";
import { lienMatiere, matiereCartel } from "@/lib/matieres-vedettes";
import { metadonneesPage } from "@/lib/metadonnees";
import { imagePartage, realisationPartagee } from "@/lib/partage";
import { NB_REFERENCES } from "@/lib/offre";
import { chargerPublications } from "@/lib/publications";
import { baseCrm, urlEchantillon } from "@/lib/simulateur/generation-client";
import { teinteDe } from "@/lib/teintes";
import { lienVisiteMatiere } from "@/lib/visite";
import revetements from "@/data/revetements.json";

type Props = { params: Promise<{ famille: string; ref: string }> };

/**
 * `/matieres/<famille>/<REF>` (site 3.0, lot D4 ; énoncé, phase D) : la fiche d'une matière, 497 pages statiques
 * (`generateStaticParams`, `dynamicParams = false` ; une référence d'une autre famille, une autre casse ou une
 * référence inconnue : 404, et `notFound()` par sûreté). Dans l'ordre :
 *  1. l'ouverture : fil d'Ariane (visible et `BreadcrumbList`), le nom en `h1`, la GRANDE vignette (l'échantillon
 *     entier du CRM, 595 × 790, la seule image prioritaire, `preconnect` vers le CRM), « Essayer chez moi » (le
 *     simulateur avec la matière posée, `?ref=<REF>&depuis=matiere-fiche`, mécanisme `matiere-demandee`) et « La voir
 *     en vrai chez moi » (`/contact?ref=<REF>&visite=1`, message prérempli), le cartel, la teinte, la finition ;
 *  2. la note (les 52 fiches indexées : `data/notes-matieres`, écrite à la main), et sous elle `resumeFiche` (teinte,
 *     finition, ambiance, voisines : ses données à elle) ;
 *  3. les repères : où la poser (ses prestations), l'entretien, à savoir, en voir en vrai ;
 *  4. « Vue dans » : une réalisation publiée qui la porte d'abord (si le CRM le dit), puis toutes les ambiances des
 *     séries 1 et 2 où elle est posée (« Ambiance »), puis les photos de pose où on la voit (`photosUtilesDeLaFiche`,
 *     « Ambiance », vers /comment-ca-marche) — section omise s'il n'y en a aucune ;
 *  5. ses six voisines de teinte (ΔE), en échantillons ;
 *  6. sa famille, les autres familles, le présentoir ;
 *  7. le dernier appel, en encre.
 * Indexée (52 fiches) ou `noindex, follow` (les 445 autres) : `estFicheIndexee`. Revalidée comme /realisations
 * (300 s) pour les réalisations publiées ; tout le reste est statique.
 */
export const dynamicParams = false;
export const revalidate = 300;

const CATALOGUE = revetements as Matiere[];
/** La valeur `depuis` des liens vers le simulateur de ces pages (`docs/SUIVI.md`). */
export const DEPUIS_FICHE = "matiere-fiche";
/** Les dimensions de l'échantillon entier servi par le CRM. */
export const LARGEUR_ECHANTILLON = 595;
export const HAUTEUR_ECHANTILLON = 790;
const TAILLES_AMBIANCE = "(min-width: 1024px) 360px, (min-width: 768px) calc(50vw - 36px), calc(100vw - 32px)";

export function generateStaticParams() {
  return parametresDesFiches();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { famille, ref } = await params;
  const m = ficheDe(famille, ref);
  if (!m) return {};
  // Site 3.0 (lot F2) : l'image de partage, la première réalisation publiée qui la porte, sinon l'avant / après de « Vue dans ».
  const chemin = lienMatiere(m.id);
  const { realisations } = await chargerPublications();
  const image = imagePartage(chemin, realisationPartagee(realisationsDeLaMatiere(m.id, realisations)[0]));
  return metadonneesPage({ titre: titreFiche(m), description: descriptionFiche(m, ambiancesDeLaFiche(m.id).length), chemin, image, indexer: estFicheIndexee(m.id) });
}

export default async function PageFiche({ params }: Props) {
  const { famille, ref } = await params;
  const m = ficheDe(famille, ref);
  if (!m) notFound();

  const crm = baseCrm();
  if (crm) preconnect(crm);

  const cartel = matiereCartel(m.id)!;
  const nomFamille = TIROIRS[m.famille];
  const note = estFicheIndexee(m.id) ? NOTES_MATIERES[m.id] : undefined;
  const reperes = REPERES_FAMILLES[m.famille];
  const vues = ambiancesDeLaFiche(m.id);
  const photosDePose = photosUtilesDeLaFiche(m.id);
  const { realisations } = await chargerPublications();
  const chantiers = realisationsDeLaMatiere(m.id, realisations);
  const proches = prochesDeLaFiche(m.id);
  const prestations = prestationsDeFamille(m.famille);
  const familleDuTiroir = tiroirs(CATALOGUE).find((t) => t.id === m.famille)!;
  const autres = tiroirs(CATALOGUE).filter((t) => t.id !== "tout" && t.id !== m.famille);
  const lienEssai = lienEssayer(m.id, DEPUIS_FICHE);
  const lienVisite = lienVisiteMatiere(m.id);
  const teinte = teinteDe(m.famille, m.hex);
  const nomComplet = `${m.nom} ${m.id}`;

  const boutons = (surEncre: boolean) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Lien href={lienEssai}>Essayer chez moi</Lien>
      <Lien href={lienVisite} variante={surEncre ? "sur-encre" : "secondaire"}>
        La voir en vrai chez moi
      </Lien>
    </div>
  );

  return (
    <div>
      {/* ── 1. Ouverture : le nom, la grande vignette, les deux actions, le cartel ── */}
      <section aria-labelledby="titre-fiche" className="px-4 pt-6 pb-6 md:px-6 md:pt-10 md:pb-10">
        <div className="mx-auto grid max-w-6xl gap-x-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-[auto_1fr]">
          <div className="lg:col-start-2">
            <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Matières", href: "/matieres" }, { label: nomFamille, href: cheminFamille(m.famille) }, { label: nomComplet, href: lienMatiere(m.id) }]} />
            <p className="surtitre">
              {familleDuCartel(m.famille)} · {m.id}
            </p>
            <h1 id="titre-fiche" className="titre-1 mt-2 text-encre">
              {m.nom}
            </h1>
          </div>
          <figure className="m-0 mt-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0">
            <div className={`relative aspect-[4/3] overflow-hidden rounded-[var(--rayon-sm)] md:aspect-[595/790] ${OMBRE_ECHANTILLON}`} style={{ backgroundColor: m.hex }}>
              {/* Lot F6 : l'échantillon (le LCP) est préchargé par `Prechargements` et posé dans un `<picture>` : un `<img>`
                  non différé d'un composant serveur devient un indice de préchargement de la charge RSC, et chaque page
                  qui montre un lien vers la fiche téléchargeait l'échantillon en priorité haute en la préchargeant. */}
              <Prechargements liste={[{ href: urlEchantillon(m.id), options: { as: "image", fetchPriority: "high", referrerPolicy: "no-referrer" } }]} />
              <picture>
                <img src={urlEchantillon(m.id)} alt={`Échantillon ${m.nom}, référence ${m.id}`} width={LARGEUR_ECHANTILLON} height={HAUTEUR_ECHANTILLON} loading="eager" fetchPriority="high" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
              </picture>
            </div>
            <figcaption className="mt-2 text-[14px] text-encre-2">L&apos;échantillon du fabricant, en grand. Un écran ne rend pas fidèlement une matière : on l&apos;apporte chez vous.</figcaption>
          </figure>
          <div className="mt-6 lg:col-start-2 lg:mt-8">
            {boutons(false)}
            <Cartel matiere={cartel} className="mt-8" />
            <dl className="mt-6 grid gap-x-6 gap-y-4 text-[15px] sm:grid-cols-[auto_1fr]" data-fiche={m.id}>
              <dt className="surtitre">Teinte</dt>
              <dd className="m-0 flex items-center gap-3 text-encre">
                <span aria-hidden="true" className="h-6 w-6 shrink-0 rounded-full ring-1 ring-encre/15 ring-inset" style={{ backgroundColor: m.hex }} />
                <span>
                  {teinte}, couleur moyenne {m.hex.toUpperCase()}
                </span>
              </dd>
              <dt className="surtitre">Finition</dt>
              <dd className="m-0 text-encre">
                {libelleFinition(m.finition)}. <span className="text-encre-2">{GLOSES_FINITIONS[m.finition]}</span>
              </dd>
              <dt className="surtitre">Famille</dt>
              <dd className="m-0">
                <Link href={cheminFamille(m.famille)} className="inline-flex min-h-[44px] items-center text-encre underline underline-offset-4 hover:text-encre-2">
                  {nomFamille}, {familleDuTiroir.nombre} références
                </Link>
              </dd>
              <dt className="surtitre">Référence</dt>
              <dd className="m-0 text-encre">
                {m.id}, catalogue Cover Styl&apos;
              </dd>
            </dl>
          </div>
        </div>
      </section>

      {/* ── 2. La note (fiches indexées) ── */}
      {note ? (
        <Section id="note" titre="Ce qu'on en dit">
          <p className="texte text-encre" data-note={m.id}>
            {insecables(note)}
          </p>
          {/* Relecture D, E, F : ce qui est propre à la fiche, tiré de ses données (teinte, finition, ambiance, voisines). */}
          <p className="texte-2 mt-4" data-resume={m.id}>
            {insecables(resumeFiche(m, vues, proches))}
          </p>
        </Section>
      ) : null}

      {/* ── 3. Les repères : où la poser, l'entretien, à savoir, en vrai ── */}
      <Section id="reperes" large ton="papier-2" titre={`${m.nom} chez vous`}>
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          <div className="filet pt-4">
            <h3 className="surtitre">Où la poser</h3>
            <p className="texte-2 mt-2">{insecables(reperes.pose)}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {prestations.map((p) => (
                <li key={p.slug}>
                  <Link href={p.href} className="inline-flex min-h-[44px] items-center rounded-[var(--rayon-sm)] border border-trait bg-blanc px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre">
                    {p.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="filet pt-4">
            <h3 className="surtitre">L&apos;entretien</h3>
            <p className="texte-2 mt-2">{insecables(reperes.entretien)}</p>
          </div>
          <div className="filet pt-4">
            <h3 className="surtitre">À savoir</h3>
            <p className="texte-2 mt-2">{insecables(reperes.aSavoir)}</p>
          </div>
          <div className="filet pt-4">
            <h3 className="surtitre">La voir en vrai</h3>
            <p className="texte-2 mt-2">
              {insecables(`On vient chez vous avec l'échantillon de ${m.nom} et quelques voisines de teinte, on les tient contre vos meubles, à la lumière de la pièce, et vous choisissez sur pièce.`)}
            </p>
          </div>
        </div>
      </Section>

      {/* ── 4. Vue dans : les réalisations qui la portent, puis ses ambiances (aucune : section omise) ── */}
      {chantiers.length + vues.length + photosDePose.length > 0 ? (
        <Section
          id="vue-dans"
          large
          differee
          titre="Vue dans"
          intro={vues.length ? `${vues.length === 1 ? "L'ambiance" : `Les ${vues.length} ambiances`} où on l'a posée. Ce sont des images d'ambiance, pas des chantiers : les matières sont celles du catalogue.` : photosDePose.length && !chantiers.length ? "Nos photos de pose où on la voit. Ce sont des images d'ambiance, pas des chantiers : la matière est celle du catalogue." : undefined}
        >
          {chantiers.length ? (
            <ul className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Nos réalisations avec cette matière">
              {chantiers.map((p) => (
                <li key={p.id}>
                  <CarteRealisation etude={versEtudeReelle(p)} />
                </li>
              ))}
            </ul>
          ) : null}
          {vues.length ? (
            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {vues.map(({ ambiance, ici, avec }) => (
                <li key={ambiance.id} className="filet flex flex-col pt-4">
                  <h3 data-ambiance={ambiance.id} className="font-display text-[22px] leading-tight font-semibold text-encre">
                    {ambiance.titre}
                  </h3>
                  <Photo nom={ambiance.image} alt={ambiance.alt} ratio="4 / 3" tailles={TAILLES_AMBIANCE} etiquette="Ambiance" className="mt-3 rounded-[var(--rayon-md)]" />
                  <p className="mt-3 text-[15px] text-encre">
                    <span className="text-encre-2">Ici : </span>
                    {ici}
                  </p>
                  {avec.length ? (
                    <p className="mt-1 text-[15px] text-encre">
                      <span className="text-encre-2">Avec : </span>
                      {avec.map((a, i) => (
                        <span key={a.ref}>
                          {i > 0 ? ", " : ""}
                          <Link href={lienMatiere(a.ref)} className="underline underline-offset-4 hover:text-encre-2">
                            {a.nom} {a.ref}
                          </Link>
                        </span>
                      ))}
                    </p>
                  ) : null}
                  <LiensAmbiance piece={ambiance.piece} className="mt-1" />
                  <div className="mt-auto flex flex-wrap gap-x-5 pt-2">
                    {/* Un lien de page, pas le routeur : l'ancre montre l'ambiance même dans la suite masquée de /inspirations. */}
                    <a href={lienInspiration(ambiance.id)} className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
                      Voir l&apos;ambiance
                    </a>
                    <Link href={avecDepuis(ambiance.lienComposition, DEPUIS_FICHE)} className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
                      Essayer cette composition chez moi
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {photosDePose.length ? (
            <div className={vues.length + chantiers.length > 0 ? "mt-12" : undefined}>
              {vues.length + chantiers.length > 0 ? <h3 className="surtitre">Sur nos photos de pose</h3> : null}
              <ul className="mt-4 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" aria-label="Nos photos de pose avec cette matière">
                {photosDePose.map(({ ambiance, ici }) => (
                  <li key={ambiance.id} className="filet flex flex-col pt-4">
                    <p data-photo-pose={ambiance.id} className="font-display text-[20px] leading-tight font-semibold text-encre">
                      {ambiance.titre}
                    </p>
                    <Photo nom={ambiance.image} alt={ambiance.alt} ratio="4 / 3" tailles={TAILLES_AMBIANCE} etiquette="Ambiance" className="mt-3 rounded-[var(--rayon-md)]" />
                    <p className="mt-3 text-[15px] text-encre">
                      <span className="text-encre-2">Ici : </span>
                      {ici}
                    </p>
                    <Link href="/comment-ca-marche" className="mt-auto inline-flex min-h-[44px] items-center pt-2 text-[15px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
                      Voir comment on pose
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* ── 5. Ses voisines de teinte ── */}
      <Section id="proches" large differee ton={vues.length + chantiers.length + photosDePose.length > 0 ? "papier-2" : "papier"} titre="Les teintes voisines" intro="Les six références du catalogue dont la couleur est la plus proche, toutes familles confondues. Le nombre dit l'écart de teinte mesuré sur la couleur moyenne de chaque échantillon : plus il est petit, plus elles se ressemblent.">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-8 lg:grid-cols-6">
          {proches.map((p) => {
            const c = matiereCartel(p.id);
            return c ? (
              <li key={p.id}>
                <Echantillon matiere={c} href={lienMatiere(p.id)} />
                <p className="mt-2 text-[13px] text-encre-2">Écart {ecartLisible(p.deltaE)}</p>
              </li>
            ) : null;
          })}
        </ul>
      </Section>

      {/* ── 6. Sa famille, les autres ── */}
      <Section id="plus-loin" large differee>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="surtitre">Sa famille</h2>
            <p className="mt-3">
              <Link href={cheminFamille(m.famille)} className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--rayon-sm)] border border-encre bg-blanc px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] hover:bg-fond-2">
                <PastillesFamille teintes={familleDuTiroir.teintes} />
                <span>{nomFamille}</span>
                <span className="text-[13px] text-encre-2">{familleDuTiroir.nombre}</span>
              </Link>
            </p>
          </div>
          <div>
            <h2 className="surtitre">Les autres familles</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {autres.map((t) => (
                <li key={t.id}>
                  <Link href={cheminFamille(t.id)} className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--rayon-sm)] border border-trait bg-blanc px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre">
                    <PastillesFamille teintes={t.teintes} />
                    <span>{t.libelle}</span>
                    <span className="text-[13px] text-encre-2">{t.nombre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10">
          <Lien href="/matieres" variante="discret">
            Tout le présentoir : {NB_REFERENCES} matières
          </Lien>
        </div>
      </Section>

      {/* ── 7. Dernier appel, en encre ── */}
      <Section id="dernier-appel" large differee ton="encre" titre={`Voir ${m.nom} sur votre photo`} intro="Envoyez une photo de votre pièce : on y pose cette matière. Ou demandez-nous de passer avec l'échantillon.">
        {boutons(true)}
      </Section>
    </div>
  );
}

/** Quatre teintes d'une famille en disques CSS (comme les tiroirs du présentoir). */
function PastillesFamille({ teintes }: { teintes: readonly string[] }) {
  return (
    <span aria-hidden="true" className="flex -space-x-1.5">
      {teintes.map((hex, i) => (
        <span key={i} className="h-4 w-4 rounded-full ring-2 ring-blanc" style={{ backgroundColor: hex }} />
      ))}
    </span>
  );
}
