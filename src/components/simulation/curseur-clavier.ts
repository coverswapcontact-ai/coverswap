/**
 * Le curseur avant / après au clavier (site 3.0, lot B3 ; énoncé, phase F : « curseur avant/après utilisable au
 * clavier »), en règle pure, testée par `composants.test.ts` : les touches d'un `role="slider"` (WAI-ARIA APG).
 *  - → et ↑ : 5 % de plus d'« avant » ; ← et ↓ : 5 % de moins ;
 *  - Page ↑ / Page ↓ : par pas de 25 % ;
 *  - Début / Fin : tout « après » (0) / tout « avant » (100).
 * Rend la nouvelle position (bornée à 0-100), ou `null` pour une touche que le curseur ne gère pas (elle garde alors
 * son effet ordinaire : Tab, Entrée…). Pour une touche gérée, `AvantApres` appelle `preventDefault()` : les flèches
 * et Page ↑ / ↓ ne font plus défiler la page pendant qu'on règle le curseur.
 */
export const PAS_CURSEUR = 5;
export const PAS_PAGE_CURSEUR = 25;

export function positionAuClavier(touche: string, position: number): number | null {
  const borne = (p: number) => Math.min(100, Math.max(0, p));
  switch (touche) {
    case "ArrowRight":
    case "ArrowUp":
      return borne(position + PAS_CURSEUR);
    case "ArrowLeft":
    case "ArrowDown":
      return borne(position - PAS_CURSEUR);
    case "PageUp":
      return borne(position + PAS_PAGE_CURSEUR);
    case "PageDown":
      return borne(position - PAS_PAGE_CURSEUR);
    case "Home":
      return 0;
    case "End":
      return 100;
    default:
      return null;
  }
}
