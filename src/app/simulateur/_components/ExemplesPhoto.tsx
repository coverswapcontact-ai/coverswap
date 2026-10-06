"use client";

import Link from "@/components/LienSite";
import { useRef, useState } from "react";
import { Cartel } from "@/components/revue/Cartel";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Bouton } from "@/components/simulation/Bouton";
import { Etiquette } from "@/components/simulation/Etiquette";
import { ImagePreparee } from "@/components/simulation/ImagePreparee";
import type { ExempleSimulateur } from "@/lib/exemples-simulateur";

/**
 * « Pas de photo sous la main ? » (site 3.0, lot E3), sous l'écran Photo : les pièces d'exemple de la série 2
 * (`lib/exemples-simulateur`, passées par la page), choisies par pièce puis par aspect (« Hêtre », « Blanc jauni »…).
 *
 * Choisir un exemple est un ÉTAT LOCAL : ses deux après de la bibliothèque s'affichent tout de suite (« Version 1 /
 * Version 2 », curseur avant / après « Ambiance · avant / après », cartels des matières vers leurs fiches). Ici, rien
 * ne part : ni la photo du parcours, ni l'analyse, ni le CRM, ni un événement. Seul « Essayer d'autres matières sur
 * cette pièce » (`onEssayer`, `useExemple`) fait de l'avant une photo du parcours, par le chemin d'une photo de
 * visiteur. Toutes ces images sont générées : « Ambiance », jamais « Simulation ». Un bouton secondaire : le
 * principal de l'écran reste « Prendre une photo ».
 */
const PIECES: readonly { id: string; libelle: string }[] = [
  { id: "cuisine", libelle: "Cuisine" },
  { id: "salle-de-bain", libelle: "Salle de bain" },
  { id: "meubles", libelle: "Meubles" },
  { id: "mur-plafond", libelle: "Murs" },
  { id: "professionnel", libelle: "Pro" },
];

const TAILLES_VIGNETTE = "(min-width: 640px) 240px, 45vw";
const TAILLES_PAIRE = "(min-width: 800px) 736px, 100vw";
const PASTILLE = "min-h-[44px] rounded-[var(--rayon-sm)] border px-4 text-[14.5px] font-medium transition-colors duration-[var(--duree-courte)]";
const pastille = (choisie: boolean) => `${PASTILLE} ${choisie ? "border-encre bg-encre text-blanc" : "border-trait bg-white text-encre hover:border-encre"}`;

