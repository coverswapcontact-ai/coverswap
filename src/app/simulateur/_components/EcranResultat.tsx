"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Bouton } from "@/components/simulation/Bouton";
import { Etiquette } from "@/components/simulation/Etiquette";
import { fichierDuRendu, telechargerFichier } from "@/components/simulation/fichiers";
import type { RenduSimulateur, Selection } from "@/lib/simulateur/reprise";
import { CartelComposition } from "./CartelComposition";

/**
 * Écran 4 — le résultat (mission 15, partie 4) : le rendu plein cadre au
 * rapport de l'image, la photo « avant » fondue dans l'après en une seconde
 * à l'arrivée (instantané si l'utilisateur préfère moins de mouvement), puis
 * le curseur avant / après avec « Comparer » et le plein écran ; dessous les
 * films utilisés, « Essayer d'autres matières », l'historique des rendus du
 * parcours (pastilles, comparaison de deux rendus côte à côte), « Télécharger »
 * et « Partager » AVANT le formulaire de contact (`children`), en fin d'écran.
 * Les images sont préchargées avant d'être montrées et leur rapport réserve la
 * place : rien ne saute.
 *
 * Site 3.0, lot E3 : l'image porte son étiquette d'honnêteté (`etiquetteDuRendu`) — « Simulation » sur la photo du
 * visiteur, « Ambiance · avant / après » sur une pièce d'exemple (l'avant est une image générée, la pièce n'est pas
 * la sienne), jamais « Simulation » pour celle-ci ; le texte de l'image, le fichier et le partage le disent aussi.
 * Lot E4 : sous l'image, le cartel de la composition (`CartelComposition` : références réelles, liens vers les fiches,
 * « Recevoir ces échantillons chez moi ») ; l'estimation et la demande (`children`) ne changent pas.
 */
const DUREE_FONDU_MS = 1_000;
const RATIO_PAR_DEFAUT = "4 / 3";

/** L'étiquette d'honnêteté d'un rendu : une pièce d'exemple n'est jamais une « Simulation » de la pièce du visiteur. */
export function etiquetteDuRendu(rendu: Pick<RenduSimulateur, "exemple">): "Simulation" | "Ambiance · avant / après" {
  return rendu.exemple ? "Ambiance · avant / après" : "Simulation";
}

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

type Props = {
  rendu: RenduSimulateur;
  rendus: RenduSimulateur[];
  photo: string | null;
  titre: string;
  fondu: boolean;
  onFonduFini: () => void;
  onChoisirRendu: (travailId: string) => void;
  onAutresMatieres: () => void;
  onPartage?: (moyen: "partage" | "telechargement") => void;
  /** Les choix courants : la famille et la finition des films du cartel (lot E4). */
  selections?: Readonly<Record<string, Selection | null>>;
  /** « Recevoir ces échantillons chez moi » coche la case de la demande ; absent après l'envoi. */
  onEchantillons?: () => void;
  children?: ReactNode;
};

