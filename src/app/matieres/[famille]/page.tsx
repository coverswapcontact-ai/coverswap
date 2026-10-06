import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { insecables } from "@/app/blog/[slug]/illustration";
import { CarteAmbiance, resoudreCas } from "@/components/ambiances/CarteAmbiance";
import Breadcrumb from "@/components/Breadcrumb";
import { BandeMatiere } from "@/components/revue/BandeMatiere";
import { Echantillon } from "@/components/revue/Echantillon";
import { Etiquette } from "@/components/simulation/Etiquette";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import revetements from "@/data/revetements.json";
import { texteFamille } from "@/data/textes-familles";
import { cheminFamille } from "@/lib/familles-matieres";
import { prestationsDeFamille } from "@/lib/indexation-matieres";
import { lienSimuler } from "@/lib/liens-simulateur";
import { tiroirs, type Matiere } from "@/lib/matieres";
import { lienMatiere, matiereCartel } from "@/lib/matieres-vedettes";
import { metadonneesPage } from "@/lib/metadonnees";
import { lienVisiteFamille } from "@/lib/visite";
import { NB_REFERENCES } from "@/lib/offre";
import { SLUGS_FAMILLES, ambiancesDeFamille, degradeDeTeintes, estSlugFamille, nomDeFamille, nuancierDeFamille, vedettesDeFamille } from "@/lib/pages-familles";

type Props = { params: Promise<{ famille: string }> };

/**
 * `/matieres/<famille>` (site 3.0, lot D3 ; énoncé, phase D) : une page par famille du catalogue, sept pages statiques
 * (`generateStaticParams`, `dynamicParams = false` : toute autre adresse est un 404, et la page appelle `notFound()`
 * par sûreté). Dans l'ordre :
 *  1. l'ouverture : fil d'Ariane (visible et `BreadcrumbList`), le titre, l'accroche, l'action principale (le
 *     simulateur, `depuis=matiere-famille` : il ne sait pas présélectionner une famille, seulement une référence) et
 *     « Les voir en vrai chez moi » (`/contact?visite=1&famille=<id>`), puis la bande de TOUTES ses teintes, rangées
 *     comme au présentoir (un dégradé CSS, aucune image) ;
 *  2. le texte (`data/textes-familles` : ce que c'est, où ça se pose, l'entretien, les limites ; 300 mots au moins) ;
 *  3. une bande de matière (sa première vedette) ;
 *  4. trois ambiances où on la voit (« Ambiance », `CarteAmbiance`) — section omise si elle n'est dans aucune ;
 *  5. ses vedettes en échantillons ;
 *  6. la liste de toutes ses références, chacune vers sa fiche (`lienMatiere`, `/matieres/<famille>/<REF>` depuis
 *     le lot D4) ; repliée au-delà de 41 (bois, couleurs) ;
 *  7. où elle se pose (les pages de prestation) et les autres familles ;
 *  8. le dernier appel, en encre.
 * Aucune donnée du CRM : la page est entièrement statique.
 */
export const dynamicParams = false;

const CATALOGUE = revetements as Matiere[];
/** La valeur `depuis` des liens vers le simulateur de ces pages (`docs/SUIVI.md`). */
export const DEPUIS_FAMILLE = "matiere-famille";
/** Au-delà, la liste des références est repliée (un `<details>` : elle reste dans la page). */
export const LISTE_DEPLIEE_JUSQUA = 41;
const TAILLES_CAS = "(min-width: 1024px) 360px, (min-width: 768px) calc(50vw - 36px), calc(100vw - 32px)";

/** « Les voir en vrai chez moi » d'une famille : la demande de visite avec échantillons (`lib/visite`, message prérempli depuis D4). */
export { lienVisiteFamille };

