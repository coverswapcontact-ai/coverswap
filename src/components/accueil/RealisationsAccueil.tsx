import { CarteRealisation } from "@/components/CarteRealisation";
import { PastillesMatieres } from "@/components/ambiances/PastillesMatieres";
import { Etiquette } from "@/components/simulation/Etiquette";
import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { Section } from "@/components/simulation/Section";
import { ambiances, lienInspiration, type AmbianceResolue } from "@/lib/ambiances";
import { versEtudeReelle, type EtudeReelle } from "@/lib/etude-de-cas";
import type { Publication } from "@/lib/publications";

/**
 * 6. Réalisations (site 3.0, lot B6 ; énoncé, § C.1) : les VRAIES d'abord — les réalisations publiées par le CRM, avec
 * leur photo après (trois au plus, `CarteRealisation`, la carte de `/realisations`) et un lien vers toutes —, puis une
 * rangée « Ambiances » clairement étiquetée : quatre images générées des séries 1 et 2 (un dressing, un salon, un
 * buffet, une cuisine familiale), chacune vers sa place sur `/inspirations`. Sans réalisation publiée, la section le dit
 * et ne montre que la rangée « Ambiances ». Composant serveur.
 */
const TAILLES_CARTE = "(min-width: 768px) 360px, 100vw";
const TAILLES_AMBIANCE = "(min-width: 768px) 270px, 70vw";

export const REALISATIONS_ACCUEIL_MAX = 3;
/** La rangée « Ambiances » : séries 1 (dressing, salon) et 2 (buffet, cuisine familiale). */
export const AMBIANCES_ACCUEIL = ["dressing-vert-tendre", "salon-marbre", "buffet-salle-a-manger-apres-couleur", "amb-cuisine-familiale"] as const;

/**
 * Les réalisations publiées montrées sur l'accueil : celles qui ont une photo après, dans l'ordre du CRM, sans celle de
 * l'ouverture (`idOuverture` : déjà montrée en grand, comme sur les pages de prestation et `/pro`).
 */
export function realisationsAccueil(realisations: readonly Publication[], idOuverture?: string | null): EtudeReelle[] {
  return realisations
    .filter((p): p is Publication & { photoApres: string } => p.type === "REALISATION" && !!p.photoApres && p.id !== idOuverture)
    .slice(0, REALISATIONS_ACCUEIL_MAX)
    .map((p) => versEtudeReelle(p));
}

export function ambiancesAccueil(liste: readonly AmbianceResolue[] = ambiances()): AmbianceResolue[] {
  return AMBIANCES_ACCUEIL.flatMap((id) => liste.filter((a) => a.id === id));
}

/**
 * `ouvertureReelle` : l'ouverture de l'accueil montre déjà une réalisation (retirée de `reelles`) ; sans autre carte, la
 * section ne dit pas « en préparation » et garde « Voir les réalisations ».
 */
export function RealisationsAccueil({ reelles, ouvertureReelle = false, ambiancesRangee = ambiancesAccueil() }: { reelles: EtudeReelle[]; ouvertureReelle?: boolean; ambiancesRangee?: AmbianceResolue[] }) {
  const aDesReelles = reelles.length > 0;
  const publiees = aDesReelles || ouvertureReelle;
  return (
    <Section
      id="realisations"
      large
      differee
      titre={publiees ? "Nos réalisations" : "Nos réalisations arrivent"}
      intro={aDesReelles ? "Des chantiers posés chez nos clients, avec les matières et le prix." : publiees ? "Notre premier chantier publié ouvre cette page. Ci-dessous, des ambiances composées avec les vraies matières du catalogue." : "Les photos de nos premiers chantiers sont en préparation. En attendant, des ambiances composées avec les vraies matières du catalogue."}
    >
      {publiees ? (
        <>
          {aDesReelles ? (
            <div className="grid gap-5 md:grid-cols-3">
              {reelles.map((e) => (
                <CarteRealisation key={e.id} etude={e} tailles={TAILLES_CARTE} />
              ))}
            </div>
          ) : null}
          <div className={aDesReelles ? "mt-8" : undefined}>
            <Lien href="/realisations" variante="secondaire">
              Voir les réalisations
            </Lien>
          </div>
        </>
      ) : null}
      <div className={publiees ? "mt-14" : undefined}>
        <h3 className="flex items-center gap-3">
          <Etiquette>Ambiance</Etiquette>
          <span className="text-[15px] text-encre-2">Images d&apos;ambiance, pas des chantiers : les teintes sont celles du catalogue.</span>
        </h3>
        <ul className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {ambiancesRangee.map((a) => (
            <li key={a.id} className="w-[70vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none">
              {/* Un lien de page, pas `Link` : l'ancre (`:target`) montre l'ambiance même si elle est dans la suite de /inspirations (lot C4). */}
              <a href={lienInspiration(a.id)} className="group block">
                <span className="relative block overflow-hidden rounded-[var(--rayon-md)]">
                  <Photo nom={a.image} alt="" ratio="1 / 1" tailles={TAILLES_AMBIANCE} etiquette="Ambiance" enLigne />
                  <PastillesMatieres image={a.image} />
                </span>
                <span className="mt-3 block text-[16px] leading-snug font-semibold text-encre group-hover:underline">{a.titre}</span>
                <span className="mt-0.5 block text-[13.5px] text-encre-2">{a.surfaces.map((s) => `${s.nom} ${s.ref}`).join(" · ")}</span>
              </a>
            </li>
          ))}
        </ul>
        {publiees ? null : (
          <div className="mt-8">
            <Lien href="/inspirations" variante="secondaire">
              Voir toutes les ambiances
            </Lien>
          </div>
        )}
      </div>
    </Section>
  );
}