export default function EcranResultat({ rendu, rendus, photo, titre, fondu, onFonduFini, onChoisirRendu, onAutresMatieres, onPartage, selections = {}, onEchantillons, children }: Props) {
  const avant = rendu.urlAvant ?? photo;
  // Invariable : « Vos meubles », « Votre espace pro »… ne s'accordent pas avec un participe.
  const exemple = !!rendu.exemple;
  const etiquette = etiquetteDuRendu(rendu);
  const alt = exemple ? `Ambiance sur une pièce d'exemple : ${titre}` : `Simulation : ${titre}`;
  const altAvant = exemple ? "La pièce d'exemple avant les matières" : "Votre pièce aujourd'hui";
  // L'état ne vaut que pour le rendu qui l'a produit : un autre rendu affiché repart en « chargement » sans setState dans l'effet.
  const [chargee, setChargee] = useState<Chargee | null>(null);
  const [comparaison, setComparaison] = useState<string | null>(null);
  const [partage, setPartage] = useState<"" | "envoi" | "erreur">("");
  const courante = chargee && chargee.travailId === rendu.travailId ? chargee : null;
  const phase = courante?.phase ?? "chargement";
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
  const avecImage = rendus.filter((r) => r.urlApres);
  const autre = comparaison ? avecImage.find((r) => r.travailId === comparaison) ?? null : null;
  const nomFichier = `coverswap-${exemple ? "ambiance" : "simulation"}-${rendu.travailId.slice(-6)}.jpg`;

  const telecharger = async () => {
    setPartage("envoi");
    const fichier = await fichierDuRendu(rendu.urlApres, nomFichier);
    if (!fichier) return setPartage("erreur");
    telechargerFichier(fichier);
    onPartage?.("telechargement");
    setPartage("");
  };
  const partager = async () => {
    setPartage("envoi");
    const fichier = await fichierDuRendu(rendu.urlApres, nomFichier);
    if (!fichier) return setPartage("erreur");
    const donnees = exemple ? { files: [fichier], title: "Une ambiance CoverSwap", text: "Une pièce d'exemple habillée de films Cover Styl', avec CoverSwap." } : { files: [fichier], title: "Ma simulation CoverSwap", text: `${titre} après simulation, avec CoverSwap.` };
    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(donnees))) {
      try {
        await navigator.share(donnees);
        onPartage?.("partage");
      } catch {
        /* partage annulé : rien à dire */
      }
    } else {
      telechargerFichier(fichier);
      onPartage?.("telechargement");
    }
    setPartage("");
  };

  return (
    <section aria-labelledby="etape-resultat" className="space-y-6">
      <h2 id="etape-resultat" className="font-display text-[26px] leading-tight font-semibold tracking-tight text-balance">
        {titre}
      </h2>

      {phase === "curseur" ? (
        <AvantApres apres={rendu.urlApres} avant={avant} alt={alt} altAvant={altAvant} ratio={reserve} etiquette={etiquette} />
      ) : (
        <div className="relative w-full overflow-hidden rounded-[var(--rayon-md)] bg-fond-2" style={{ aspectRatio: reserve }} aria-busy={phase === "chargement"}>
          {avant && phase === "fondu" ? (
            // eslint-disable-next-line @next/next/no-img-element -- photo du visiteur (mémoire locale ou servie par le CRM)
            <img src={avant} alt={altAvant} className="absolute inset-0 h-full w-full object-cover" draggable={false} referrerPolicy="no-referrer" />
          ) : null}
          {phase === "fondu" ? (
            // eslint-disable-next-line @next/next/no-img-element -- rendu servi par le CRM, non optimisé
            <img src={rendu.urlApres} alt={alt} draggable={false} referrerPolicy="no-referrer" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out ${courante?.visible ? "opacity-100" : "opacity-0"}`} />
          ) : null}
          <Etiquette className="pointer-events-none absolute bottom-3 left-3">{etiquette}</Etiquette>
          <span className="sr-only" role="status">
            {phase === "chargement" ? "Chargement du rendu" : "Votre simulation apparaît"}
          </span>
        </div>
      )}

      <CartelComposition references={rendu.references} selections={selections} onEchantillons={onEchantillons} />
      <p className="text-[13px] leading-relaxed text-encre-2">
        {exemple ? "Image d'ambiance : une pièce d'exemple, générée, habillée par une intelligence artificielle avec vos matières. " : "Rendu indicatif produit par une intelligence artificielle. "}
        Les teintes exactes se valident sur échantillons avant la pose.
      </p>

      <div className="flex flex-wrap gap-2">
        <Bouton variante="secondaire" onClick={onAutresMatieres}>
          Essayer d&apos;autres matières
        </Bouton>
        <Bouton variante="secondaire" occupe={partage === "envoi"} libelleOccupe="Préparation…" onClick={() => void telecharger()}>
          Télécharger
        </Bouton>
        <Bouton variante="secondaire" occupe={partage === "envoi"} libelleOccupe="Préparation…" onClick={() => void partager()}>
          Partager
        </Bouton>
      </div>
      {partage === "erreur" ? (
        <p role="alert" className="text-[14px] text-alerte-texte">
          Le rendu n&apos;a pas pu être récupéré : réessayez dans un instant.
        </p>
      ) : null}

      {avecImage.length > 1 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Vos rendus">
            {avecImage.map((r, i) => (
              <button key={r.travailId} type="button" aria-pressed={r.travailId === rendu.travailId} onClick={() => onChoisirRendu(r.travailId)} className={`min-h-[44px] rounded-[var(--rayon-sm)] border px-4 text-[14.5px] font-medium transition-colors duration-[var(--duree-courte)] ${r.travailId === rendu.travailId ? "border-encre bg-encre text-blanc" : "border-trait bg-white text-encre hover:border-encre"}`}>
                Rendu {i + 1}
              </button>
            ))}
            <label className="ml-auto flex min-h-[44px] items-center gap-2 text-[14px] text-encre-2">
              Comparer avec
              <select value={comparaison ?? ""} onChange={(e) => setComparaison(e.target.value || null)} className="min-h-[44px] rounded-[var(--rayon-sm)] border border-trait bg-white px-2 text-[15px] text-encre">
                <option value="">—</option>
                {avecImage.filter((r) => r.travailId !== rendu.travailId).map((r, i) => (
                  <option key={r.travailId} value={r.travailId}>
                    Rendu {avecImage.indexOf(r) + 1 || i + 1}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {autre ? (
            <div className="grid grid-cols-2 gap-2" aria-label="Deux rendus côte à côte">
              {[rendu, autre].map((r) => (
                <figure key={r.travailId} className="overflow-hidden rounded-[var(--rayon-sm)] border border-trait bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- rendu servi par le CRM */}
                  <img src={r.urlApres} alt={`Rendu ${avecImage.indexOf(r) + 1}`} className="block w-full bg-fond-2" style={{ aspectRatio: reserve, objectFit: "cover" }} referrerPolicy="no-referrer" />
                  <figcaption className="truncate px-2 py-1.5 text-[12.5px] text-encre-2">Rendu {avecImage.indexOf(r) + 1} · {r.references.map((x) => x.nom).join(", ") || "matières non renseignées"}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}
