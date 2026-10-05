import { GrandNumero } from "@/components/revue/GrandNumero";
import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { Section } from "@/components/simulation/Section";
import { DELAI_RENDU, DELAI_REPONSE, DUREE_POSE_TEXTE } from "@/lib/offre-legere";
import { lienSimulerAccueil, type DepuisAccueil } from "./sections";

/**
 * 4. Comment on travaille (site 3.0, lot B6 ; énoncé, § C.1) : quatre étapes numérotées en grand (`GrandNumero`, jamais
 * rouge), chacune avec sa photo étiquetée — votre photo (« Ambiance »), la simulation (la capture de l'écran Résultat
 * du simulateur : « Simulation »), les échantillons chez vous (« Ambiance »), la pose en une journée (« Ambiance ») —,
 * puis la preuve de finition (`detail-chant`, « Ambiance ») et les garanties concrètes : sans démontage, sans
 * poussière, devis gratuit sous 48 h, un seul interlocuteur. C'est ICI, et nulle part ailleurs sur l'accueil, que le
 * covering est expliqué (une phrase, `PHRASE_COVERING`). Puis le bouton principal, ancré pour le bouton collé
 * (`etapes-simuler`).
 *
 * Fait pour l'accueil ; `/comment-ca-marche` garde les trois étapes de `CommentCaMarche` jusqu'au lot C3, qui la
 * refait. Composant serveur, sans JavaScript.
 */
export const PHRASE_COVERING = "Le covering, c'est un film adhésif haute résistance qu'on pose sur vos meubles, vos portes ou vos murs.";

export type EtapeTravail = { titre: string; texte: string; image: string; etiquette: "Ambiance" | "Simulation" };

export const ETAPES_TRAVAIL: readonly EtapeTravail[] = [
  { titre: "Votre photo", texte: "Vous photographiez la pièce avec votre téléphone, de face, lumière allumée.", image: "etape-photo", etiquette: "Ambiance" },
  { titre: "La simulation", texte: `Vous choisissez vos matières : le rendu arrive sur votre photo en ${DELAI_RENDU}, avec une estimation du prix.`, image: "etape-simulation", etiquette: "Simulation" },
  { titre: "Les échantillons chez vous", texte: "On vient avec les vrais échantillons : vous voyez les teintes à la lumière de votre pièce, et on mesure.", image: "echantillons-table", etiquette: "Ambiance" },
  { titre: `La pose en ${DUREE_POSE_TEXTE}`, texte: "On pose le film sur vos meubles tels qu'ils sont : le soir même, vous retrouvez votre pièce.", image: "pose-mains", etiquette: "Ambiance" },
];

export const PREUVE_FINITION = { image: "detail-chant", titre: "La finition, de près", texte: "Le film est replié sur les chants et posé à chaud : pas de bord qui se soulève, pas de bulle, des angles nets." } as const;

export const GARANTIES: readonly { titre: string; texte: string }[] = [
  { titre: "Sans démontage", texte: "On ne dépose ni portes ni meubles : le film se pose en place." },
  { titre: "Sans poussière", texte: "Ni ponçage, ni peinture, ni gravats : on repart avec nos chutes." },
  { titre: "Devis gratuit", texte: `Une réponse ${DELAI_REPONSE}, un prix écrit avant de commencer.` },
  { titre: "Un seul interlocuteur", texte: "La même personne de la simulation à la pose, et après." },
];

const TAILLES_ETAPE = "(min-width: 1024px) 330px, (min-width: 640px) 45vw, calc(100vw - 32px)";

export function CommentOnTravaille({ depuis, idBouton, preuve = false, titre = "Comment on travaille" }: { depuis?: DepuisAccueil; idBouton?: string; preuve?: boolean; titre?: string }) {
  return (
    <Section id="comment-on-travaille" large differee titre={titre} intro={PHRASE_COVERING}>
      <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {ETAPES_TRAVAIL.map((etape, i) => (
          <li key={etape.image} className="flex flex-col">
            <div className="flex items-baseline gap-3 border-t border-encre pt-3">
              <GrandNumero valeur={i + 1} />
              <h3 className="font-display text-[22px] leading-tight font-semibold text-encre">{etape.titre}</h3>
            </div>
            <Photo nom={etape.image} alt="" ratio="3 / 2" tailles={TAILLES_ETAPE} etiquette={etape.etiquette} className="mt-4 rounded-[var(--rayon-md)]" />
            <p className="texte-2 mt-3">{etape.texte}</p>
          </li>
        ))}
      </ol>
      {preuve ? (
        <div className="mt-14 grid gap-8 md:mt-16 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:items-center md:gap-12">
          <figure className="m-0">
            <Photo nom={PREUVE_FINITION.image} alt="" ratio="3 / 2" tailles="(min-width: 768px) 55vw, calc(100vw - 32px)" etiquette="Ambiance" className="rounded-[var(--rayon-md)]" />
            <figcaption className="mt-3">
              <span className="block font-display text-[22px] leading-tight font-semibold text-encre">{PREUVE_FINITION.titre}</span>
              <span className="texte-2 mt-1 block">{PREUVE_FINITION.texte}</span>
            </figcaption>
          </figure>
          <div>
            <dl className="grid gap-x-8 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {GARANTIES.map((g) => (
                <div key={g.titre} className="border-t border-encre py-4">
                  <dt className="text-[17px] font-semibold text-encre">{g.titre}</dt>
                  <dd className="texte-2 mt-1">{g.texte}</dd>
                </div>
              ))}
            </dl>
            <div id={idBouton} className="mt-6">
              <Lien href={lienSimulerAccueil(depuis ?? "accueil-etapes")}>Simuler ma pièce</Lien>
            </div>
          </div>
        </div>
      ) : (
        <div id={idBouton} className="mt-10">
          <Lien href={lienSimulerAccueil(depuis ?? "accueil-etapes")}>Simuler ma pièce</Lien>
        </div>
      )}
    </Section>
  );
}
