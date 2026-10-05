import Link from "next/link";
import { ContenuPrix } from "@/components/BlocPrix";
import { Section } from "@/components/simulation/Section";
import { ORDRE_AVIS, blocAvis, chargerAvisGoogle, formaterMoisAvis, formaterNote, type AvisGoogle, type BlocAvis } from "@/lib/avis-google";
import { ENTREPRISE } from "@/lib/entreprise";
import { LIEN_ZONES } from "@/lib/navigation";
import { GARANTIE_ANS } from "@/lib/offre";
import { chargerTarifs, type TarifsSite } from "@/lib/tarifs-site";

/**
 * La confiance (mission 16, partie 3 ; site 3.0, lot B6 : la section « Avis et prix »). Le bloc « Note Google » (note sur 5,
 * nombre d'avis EXACTS, trois extraits au plus, mois) n'est rendu QUE si le
 * CRM a lu une note et un nombre chez Google (`blocAvis`) ; sinon il n'existe
 * pas — aucun chiffre écrit à la main.
 * Attribution exigée par les règles de la Places API : chaque extrait crédite
 * son auteur (avatar, nom tel que Google le donne, en lien vers son profil) et
 * mène à l'avis sur Google Maps ; sous les extraits, l'ordre des avis et la
 * mention « Google Maps » (bloc sans carte : Roboto ou la sans-serif du
 * système, 400, 14 px, le gris imposé, sur une ligne — jetons `font-google`,
 * `text-google`). Liens externes : nouvel onglet, `noopener noreferrer`.
 * Dessous, toujours : la zone (lien vers les zones d'intervention) et la
 * garantie d'`offre.ts`. Deux lignes, pas de logo.
 */
export const LIGNE_ZONE = `${ENTREPRISE.adresse.ville}, Montpellier et l'${ENTREPRISE.zone.departement}`;
export const LIGNE_GARANTIE = `${GARANTIE_ANS} ans sur la pose et le film`;

const LIEN_EXTERNE = { target: "_blank", rel: "noopener noreferrer" } as const;

function ExtraitAvis({ a }: { a: AvisGoogle }) {
  const details = [a.note !== null ? `${a.note} sur 5` : null, a.date ? formaterMoisAvis(a.date) : null].filter(Boolean).join(" · ");
  return (
    <figure className="flex h-full flex-col rounded-[var(--rayon-md)] border border-trait bg-white p-6">
      <blockquote className="texte text-encre">« {a.texte} »</blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-4 text-[13.5px] text-encre-2">
        {a.photoAuteur ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar servi par Google (attribution exigée), pas d'optimiseur
          <img src={a.photoAuteur} alt="" width={32} height={32} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full bg-fond-2 object-cover" />
        ) : null}
        <span>
          {a.lienAuteur ? (
            <a href={a.lienAuteur} {...LIEN_EXTERNE} className="font-medium text-encre underline underline-offset-4">
              {a.auteur}
            </a>
          ) : (
            <span className="font-medium text-encre">{a.auteur}</span>
          )}
          {details ? ` · ${details}` : null}
          {a.lienAvis ? (
            <>
              {" · "}
              <a href={a.lienAvis} {...LIEN_EXTERNE} aria-label={`Voir l'avis de ${a.auteur} sur Google Maps`} className="underline underline-offset-4">
                Voir l&apos;avis
              </a>
            </>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * 8. Avis et prix (site 3.0, lot B6 ; énoncé, § C.1) : la note Google (`blocAvis`, inchangé : seulement si le CRM a lu
 * une note ET un nombre), puis les prix (`ContenuPrix`, les tarifs du CRM tels quels), puis la zone et la garantie.
 */
export function ContenuAvisPrix({ avis, tarifs }: { avis: BlocAvis | null; tarifs: TarifsSite | null }) {
  return (
    <Section id="avis-prix" large differee>
      {avis ? (
        <div className="mb-14 md:mb-16">
          <p className="surtitre">Note Google</p>
          <h2 className="titre-2 mt-2 text-encre">{`${formaterNote(avis.note)} sur 5`}</h2>
          <p className="texte-2 mt-3">{`D'après ${avis.nombre.toLocaleString("fr-FR")} avis Google.`}</p>
          {avis.avis.length > 0 ? (
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {avis.avis.map((a, i) => (
                <li key={`${a.auteur}-${i}`}>
                  <ExtraitAvis a={a} />
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            {avis.avis.length > 0 ? <span className="text-[13.5px] text-encre-2">{ORDRE_AVIS}</span> : null}
            <span className="font-google text-[14px] font-normal whitespace-nowrap text-google">Google Maps</span>
          </p>
        </div>
      ) : null}
      <h2 className="titre-2 text-encre">Nos prix</h2>
      <ContenuPrix tarifs={tarifs} className="mt-3" />
      <dl className="mt-12 grid gap-4 md:grid-cols-2 md:gap-10">
        <div className="border-t border-encre pt-4">
          <dt className="text-[13.5px] text-encre-2">Zone d&apos;intervention</dt>
          <dd className="mt-1">
            <Link href={LIEN_ZONES.href} className="inline-flex min-h-[44px] items-center text-[17px] font-medium text-encre underline underline-offset-4">
              {LIGNE_ZONE}
            </Link>
          </dd>
        </div>
        <div className="border-t border-encre pt-4">
          <dt className="text-[13.5px] text-encre-2">Garantie</dt>
          <dd className="mt-1 flex min-h-[44px] items-center text-[17px] font-medium text-encre">{LIGNE_GARANTIE}</dd>
        </div>
      </dl>
    </Section>
  );
}

export async function AvisPrix() {
  const [avis, tarifs] = await Promise.all([chargerAvisGoogle(), chargerTarifs()]);
  return <ContenuAvisPrix avis={blocAvis(avis)} tarifs={tarifs} />;
}
