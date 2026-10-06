import Link from "next/link";
import { Section } from "@/components/simulation/Section";
import { ZONES, getZoneSlug } from "@/data/zones";
import { ENTREPRISE } from "@/lib/entreprise";

/** Les villes de la zone, de la plus proche à la plus lointaine. */
export const VILLES_PAR_DISTANCE = [...ZONES].sort((a, b) => a.distanceKm - b.distanceKm);

/**
 * « Où nous intervenons » : une page par ville (site 3.0, lot C1 ; sorti de `ContenuPrestation` au lot F5 pour que
 * `/pro` mène aussi à ses villes). Composant serveur.
 */
export function VillesIntervention() {
  return (
    <Section id="villes" large differee titre="Où nous intervenons" intro={`On pose à ${ENTREPRISE.zone.principale}, et partout en France métropolitaine sur devis. Une page par ville :`}>
      <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
        {VILLES_PAR_DISTANCE.map((z) => (
          <li key={z.slug} className="filet">
            <Link href={`/zones/${getZoneSlug(z)}`} className="flex min-h-[48px] items-center text-[16px] text-encre underline-offset-4 hover:underline">
              {z.ville}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
