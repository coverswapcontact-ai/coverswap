import type { SurfaceAmbiance } from "@/data/ambiances";
import { cheminMatiere } from "@/lib/familles-matieres";
import { urlVignette } from "@/lib/simulateur/adresses-crm";

/**
 * Les étiquettes matière posées sur une photo d'ambiance (mission 19), comme dans une boutique de déco : une couche
 * HTML par-dessus l'image, jamais gravée dedans (nette, lisible par Google, modifiable dans `data/ambiances`).
 *  - à partir de 768 px : un point blanc de 8 px finement cerclé SUR la surface, un trait de 1 px blanc à 80 % (ombre
 *    légère pour rester lisible sur un fond clair), et l'étiquette posée dans un vide — vignette ronde de la vraie
 *    matière, puis « Sage Green · RM20 » en petites capitales sur un fond blanc translucide ;
 *  - sur téléphone : des points numérotés (muets), la légende vient sous la photo ;
 *  - un clic sur une étiquette ouvre la fiche de la matière (site 3.0, lot D4 : `cheminMatiere`, la règle de
 *    `lienMatiere`, sans le catalogue, que ce composant client ne charge pas) ;
 *  - le calque apparaît en fondu (`.calque-matieres`, coupé si la personne préfère moins de mouvement).
 * Le calque remplit son cadre (`absolute inset-0`) : le parent est l'image, `relative`. Sur une paire avant / après,
 * `seuilX` (la position du curseur, en %) : une étiquette ne se montre, entière, que si son point est côté « après »
 * (à droite du curseur) — elle s'efface en fondu quand le curseur la recouvre. Sans état : serveur ou client.
 * Site 3.0 (lot C4) : `/inspirations`, qui le posait sur ses photos (`PhotoAmbiance`, `LegendeMatieres`, retirés), dit
 * désormais la composition en cartels sous l'image (`CarteAmbiance`) ; le calque reste offert au curseur (`matieres`).
 */
export type MatiereCalque = Pick<SurfaceAmbiance, "surface" | "ref" | "nom" | "ancre" | "etiquette"> & {
  /** La famille de la matière (une ambiance résolue la porte) : l'étiquette mène à sa fiche (`cheminMatiere`, lot D4). */
  famille?: string;
};

export function CalqueMatieres({ matieres, seuilX }: { matieres: readonly MatiereCalque[]; seuilX?: number }) {
  if (matieres.length === 0) return null;
  const cachee = (m: MatiereCalque) => seuilX !== undefined && m.ancre.x < seuilX;
  const fondu = (m: MatiereCalque) => ({ opacity: cachee(m) ? 0 : 1, transition: "opacity var(--duree-moyenne) var(--ease)" });
  return (
    <div className="calque-matieres pointer-events-none absolute inset-0">
      {/* Les traits (ordinateur) : un repère 100 × 100 étiré à l'image, l'épaisseur gardée à 1 px. */}
      <svg className="absolute inset-0 hidden h-full w-full [filter:drop-shadow(0_0_1px_rgb(0_0_0/0.45))] md:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {matieres.map((m) => (
          <line key={m.ref + m.surface} style={fondu(m)} x1={m.ancre.x} y1={m.ancre.y} x2={m.etiquette.x} y2={m.etiquette.y} stroke="#ffffff" strokeOpacity={0.8} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {matieres.map((m, i) => (
        <span key={m.ref + m.surface} style={fondu(m)} aria-hidden={cachee(m) || undefined}>
          {/* Le point sur la surface (ordinateur). */}
          <span
            aria-hidden
            className="absolute hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.28),0_1px_3px_rgba(0,0,0,0.3)] md:block"
            style={{ left: `${m.ancre.x}%`, top: `${m.ancre.y}%` }}
          />
          {/* L'étiquette (ordinateur). */}
          <a
            href={cheminMatiere(m.ref, m.famille)}
            className="pointer-events-auto absolute hidden items-center gap-1.5 rounded-full bg-white/85 py-[3px] pr-2.5 pl-[3px] text-[12.5px] leading-none font-medium tracking-[0.04em] whitespace-nowrap text-encre shadow-[0_1px_4px_rgba(0,0,0,0.18)] [font-variant-caps:all-small-caps] backdrop-blur-[2px] transition-colors duration-[var(--duree-courte)] hover:bg-white focus-visible:bg-white md:inline-flex"
            style={{
              left: `${m.etiquette.x}%`,
              top: `${m.etiquette.y}%`,
              transform: `translate(${m.etiquette.vers === "gauche" ? "-100%" : "0"}, -50%)`,
              ...(cachee(m) ? { pointerEvents: "none" as const } : {}),
            }}
            tabIndex={cachee(m) ? -1 : undefined}
            aria-label={`${m.surface} : ${m.nom}, référence ${m.ref} — voir la matière`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- vignette de 320 px servie par le CRM */}
            <img src={urlVignette(m.ref)} alt="" width={18} height={18} fetchPriority="low" decoding="async" className="h-[18px] w-[18px] rounded-full object-cover ring-1 ring-black/10" />
            <span>
              {`${m.nom} · ${m.ref}`}
            </span>
          </a>
          {/* Le numéro (téléphone) : la légende sous la photo dit lequel est lequel. */}
          <span
            aria-hidden
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[12px] font-semibold text-encre shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.3)] md:hidden"
            style={{ left: `${m.ancre.x}%`, top: `${m.ancre.y}%` }}
          >
            {i + 1}
          </span>
        </span>
      ))}
    </div>
  );
}
