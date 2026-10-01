import { AvantApres } from "@/components/simulation/AvantApres";
import { Photo } from "@/components/simulation/Photo";
import { sourcesPhoto } from "@/lib/images-preparees";
import type { AmbianceResolue } from "@/lib/ambiances";
import { CalqueMatieres } from "./CalqueMatieres";
import { LegendeMatieres } from "./LegendeMatieres";

/**
 * Une photo d'ambiance en grand (mission 19) avec ses étiquettes matière, sa légende (téléphone), la mention
 * « teintes réelles du catalogue » et « Essayer cette composition chez moi » : /inspirations, la page Pro, les études.
 * `paire` : si l'ambiance a un « avant » calé, le curseur avant / après (les étiquettes côté « après » seulement).
 * L'image porte toujours l'étiquette « Ambiance » : c'est une image générée, jamais un chantier. Composant serveur.
 */
export function PhotoAmbiance({ ambiance, tailles, ratio, paire = false, priorite = false, immediat = false, className, sansListe = false, sansLienComposition = false }: { ambiance: AmbianceResolue; tailles: string; ratio?: string; paire?: boolean; priorite?: boolean; /** Une image du premier écran qui n'est pas la première : chargée tout de suite, sans priorité haute. */ immediat?: boolean; className?: string; sansListe?: boolean; /** La page Pro : pas de lien vers le simulateur. */ sansLienComposition?: boolean }) {
  const avant = paire && ambiance.avant ? sourcesPhoto(ambiance.avant) : null;
  const apres = sourcesPhoto(ambiance.image);
  return (
    <figure className={className}>
      {avant && apres ? (
        <AvantApres
          apres={apres.src}
          avant={avant.src}
          alt={ambiance.alt}
          altAvant="La même pièce avant la pose, avec ses matières d'origine"
          ratio={ratio ?? `${apres.largeur} / ${apres.hauteur}`}
          preparees={{ avant, apres, tailles }}
          priorite={priorite}
          sansOutils
          etiquette="Ambiance · avant / après"
          matieres={ambiance.surfaces}
        />
      ) : (
        <Photo nom={ambiance.image} alt={ambiance.alt} ratio={ratio} tailles={tailles} priorite={priorite} immediat={immediat} etiquette="Ambiance" className="rounded-[var(--rayon-md)]" calque={<CalqueMatieres matieres={ambiance.surfaces} />} />
      )}
      <figcaption>
        <LegendeMatieres matieres={ambiance.surfaces} lienComposition={sansLienComposition ? undefined : ambiance.lienComposition} sansListe={sansListe} />
      </figcaption>
    </figure>
  );
}
