import { texteCartel, type MatiereCartel } from "@/lib/cartel";
import { urlEchantillon, urlVignette } from "@/lib/simulateur/generation-client";
import { Cartel } from "./Cartel";

/**
 * La bande de matière (site 3.0, lot B3 ; énoncé, phase B, « La couleur ») : elle sépare les grandes sections avec
 * une vraie matière du catalogue — chêne, marbre, vert profond, terracotta, bleu nuit — ÉTIRÉE en fond sur toute la
 * largeur, avec son cartel posé dessus. C'est la matière qui colore la page, pas l'interface.
 *
 *  - L'image est l'échantillon du CRM (`/api/site/echantillons/<REF>`) : la vignette de 320 px ou l'échantillon
 *    entier (595 px de large), au choix du navigateur selon la largeur (`srcSet`), en `object-cover`.
 *  - Hauteur RÉSERVÉE (aucun décalage au chargement) : 96 px sur téléphone, 128 px à partir de 768 px (`fine`) ;
 *    160 / 240 px (`haute`). La couleur de la matière (`hex` du catalogue) remplit la bande tant que l'image charge.
 *  - Chargement différé (`loading="lazy"`) : une bande n'est jamais en haut de page.
 *  - Une seule image pour les lecteurs d'écran (`role="img"`), nommée par le cartel ; le cartel visible est muet.
 *
 * Composant serveur. Jamais de grain dessus (c'est une matière, pas du papier).
 */
export const LARGEUR_ECHANTILLON_ENTIER = 595;

const HAUTEURS = { fine: "h-24 md:h-32", haute: "h-40 md:h-60" } as const;

export function BandeMatiere({ matiere, hauteur = "fine", teinte, className }: { matiere: MatiereCartel; hauteur?: keyof typeof HAUTEURS; /** La teinte du filet du cartel ; par défaut, la couleur de la matière. */ teinte?: string; className?: string }) {
  return (
    <div role="img" aria-label={`Matière ${texteCartel(matiere)}`} className={`relative w-full overflow-hidden bg-fond-2 ${HAUTEURS[hauteur]}${className ? ` ${className}` : ""}`} style={matiere.hex ? { backgroundColor: matiere.hex } : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- échantillon servi et mis en cache par le CRM */}
      <img
        src={urlEchantillon(matiere.id)}
        srcSet={`${urlVignette(matiere.id)} 320w, ${urlEchantillon(matiere.id)} ${LARGEUR_ECHANTILLON_ENTIER}w`}
        sizes="100vw"
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden="true" className="absolute bottom-3 left-4 md:bottom-4 md:left-6">
        <Cartel matiere={matiere} teinte={teinte} variante="sur-photo" />
      </div>
    </div>
  );
}
