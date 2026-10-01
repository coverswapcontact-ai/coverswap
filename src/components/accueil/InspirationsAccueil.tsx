import Link from "next/link";
import { PastillesMatieres } from "@/components/ambiances/PastillesMatieres";
import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { Section } from "@/components/simulation/Section";
import { inspirations, lienInspiration } from "@/lib/ambiances";

/**
 * La rangée « Inspirations » de l'accueil (mission 19) : quatre ambiances que l'accueil ne montre pas déjà (ni
 * l'ouverture, ni les études), en petites cartes — la photo carrée, les pastilles de ses vraies matières, le titre —
 * chacune vers sa place sur /inspirations ; puis « Voir toutes les inspirations ». Sur téléphone, la rangée défile de
 * côté. Composant serveur.
 */
export const DEJA_SUR_L_ACCUEIL = ["cuisine-sauge-bois-clair", "salle-de-bain-taupe-marbre", "meuble-tv-terre-cuite"];
export const INSPIRATIONS_ACCUEIL = 4;

const TAILLES = "(min-width: 768px) 270px, 70vw";

export function InspirationsAccueil() {
  const cartes = inspirations()
    .filter((a) => !DEJA_SUR_L_ACCUEIL.includes(a.id))
    .slice(0, INSPIRATIONS_ACCUEIL);
  return (
    <Section id="inspirations" large differee titre="Inspirations" intro="Des ambiances composées avec les vraies matières du catalogue, références à l'appui.">
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {cartes.map((a) => (
          <li key={a.id} className="w-[70vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none">
            <Link href={lienInspiration(a.id)} className="group block">
              <span className="relative block overflow-hidden rounded-[var(--rayon-md)]">
                <Photo nom={a.image} alt="" ratio="1 / 1" tailles={TAILLES} etiquette="Ambiance" enLigne />
                <PastillesMatieres image={a.image} />
              </span>
              <span className="mt-3 block text-[16px] leading-snug font-semibold text-encre group-hover:underline">{a.titre}</span>
              <span className="mt-0.5 block text-[13.5px] text-encre-2">{a.surfaces.map((s) => s.nom).join(" · ")}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Lien href="/inspirations" variante="secondaire">
          Voir toutes les inspirations
        </Lien>
      </div>
    </Section>
  );
}
