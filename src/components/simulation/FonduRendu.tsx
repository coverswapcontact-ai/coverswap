"use client";

import { useEffect, useState } from "react";
import { AvantApres } from "./AvantApres";

/**
 * L'arrivée d'un rendu (mission 15, partie 5, pour l'espace client — le même
 * geste que l'écran résultat du site) : les deux images sont préchargées, leur
 * rapport réserve la place (rien ne bouge quand elles arrivent), la photo
 * « avant » se fond dans l'« après » en une seconde (instantané si la personne
 * préfère moins de mouvement, ou sans photo avant), puis le curseur avant /
 * après prend la place au même rapport. Une seule fois par rendu (`cle`) ;
 * `actif` à faux montre le curseur tout de suite (le rapport lui est donné dès
 * qu'il est connu).
 */
const DUREE_FONDU_MS = 1_000;
/** En attendant les dimensions réelles : le rapport le plus courant des photos cadrées par le CRM. */
const RATIO_PAR_DEFAUT = "4 / 3";

type Dimensions = { largeur: number; hauteur: number };
type Etat = { cle: string; ratio: string | null; phase: "fondu" | "curseur"; visible: boolean };

function precharger(url: string): Promise<Dimensions | null> {
  return new Promise((resoudre) => {
    const image = new Image();
    image.onload = () => resoudre(image.naturalWidth > 0 && image.naturalHeight > 0 ? { largeur: image.naturalWidth, hauteur: image.naturalHeight } : null);
    image.onerror = () => resoudre(null);
    image.src = url;
  });
}

export function FonduRendu({ cle, apres, avant, alt, actif, className }: { cle: string; apres: string; avant: string | null; alt: string; actif: boolean; className?: string }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const courant = etat && etat.cle === cle ? etat : null;
  const phase = actif ? (courant?.phase ?? "chargement") : "curseur";
  const ratio = courant?.ratio ?? null;

  useEffect(() => {
    let vivant = true;
    const reduit = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    void Promise.all([precharger(apres), avant ? precharger(avant) : Promise.resolve(null)]).then(([dimApres, dimAvant]) => {
      if (!vivant) return;
      // La photo « avant » est la photo cadrée : les deux images ont le même rapport.
      const dim = dimApres ?? dimAvant;
      const rapport = dim ? `${dim.largeur} / ${dim.hauteur}` : null;
      if (!actif || !avant || reduit) return setEtat({ cle, ratio: rapport, phase: "curseur", visible: true });
      setEtat({ cle, ratio: rapport, phase: "fondu", visible: false });
      requestAnimationFrame(() => requestAnimationFrame(() => vivant && setEtat((e) => (e && e.cle === cle ? { ...e, visible: true } : e))));
      window.setTimeout(() => vivant && setEtat((e) => (e && e.cle === cle ? { ...e, phase: "curseur" } : e)), DUREE_FONDU_MS + 150);
    });
    return () => {
      vivant = false;
    };
    // Une seule séquence par rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, actif]);

  if (phase === "curseur" || !avant) return <AvantApres apres={apres} avant={avant} alt={alt} className={className} ratio={ratio ?? undefined} />;
  return (
    <div className={className}>
      <div className="relative w-full overflow-hidden rounded-[var(--rayon-md)] bg-fond-2" style={{ aspectRatio: ratio ?? RATIO_PAR_DEFAUT }} aria-busy={phase === "chargement"}>
        {phase === "fondu" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- photo servie par le CRM */}
            <img src={avant} alt="Votre pièce aujourd'hui" className="absolute inset-0 h-full w-full object-cover" draggable={false} referrerPolicy="no-referrer" />
            {/* eslint-disable-next-line @next/next/no-img-element -- rendu servi par le CRM */}
            <img src={apres} alt={alt} draggable={false} referrerPolicy="no-referrer" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out ${courant?.visible ? "opacity-100" : "opacity-0"}`} />
          </>
        ) : null}
        <span className="sr-only" role="status">
          {phase === "chargement" ? "Chargement du rendu" : "Votre simulation apparaît"}
        </span>
      </div>
    </div>
  );
}
