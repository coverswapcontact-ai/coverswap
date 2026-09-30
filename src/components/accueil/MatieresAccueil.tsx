import Link from "next/link";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { TuileFilm } from "@/components/simulation/TuileFilm";
import { lienMatiere, matieresVedettes } from "@/lib/matieres-vedettes";
import { NB_REFERENCES } from "@/lib/offre";
import { urlVignette } from "@/lib/simulateur/generation-client";

/**
 * 4. Matières (mission 16, partie 3) : huit tuiles (`TuileFilm` en grand, la
 * vignette de 320 px servie par le CRM, carré réservé), une par famille
 * d'usage (`lib/matieres-vedettes`) ; chaque tuile mène à la page Matières
 * ouverte sur sa référence. Un bouton secondaire vers tout le catalogue.
 */
export function MatieresAccueil() {
  const vedettes = matieresVedettes();
  return (
    <Section id="matieres" large fond="fond-2" surtitre="Matières" titre="Choisissez votre finition" intro={`${NB_REFERENCES} films Cover Styl' : bois, pierre, béton, métal, couleurs unies.`}>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 md:gap-x-6">
        {vedettes.map((v) => (
          <li key={v.ref}>
            <Link href={lienMatiere(v.ref)} className="block rounded-[var(--rayon-md)] transition-opacity duration-[var(--duree-courte)] hover:opacity-85">
              <TuileFilm reference={v.ref} nom={v.nom} libelle={v.libelle} vignette={urlVignette(v.ref)} taille="grand" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 md:mt-10">
        <Lien href="/matieres" variante="secondaire">
          Voir les {NB_REFERENCES} matières
        </Lien>
      </div>
    </Section>
  );
}
