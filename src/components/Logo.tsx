/**
 * Le logo CoverSwap : le losange rouge, le « C », le mot (« Cover » à l'encre, « Swap » au rouge). Composant serveur,
 * sorti d'`espace/Illustrations.tsx` au lot B1 du site 3.0 (qui le réexporte pour l'espace client). Le rouge du logo
 * est le jeton `accent` de globals.css : la marque est, avec les actions, le seul endroit où il apparaît.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="relative h-8 w-8" aria-hidden>
        <span className="absolute inset-[3px] rotate-45 rounded-[6px] bg-accent" />
        <span className="absolute inset-0 flex items-center justify-center font-display text-[16px] font-black text-blanc">C</span>
      </span>
      <span className="font-display text-[21px] font-black tracking-tight text-encre">
        Cover<span className="text-accent">Swap</span>
      </span>
    </span>
  );
}