export function ExemplesPhoto({ exemples, projet, occupe, charge, erreur, onEssayer, initial = null }: {
  exemples: readonly ExempleSimulateur[];
  /** La pièce choisie à l'écran 1 : ses exemples d'abord. */
  projet: string;
  /** Une photo est en préparation. */
  occupe: boolean;
  /** L'exemple en cours de chargement (« Essayer d'autres matières sur cette pièce »). */
  charge: string | null;
  erreur: string | null;
  onEssayer: (exemple: ExempleSimulateur) => void;
  /** L'exemple ouvert au premier rendu (tests). */
  initial?: string | null;
}) {
  const pieces = PIECES.filter((p) => exemples.some((e) => e.piece === p.id));
  const [piece, setPiece] = useState(() => (pieces.some((p) => p.id === projet) ? projet : (pieces[0]?.id ?? "")));
  const [choisi, setChoisi] = useState<string | null>(initial);
  const [version, setVersion] = useState(0);
  const titre = useRef<HTMLHeadingElement>(null);
  if (pieces.length === 0) return null;

  const exemple = exemples.find((e) => e.id === choisi) ?? null;
  const liste = exemples.filter((e) => e.piece === piece);
  const montrer = (id: string) => {
    setChoisi(id);
    setVersion(0);
    // Le titre de l'exemple reçoit le focus : le clavier et le lecteur d'écran suivent, la page ne défile que s'il le faut.
    requestAnimationFrame(() => titre.current?.focus());
  };

  return (
    <section id="exemples" aria-labelledby="titre-exemples" className="scroll-mt-4 space-y-4 border-t border-trait pt-6">
      <div>
        <h3 id="titre-exemples" className="font-display text-[22px] leading-tight font-semibold text-encre">
          Pas de photo sous la main ?
        </h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-encre-2">Prenez une pièce comme la vôtre : on vous montre tout de suite deux idées posées dessus, puis vous pouvez y essayer vos matières.</p>
      </div>

      {exemple ? (
        <DetailExemple exemple={exemple} version={Math.min(version, exemple.versions.length - 1)} onVersion={setVersion} titre={titre} occupe={occupe || charge !== null} charge={charge === exemple.id} erreur={erreur} onEssayer={() => onEssayer(exemple)} onRetour={() => setChoisi(null)} />
      ) : (
        <>
          {pieces.length > 1 ? (
            <div role="group" aria-label="La pièce" className="flex flex-wrap gap-2">
              {pieces.map((p) => (
                <button key={p.id} type="button" aria-pressed={p.id === piece} onClick={() => setPiece(p.id)} className={pastille(p.id === piece)}>
                  {p.libelle} <span className={p.id === piece ? "text-blanc/80" : "text-encre-2"}>{exemples.filter((e) => e.piece === p.id).length}</span>
                </button>
              ))}
            </div>
          ) : null}
          <ul className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3" aria-label={`Pièces d'exemple : ${PIECES.find((p) => p.id === piece)?.libelle ?? piece}`}>
            {liste.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => montrer(e.id)} className="group block w-full rounded-[var(--rayon-sm)] text-left">
                  <span className="relative block aspect-[3/2] overflow-hidden rounded-[var(--rayon-sm)] bg-fond-2">
                    <ImagePreparee sources={e.avant} tailles={TAILLES_VIGNETTE} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[var(--duree-moyenne)] ease-[var(--ease)] group-hover:scale-[1.03]" />
                    <Etiquette muette className="pointer-events-none absolute bottom-2 left-2">
                      Ambiance
                    </Etiquette>
                  </span>
                  <span className="mt-1.5 block text-[15px] leading-snug font-semibold text-encre">{e.aspect}</span>
                  <span className="block text-[13px] leading-snug text-encre-2">{e.forme}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function DetailExemple({ exemple, version, onVersion, titre, occupe, charge, erreur, onEssayer, onRetour }: { exemple: ExempleSimulateur; version: number; onVersion: (i: number) => void; titre: React.RefObject<HTMLHeadingElement | null>; occupe: boolean; charge: boolean; erreur: string | null; onEssayer: () => void; onRetour: () => void }) {
  const v = exemple.versions[version];
  const [largeur, hauteur] = exemple.ratio.split("/").map((n) => Number(n.trim()));
  const portrait = hauteur > largeur;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h4 ref={titre} tabIndex={-1} className="font-display text-[20px] leading-tight font-semibold text-encre outline-none">
          {exemple.aspect} · {exemple.forme}
        </h4>
        <button type="button" onClick={onRetour} className="min-h-[44px] text-[14.5px] text-encre-2 underline underline-offset-4 hover:text-encre">
          Voir les autres pièces
        </button>
      </div>
      <div role="group" aria-label="Deux idées sur cette pièce" className="flex flex-wrap items-center gap-2">
        {exemple.versions.map((x, i) => (
          <button key={x.id} type="button" aria-pressed={i === version} onClick={() => onVersion(i)} className={pastille(i === version)}>
            Version {i + 1}
          </button>
        ))}
        <span className="text-[14px] text-encre-2">{v.titre}</span>
      </div>
      <div className={portrait ? "mx-auto max-w-sm" : undefined}>
        <AvantApres key={exemple.id} avant={exemple.avant.src} apres={v.sources.src} alt={v.alt} altAvant={exemple.altAvant} ratio={exemple.ratio} preparees={{ avant: exemple.avant, apres: v.sources, tailles: TAILLES_PAIRE }} sansOutils etiquette="Ambiance · avant / après" />
      </div>
      <ul className="grid gap-x-4 gap-y-3 sm:grid-cols-2" aria-label={`Matières posées : ${v.titre}`}>
        {v.matieres.map((m) => (
          <li key={m.matiere.id}>
            <p className="text-[13px] text-encre-2">{m.surfaces}</p>
            <Link href={m.lien} prefetch={false} className="mt-1 block underline-offset-4 hover:underline">
              <Cartel matiere={m.matiere} balise="span" />
            </Link>
          </li>
        ))}
      </ul>
      <div>
        <Bouton variante="secondaire" plein occupe={charge} libelleOccupe="Chargement de la pièce…" raisonDesactive={occupe && !charge ? "Une photo est en préparation…" : undefined} onClick={onEssayer}>
          Essayer d&apos;autres matières sur cette pièce
        </Bouton>
        <p className="mt-2 text-[13.5px] leading-relaxed text-encre-2">Une vraie simulation sur cette photo, avec les matières que vous choisissez. Le résultat reste une image d&apos;ambiance : la pièce n&apos;est pas la vôtre.</p>
        {erreur ? (
          <p role="alert" className="mt-2 text-[14px] text-alerte-texte">
            {erreur}
          </p>
        ) : null}
      </div>
    </div>
  );
}
