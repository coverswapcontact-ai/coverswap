import Link from "next/link";
import { ENTREPRISE } from "@/lib/entreprise";
import { chargerPublications, libelleProjet, type Publication } from "@/lib/publications";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Section } from "@/components/simulation/Section";

/**
 * Réalisations (photos après chantier, éventuellement avant) et avis clients
 * publiés depuis le CRM. Sur l'accueil (`apercu`), la section n'existe que s'il
 * y a quelque chose à montrer : pas de vitrine vide, pas de photo d'illustration
 * présentée comme un chantier. Mission 16 : cartes claires, le curseur
 * avant / après du simulateur quand il y a les deux photos, la note en texte.
 */
function CarteRealisation({ p }: { p: Publication }) {
  const legende = [libelleProjet(p.typeProjet), p.ville].filter(Boolean).join(" · ");
  return (
    <article className="overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-white">
      {p.photoApres ? (
        <AvantApres apres={p.photoApres} avant={p.photoAvant} alt={`Après — ${p.titre}`} altAvant={`Avant — ${p.titre}`} ratio="4 / 3" sansOutils />
      ) : null}
      <div className="p-5">
        <h3 className="text-[17px] font-semibold text-encre">{p.titre}</h3>
        {legende ? <p className="mt-0.5 text-[13.5px] text-encre-2">{legende}</p> : null}
        {p.texte ? <p className="texte-2 mt-2">{p.texte}</p> : null}
      </div>
    </article>
  );
}

function CarteAvis({ p }: { p: Publication }) {
  return (
    <blockquote className="rounded-[var(--rayon-md)] border border-trait bg-white p-6">
      {p.note ? <p className="surtitre">Note : {p.note} sur 5</p> : null}
      <p className="texte mt-2 text-encre">« {p.texte} »</p>
      <footer className="mt-3 text-[13.5px] text-encre-2">{[p.auteur, p.ville, libelleProjet(p.typeProjet)].filter(Boolean).join(" · ")}</footer>
    </blockquote>
  );
}

export default async function Realisations({ apercu = false }: { apercu?: boolean }) {
  const { realisations, avis } = await chargerPublications();
  if (apercu && realisations.length === 0 && avis.length === 0) return null;
  const listeRealisations = apercu ? realisations.slice(0, 3) : realisations;
  const listeAvis = apercu ? avis.slice(0, 3) : avis;

  return (
    <>
      {listeRealisations.length > 0 ? (
        <Section large titre={apercu ? "Nos dernières réalisations" : "Réalisations"}>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {listeRealisations.map((p) => (
              <CarteRealisation key={p.id} p={p} />
            ))}
          </div>
          {apercu ? (
            <p className="mt-6">
              <Link href="/realisations" className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-encre underline underline-offset-4">
                Toutes les réalisations
              </Link>
            </p>
          ) : null}
        </Section>
      ) : !apercu ? (
        <Section titre="Les premières réalisations arrivent">
          <p className="texte-2">
            Chaque chantier terminé est photographié ; les photos paraissent ici avec l&apos;accord des clients. En attendant, nos poses sont visibles sur{" "}
            <a href={ENTREPRISE.reseaux.instagram} target="_blank" rel="noopener noreferrer" className="text-encre underline underline-offset-4">
              Instagram
            </a>
            .
          </p>
        </Section>
      ) : null}
      {listeAvis.length > 0 ? (
        <Section large titre={apercu ? "Ils l'ont fait" : "Avis clients"} fond="fond-2">
          <div className="grid gap-5 md:grid-cols-3">
            {listeAvis.map((p) => (
              <CarteAvis key={p.id} p={p} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