export function generateStaticParams() {
  return SLUGS_FAMILLES.map((famille) => ({ famille }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { famille } = await params;
  const texte = texteFamille(famille);
  if (!texte || !estSlugFamille(famille)) return {};
  return metadonneesPage({ titre: texte.titreSeo, description: texte.descriptionSeo, chemin: cheminFamille(famille) });
}

export default async function PageFamille({ params }: Props) {
  const { famille } = await params;
  const texte = texteFamille(famille);
  if (!texte || !estSlugFamille(famille)) notFound();

  const nom = nomDeFamille(famille);
  const nuancier = nuancierDeFamille(famille, CATALOGUE);
  const nombre = nuancier.length;
  const cas = ambiancesDeFamille(famille).flatMap((a) => {
    const c = resoudreCas(a.image, { depuis: DEPUIS_FAMILLE });
    return c ? [c] : [];
  });
  const { matieres: vedettes, completees } = vedettesDeFamille(famille, CATALOGUE);
  const bande = vedettes[0] ? matiereCartel(vedettes[0].id) : null;
  const prestations = prestationsDeFamille(famille);
  const autres = tiroirs(CATALOGUE).filter((t) => t.id !== "tout" && t.id !== famille);
  const lienSimulation = lienSimuler({ depuis: DEPUIS_FAMILLE });
  const lienVisite = lienVisiteFamille(famille);
  const premiere = nuancier[0];
  const derniere = nuancier[nombre - 1];

  const boutons = (surEncre: boolean) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Lien href={lienSimulation}>{texte.essayer}</Lien>
      <Lien href={lienVisite} variante={surEncre ? "sur-encre" : "secondaire"}>
        Les voir en vrai chez moi
      </Lien>
    </div>
  );

  return (
    <div>
      {/* ── 1. Ouverture : le titre, l'action, la bande de toutes ses teintes ── */}
      <section aria-labelledby="titre-famille" className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Matières", href: "/matieres" }, { label: nom, href: cheminFamille(famille) }]} />
          <p className="surtitre">
            Matières · {nombre} références
          </p>
          <h1 id="titre-famille" className="titre-1 mt-2 text-encre">
            {texte.titre}
          </h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">{insecables(texte.accroche)}</p>
          <div className="mt-6">{boutons(false)}</div>
          <figure className="m-0 mt-10">
            <div role="img" aria-label={`Les ${nombre} teintes, rangées comme un nuancier, de ${premiere.nom} à ${derniere.nom}`} className="h-16 w-full rounded-[var(--rayon-sm)] ring-1 ring-encre/10 ring-inset md:h-24" style={{ background: degradeDeTeintes(nuancier.map((m) => m.hex)) }} data-bande-teintes={nombre} />
            <figcaption className="mt-2 text-[14px] text-encre-2">Les {nombre} teintes, rangées comme au présentoir : les couleurs du clair au foncé, puis les neutres du blanc au noir.</figcaption>
          </figure>
        </div>
      </section>

      {/* ── 2. Le texte : ce que c'est, où ça se pose, l'entretien, les limites ── */}
      <Section>
        <article id="texte-famille" className="flex flex-col gap-10">
          {texte.sections.map((s, i) => (
            <section key={s.titre} aria-labelledby={`texte-famille-${i + 1}`}>
              <h2 id={`texte-famille-${i + 1}`} className="titre-2 mb-4 text-encre">
                {insecables(s.titre)}
              </h2>
              {s.paragraphes.map((p) => (
                <p key={p.slice(0, 40)} className="texte mt-4 text-encre first-of-type:mt-0">
                  {insecables(p)}
                </p>
              ))}
            </section>
          ))}
        </article>
      </Section>
      {bande ? <BandeMatiere matiere={bande} /> : null}

      {/* ── 3. Trois ambiances où on la voit (aucune : section omise) ── */}
      {cas.length > 0 ? (
        <Section id="ambiances" large differee ton="papier-2" titre="Où on les voit" intro={cas.some((c) => c.preparees.avant) ? "Glissez le curseur : à gauche la pièce d'origine, à droite la même avec les vraies matières du catalogue." : undefined}>
          <p className="flex flex-wrap items-center gap-3">
            <Etiquette>Ambiance</Etiquette>
            <span className="text-[15px] text-encre-2">Images d&apos;ambiance, pas des chantiers : les matières sont celles du catalogue.</span>
          </p>
          <ul className="mt-8 flex flex-col gap-12 md:grid md:grid-cols-2 md:gap-x-6 lg:grid-cols-3">
            {cas.map((c) => (
              <li key={c.ambiance.id} className="filet flex flex-col pt-4">
                <CarteAmbiance cas={c} tailles={TAILLES_CAS} cartelsColonnes="grid-cols-2 md:grid-cols-1" liensMatieres />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* ── 4. Ses vedettes ── */}
      <Section
        id="vedettes"
        large
        differee
        titre={completees === vedettes.length ? "Pour commencer" : "Nos vedettes"}
        intro={
          completees === 0
            ? "Celles qu'on montre le plus : posées dans nos ambiances ou mises en avant sur nos pages."
            : completees === vedettes.length
              ? `${vedettes.length} teintes prises dans tout le nuancier, pour commencer.`
              : "Celles qu'on montre le plus, puis quelques teintes prises dans le nuancier."
        }
      >
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 md:gap-x-8">
          {vedettes.map((m) => {
            const cartel = matiereCartel(m.id);
            return cartel ? (
              <li key={m.id}>
                <Echantillon matiere={cartel} href={lienMatiere(m.id)} />
              </li>
            ) : null;
          })}
        </ul>
      </Section>

      {/* ── 5. Toutes ses références ── */}
      <Section id="references" large differee ton="papier-2" titre={`Les ${nombre} références`} intro="Rangées par teinte. Chacune a sa fiche : la matière en grand, où on la voit, ses voisines, « Essayer chez moi ».">
        <ListeReferences matieres={nuancier} repliee={nombre > LISTE_DEPLIEE_JUSQUA} />
      </Section>

      {/* ── 6. Où ça se pose, les autres familles ── */}
      <Section id="plus-loin" large differee>
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="surtitre">Où on les pose</h2>
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
          <div>
            <h2 className="surtitre">Les autres familles</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {autres.map((t) => (
                <li key={t.id}>
                  <Link href={cheminFamille(t.id)} className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--rayon-sm)] border border-trait bg-blanc px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre">
                    <span aria-hidden="true" className="flex -space-x-1.5">
                      {t.teintes.map((hex, i) => (
                        <span key={i} className="h-4 w-4 rounded-full ring-2 ring-blanc" style={{ backgroundColor: hex }} />
                      ))}
                    </span>
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
      <Section id="dernier-appel" large differee ton="encre" titre={`Voir ${texte.dansUnePhrase} sur votre photo`} intro="Envoyez une photo, choisissez une matière, jugez sur pièce. Ou demandez-nous de passer avec les échantillons.">
        {boutons(true)}
      </Section>
    </div>
  );
}

/** La liste des références : une pastille de sa couleur, son nom, sa référence ; chacune mène à sa matière. */
function ListeReferences({ matieres, repliee }: { matieres: readonly Matiere[]; repliee: boolean }) {
  const liste = (
    <ul className="grid grid-cols-1 gap-x-6 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" data-references={matieres.length}>
      {matieres.map((m) => (
        <li key={m.id}>
          <Link href={lienMatiere(m.id)} className="flex min-h-[44px] items-center gap-3 border-b border-trait py-1 text-[15px] text-encre hover:text-encre-2">
            <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-full ring-1 ring-encre/15 ring-inset" style={{ backgroundColor: m.hex }} />
            <span className="min-w-0">
              <span className="block truncate">{m.nom}</span>
              <span className="cartel block text-encre-2">{m.id}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
  if (!repliee) return liste;
  return (
    <details className="group">
      <summary className="inline-flex min-h-[48px] cursor-pointer list-none items-center gap-2 rounded-[var(--rayon-sm)] border border-encre px-5 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] hover:bg-encre hover:text-blanc [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">Voir les {matieres.length} références</span>
        <span className="hidden group-open:inline">Replier la liste</span>
      </summary>
      <div className="mt-6">{liste}</div>
    </details>
  );
}
