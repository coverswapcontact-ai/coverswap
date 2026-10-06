import { DonneesStructurees } from "@/components/ScriptJsonLd";
import { Cartel } from "@/components/revue/Cartel";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { PAIRES_SERIE_2 } from "@/data/ambiances";
import { ambianceDeLImage } from "@/lib/ambiances";
import { sourcesPhoto, type ManifesteImages } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { imageObjet, legendeAmbiance } from "@/lib/donnees-images";
import { matiereCartel } from "@/lib/matieres-vedettes";
import { styleTeinte, teintePrestation } from "@/lib/teintes-prestations";

/**
 * 7. Professionnels (site 3.0, lot B6 ; énoncé, § C.1) : l'avant / après du comptoir d'accueil d'un cabinet
 * (`pro-comptoir-accueil`, l'après « bois » : Classic Walnut D1, la seconde teinte du pro), étiqueté « Ambiance · avant
 * / après », les cartels des matières posées, puis l'offre pro en secondaire (`/pro`). Bloc encre, filets à la teinte
 * du professionnel (Black Mat K1, Classic Walnut D1). Composant serveur (seul le curseur est client).
 */
export const APRES_PRO = "pro-comptoir-accueil-apres-bois";
const TAILLES_PRO = "(min-width: 768px) 55vw, calc(100vw - 32px)";

export function proAccueil(manifeste: ManifesteImages = MANIFESTE_IMAGES) {
  const ambiance = ambianceDeLImage(APRES_PRO);
  const paire = PAIRES_SERIE_2.find((p) => p.avant === ambiance?.avant);
  const avant = paire ? sourcesPhoto(paire.avant, manifeste) : null;
  const apres = sourcesPhoto(APRES_PRO, manifeste);
  if (!ambiance || !paire || !avant || !apres) return null;
  const matieres = [...new Map(ambiance.surfaces.map((s) => [s.ref, matiereCartel(s.ref)])).values()].filter((m) => m !== null);
  return { ambiance, altAvant: `${paire.scene}. Image d'ambiance.`, ratio: paire.ratio, preparees: { avant, apres }, matieres };
}

export function ProAccueil() {
  const pro = proAccueil();
  const teinte = teintePrestation("professionnel");
  return (
    <Section id="pro" large differee ton="encre" surtitre="Professionnels" titre="Un comptoir, un bar, une boutique, rénovés sans fermer" intro="Comptoirs, mobilier, portes et murs, recouverts de nuit ou hors service. Sur devis, après une visite ou sur vos photos.">
      <div className="grid gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] md:items-end md:gap-12" style={styleTeinte(teinte)}>
        {pro ? <DonneesStructurees data={imageObjet({ src: pro.preparees.apres.src, sources: pro.preparees.apres, legende: legendeAmbiance(pro.ambiance.titre, pro.ambiance.surfaces), description: `Ambiance · avant / après. ${pro.ambiance.alt}`, ambiance: true })} /> : null}
        {pro ? (
          <AvantApres
            avant={pro.preparees.avant.src}
            apres={pro.preparees.apres.src}
            alt={pro.ambiance.alt}
            altAvant={pro.altAvant}
            ratio={pro.ratio}
            preparees={{ ...pro.preparees, tailles: TAILLES_PRO }}
            sansOutils
            etiquette="Ambiance · avant / après"
          />
        ) : null}
        <div>
          {pro ? (
            <ul className="space-y-4" aria-label="Matières posées sur le comptoir">
              {pro.matieres.map((m) => (
                <li key={m.id}>
                  <Cartel matiere={m} variante="encre" />
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8">
            <Lien href="/pro" variante="sur-encre">
              Voir l&apos;offre pro
            </Lien>
          </div>
        </div>
      </div>
    </Section>
  );
}
