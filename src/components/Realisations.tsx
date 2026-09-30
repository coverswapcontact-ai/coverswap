import { CarteRealisation } from "@/components/CarteRealisation";
import { Section } from "@/components/simulation/Section";
import { ENTREPRISE } from "@/lib/entreprise";
import { versEtudeReelle } from "@/lib/etude-de-cas";
import { chargerPublications, libelleProjet, type Publication } from "@/lib/publications";

/**
 * Réalisations (photos après chantier, éventuellement avant) et avis clients
 * publiés depuis le CRM, pour `/realisations`. Pas de photo d'illustration
 * présentée comme un chantier. Mission 16 : cartes claires ; la carte d'une
 * réalisation est celle de l'accueil (`CarteRealisation`, partie 3 : curseur
 * avant / après, matières, prix et durée) ; la note d'un avis en texte.
 * (L'ancien aperçu de l'accueil est parti avec la partie 3 : l'accueil a sa
 * section « Réalisations », `components/accueil/RealisationsAccueil`.)
 */
function CarteAvis({ p }: { p: Publication }) {
  return (
    <blockquote className="rounded-[var(--rayon-md)] border border-trait bg-white p-6">
      {p.note ? <p className="surtitre">Note : {p.note} sur 5</p> : null}
      <p className="texte mt-2 text-encre">« {p.texte} »</p>
      <footer className="mt-3 text-[13.5px] text-encre-2">{[p.auteur, p.ville, libelleProjet(p.typeProjet)].filter(Boolean).join(" · ")}</footer>
    </blockquote>
  );
}

export default async function Realisations() {
  const { realisations, avis } = await chargerPublications();

  return (
    <>
      {realisations.length > 0 ? (
        <Section large titre="Réalisations">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {realisations.map((p) => (
              <CarteRealisation key={p.id} etude={versEtudeReelle(p)} avecTexte />
            ))}
          </div>
        </Section>
      ) : (
        <Section titre="Les premières réalisations arrivent">
          <p className="texte-2">
            Chaque chantier terminé est photographié ; les photos paraissent ici avec l&apos;accord des clients. En attendant, nos poses sont visibles sur{" "}
            <a href={ENTREPRISE.reseaux.instagram} target="_blank" rel="noopener noreferrer" className="text-encre underline underline-offset-4">
              Instagram
            </a>
            .
          </p>
        </Section>
      )}
      {avis.length > 0 ? (
        <Section large titre="Avis clients" fond="fond-2">
          <div className="grid gap-5 md:grid-cols-3">
            {avis.map((p) => (
              <CarteAvis key={p.id} p={p} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
