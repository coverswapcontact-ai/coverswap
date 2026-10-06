import { GrandNumero } from "@/components/revue/GrandNumero";
import { Video } from "@/components/revue/Video";
import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { Section } from "@/components/simulation/Section";
import { lienSimuler } from "@/lib/liens-simulateur";
import { DELAI_RENDU, DELAI_REPONSE, DUREE_POSE_TEXTE } from "@/lib/offre-legere";
import type { DepuisAccueil } from "./sections";

/**
 * 4. Comment on travaille (site 3.0, lot B6 ; énoncé, § C.1) : quatre étapes numérotées en grand (`GrandNumero`, jamais
 * rouge), chacune avec sa photo étiquetée — votre photo (« Ambiance »), la simulation (la capture de l'écran Résultat
 * du simulateur : « Simulation »), les échantillons chez vous (« Ambiance »), la pose en une journée (« Ambiance ») —,
 * puis la preuve de finition (`detail-chant`, « Ambiance ») et les garanties concrètes : sans démontage, sans
 * poussière, devis gratuit sous 48 h, un seul interlocuteur. C'est ICI, et nulle part ailleurs sur l'accueil, que le
 * covering est expliqué (une phrase, `PHRASE_COVERING`). Puis le bouton principal, ancré pour le bouton collé
 * (`etapes-simuler`).
 *
 * Fait pour l'accueil, repris par `/comment-ca-marche` (lot C3) : `id` garde l'ancre de la page (`#comment-ca-marche`),
 * `intro={null}` retire la phrase sur le covering (la FAQ de la page l'explique déjà : une fois par page), `note` pose
 * une ligne sous les étapes, `enTete` la rend au premier écran (sans rendu différé, première photo prioritaire), et
 * `depuis` accepte `comment-ca-marche`.
 * Composant serveur, sans JavaScript.
 *
 * Mission 22 (partie B) : le film « Comment ça marche » (30 s, 16/9, `revue/Video` au clic : l'affiche étiquetée
 * « Ambiance » et « Voir en 30 s ») au-dessus des quatre étapes. `video={false}` : `/comment-ca-marche` le pose dans
 * son bloc de tête, sous le titre (son affiche est alors l'image prioritaire : la première étape passe en `immediat`).
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
/** L'affiche du film : toute la largeur de la section (1 152 px au plus), comme l'ouverture. */
export const TAILLES_VIDEO_LARGE = "(min-width: 1200px) 1152px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)";

export function CommentOnTravaille({ id = "comment-on-travaille", depuis, idBouton, preuve = false, titre = "Comment on travaille", intro = PHRASE_COVERING, note, enTete = false, video = true }: { id?: string; /** La section ouvre la page (`/comment-ca-marche`) : rendue tout de suite, la photo de la première étape chargée tout de suite (l'affiche du film, posée par la page, est le LCP). */ enTete?: boolean; depuis?: DepuisAccueil | "comment-ca-marche"; idBouton?: string; preuve?: boolean; titre?: string; /** `null` : pas de phrase sous le titre. */ intro?: string | null; /** Une ligne sous les étapes (`/comment-ca-marche`). */ note?: string; /** Le film au-dessus des étapes (mission 22) ; `false` quand la page le pose elle-même. */ video?: boolean }) {
  const lien = lienSimuler({ depuis: depuis ?? "accueil-etapes" });
  return (
    <Section id={id} large differee={!enTete} titre={titre} intro={intro ?? undefined}>
      {video ? <Video id="commentCaMarche" mode="clic" priorite={enTete} tailles={TAILLES_VIDEO_LARGE} className="mb-10 md:mb-14" /> : null}
      <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {ETAPES_TRAVAIL.map((etape, i) => (
          <li key={etape.image} className="flex flex-col">
            <div className="flex items-baseline gap-3 border-t border-encre pt-3">
              <GrandNumero valeur={i + 1} />
              <h3 className="font-display text-[22px] leading-tight font-semibold text-encre">{etape.titre}</h3>
            </div>
            <Photo nom={etape.image} alt="" ratio="3 / 2" tailles={TAILLES_ETAPE} immediat={enTete && i === 0} etiquette={etape.etiquette} className="mt-4 rounded-[var(--rayon-md)]" />
            <p className="texte-2 mt-3">{etape.texte}</p>
          </li>
        ))}
      </ol>
      {note ? <p className="texte-2 mt-10 max-w-2xl">{note}</p> : null}
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
              <Lien href={lien}>Simuler ma pièce</Lien>
            </div>
          </div>
        </div>
      ) : (
        <div id={idBouton} className="mt-10">
          <Lien href={lien}>Simuler ma pièce</Lien>
        </div>
      )}
    </Section>
  );
}
