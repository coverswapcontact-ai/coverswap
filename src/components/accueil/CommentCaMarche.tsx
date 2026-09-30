import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { Section } from "@/components/simulation/Section";
import { PHOTOS_PIECES } from "@/lib/images-pieces";
import { imagePreparee, type ManifesteImages } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { DELAI_RENDU, DUREE_POSE_TEXTE } from "@/lib/offre";
import { lienSimulerCuisine, type DepuisAccueil } from "./sections";

/**
 * 6. Comment ça marche (mission 16, partie 3 ; repris par `/comment-ca-marche`
 * en partie 5) : trois étapes, une image et une ligne chacune, puis le bouton
 * principal. L'image de l'étape 2 est la capture de l'écran Résultat du
 * simulateur (`etape-simulation`, produite en partie 4) dès qu'elle est
 * préparée ; en attendant, l'image d'ambiance de la cuisine. Chaque image est
 * étiquetée : « Ambiance » (image générée), « Simulation » (écran du
 * simulateur) ; les images sont décoratives (le texte de l'étape dit tout).
 * L'ESTIMATION du prix n'est annoncée qu'avec cette capture : elle arrive
 * avec la partie 4 (écran Résultat), et l'accueil ne promet rien que le
 * simulateur ne donne pas encore. Composant serveur.
 */
export type EtapeCommentCaMarche = { titre: string; texte: string; image: string; etiquette: "Ambiance" | "Simulation" };

export function etapesCommentCaMarche(manifeste: ManifesteImages = MANIFESTE_IMAGES): EtapeCommentCaMarche[] {
  const capture = imagePreparee("etape-simulation", manifeste);
  const rendu: EtapeCommentCaMarche = capture
    ? { titre: "Vous voyez le rendu et l'estimation", texte: `Le rendu sur votre photo en ${DELAI_RENDU}, avec une estimation du prix.`, image: "etape-simulation", etiquette: "Simulation" }
    : { titre: "Vous voyez le rendu", texte: `Le rendu sur votre photo en ${DELAI_RENDU}.`, image: PHOTOS_PIECES.cuisine, etiquette: "Ambiance" };
  return [
    { titre: "Vous photographiez", texte: "Une photo de votre pièce, prise avec votre téléphone.", image: "etape-photo", etiquette: "Ambiance" },
    rendu,
    { titre: `Nous posons, en ${DUREE_POSE_TEXTE}`, texte: "Le film est posé chez vous : vous retrouvez la pièce le soir même.", image: "etape-pose", etiquette: "Ambiance" },
  ];
}

/** `note` (mission 16, partie 5) : une ligne sous les étapes, avant le bouton (la page « Comment ça marche »). */
export function CommentCaMarche({ depuis, idBouton, fond = "fond", titre = "Comment ça marche", note }: { depuis?: DepuisAccueil; idBouton?: string; fond?: "fond" | "fond-2"; titre?: string; note?: string }) {
  return (
    <Section id="comment-ca-marche" large fond={fond} titre={titre}>
      <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
        {etapesCommentCaMarche().map((etape, i) => (
          <li key={etape.titre}>
            <Photo nom={etape.image} alt="" ratio="4 / 3" tailles="(min-width: 768px) 360px, 100vw" etiquette={etape.etiquette} className="rounded-[var(--rayon-md)]" />
            <p className="mt-4 text-[17px] font-semibold text-encre">
              <span className="text-encre-2">{i + 1}. </span>
              {etape.titre}
            </p>
            <p className="texte-2 mt-1">{etape.texte}</p>
          </li>
        ))}
      </ol>
      {note ? <p className="texte-2 mt-8 max-w-2xl">{note}</p> : null}
      <div id={idBouton} className="mt-8 md:mt-10">
        <Lien href={lienSimulerCuisine(depuis)}>Simuler ma cuisine</Lien>
      </div>
    </Section>
  );
}
