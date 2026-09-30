"use client";

import { useEffect, useRef, useState } from "react";
import { AvantApres } from "@/components/espace/AvantApres";
import type { RenduSimulateur } from "@/lib/simulateur/reprise";

/**
 * Arrivée du résultat (mission 15, partie 1) : la photo « avant » à l'écran se
 * fond dans « après » en une seconde (instantané si l'utilisateur préfère
 * moins de mouvement), puis le curseur avant / après apparaît — `AvantApres`
 * de l'espace client (hauteur naturelle de l'image, `touch-pan-y`), plus de
 * cadre à hauteur fixe. Les images sont des adresses servies par le CRM.
 *
 * Les deux images sont préchargées AVANT d'être montrées, et leur rapport
 * réserve la place du bloc : rien ne saute quand elles arrivent (reprise,
 * lien du mail, changement de rendu). À défaut, 4/3 comme l'écran d'attente.
 */

const DUREE_FONDU_MS = 1_000;
const RATIO_PAR_DEFAUT = "4 / 3";

type Dimensions = { largeur: number; hauteur: number };
type Chargee = { travailId: string; ratio: string | null; phase: "fondu" | "curseur"; visible: boolean };

function precharger(url: string): Promise<Dimensions | null> {
  return new Promise((resoudre) => {
    const image = new Image();
    image.onload = () => resoudre(image.naturalWidth > 0 && image.naturalHeight > 0 ? { largeur: image.naturalWidth, hauteur: image.naturalHeight } : null);
    image.onerror = () => resoudre(null);
    image.src = url;
  });
}

export default function EcranResultat({ rendu, photo, alt, fondu, onFonduFini }: { rendu: RenduSimulateur; photo: string | null; alt: string; fondu: boolean; onFonduFini: () => void }) {
  const avant = rendu.urlAvant ?? photo;
  // L'état ne vaut que pour le rendu qui l'a produit : un autre rendu affiché repart en « chargement » sans setState dans l'effet.
  const [chargee, setChargee] = useState<Chargee | null>(null);
  const courante = chargee && chargee.travailId === rendu.travailId ? chargee : null;
  const phase = courante?.phase ?? "chargement";
  // Le fondu ne se joue qu'à l'arrivée du rendu : lu au moment où la séquence démarre, pas rejoué quand il se termine.
  const fonduRef = useRef(fondu);
  useEffect(() => {
    fonduRef.current = fondu;
  }, [fondu]);

  useEffect(() => {
    let actif = true;
    const travailId = rendu.travailId;
    const avecFondu = fonduRef.current;
    const reduit = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    void Promise.all([precharger(rendu.urlApres), avant ? precharger(avant) : Promise.resolve(null)]).then(([apres, avantDim]) => {
      if (!actif) return;
      const dim = apres ?? avantDim;
      const ratio = dim ? `${dim.largeur} / ${dim.hauteur}` : null;
      if (!avecFondu || reduit || !avant) {
        setChargee({ travailId, ratio, phase: "curseur", visible: true });
        if (avecFondu) onFonduFini();
        return;
      }
      setChargee({ travailId, ratio, phase: "fondu", visible: false });
      // Le rendu est monté transparent, puis s'affiche : la transition d'opacité fait le fondu.
      requestAnimationFrame(() => requestAnimationFrame(() => actif && setChargee((c) => (c && c.travailId === travailId ? { ...c, visible: true } : c))));
      window.setTimeout(() => {
        if (!actif) return;
        setChargee((c) => (c && c.travailId === travailId ? { ...c, phase: "curseur" } : c));
        onFonduFini();
      }, DUREE_FONDU_MS + 150);
    });
    return () => {
      actif = false;
    };
    // Une seule séquence par rendu affiché.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendu.travailId]);

  const reserve = courante?.ratio ?? RATIO_PAR_DEFAUT;

  if (phase === "curseur") return <AvantApres apres={rendu.urlApres} avant={avant} alt={alt} className="rounded-xl" ratio={reserve} />;

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#ECEAE5]" style={{ aspectRatio: reserve }} aria-busy={phase === "chargement"}>
      {avant && phase === "fondu" ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo du visiteur (mémoire locale ou servie par le CRM)
        <img src={avant} alt="Votre pièce aujourd'hui" className="absolute inset-0 h-full w-full object-cover" draggable={false} referrerPolicy="no-referrer" />
      ) : null}
      {phase === "fondu" ? (
        // eslint-disable-next-line @next/next/no-img-element -- rendu servi par le CRM, non optimisé
        <img src={rendu.urlApres} alt={alt} draggable={false} referrerPolicy="no-referrer" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out ${courante?.visible ? "opacity-100" : "opacity-0"}`} />
      ) : null}
      <span className="sr-only" role="status">
        {phase === "chargement" ? "Chargement du rendu" : "Votre simulation apparaît"}
      </span>
    </div>
  );
}
