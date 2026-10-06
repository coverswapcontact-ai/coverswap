import { VideoSchema } from "@/components/JsonLd";
import { BoutonVideo } from "@/components/simulation/BoutonVideo";
import { CadreVideo } from "@/components/simulation/CadreVideo";
import { sourcesPhoto } from "@/lib/images-preparees";
import { LIBELLES_VIDEO, VIDEOS, type IdVideo } from "@/lib/videos";

/**
 * Une vidéo du site (mission 22, partie B ; énoncé, § 6) : l'un des films de `lib/videos`, par son `id`, dans un
 * seul composant. Composant serveur : il lit le manifeste des images pour l'affiche (`sourcesPhoto`), pose le
 * `VideoObject` de la page (`VideoSchema`), puis rend :
 *  - `mode="clic"` : l'affiche étiquetée et un bouton (« Voir en 30 s ») qui ouvre le film dans la visionneuse plein
 *    écran — « Comment on travaille » (accueil), le bloc de tête de `/comment-ca-marche` (`priorite` : l'affiche est
 *    le LCP) ;
 *  - `mode="boucle"` : le film en boucle, muet, à l'écran seulement — le présentoir sur `/matieres` ;
 *  - `mode="lien"` : un lien de texte seul, sans affiche (« Voir le présentoir en 20 s » dans « Le présentoir »,
 *    « Voir la démo · 20 s » dans « Par où commencer ? ») ; il ouvre le film dans la visionneuse.
 * Les règles de docs/DESIGN.md, « Vidéos » : jetons et typographie du site 3.0, le rouge seulement sur le bouton
 * principal de la page (jamais ici), l'étiquette d'honnêteté sur chaque affiche (« Ambiance », « Démonstration »),
 * aucun octet de vidéo au premier affichage (`BoutonVideo`, `VideoBoucle`).
 */
export function Video({ id, mode, libelle, priorite, immediat, tailles, className, cadre }: { id: IdVideo; mode: "clic" | "boucle" | "lien"; libelle?: string; priorite?: boolean; immediat?: boolean; tailles?: string; className?: string; cadre?: "telephone" }) {
  const video = VIDEOS[id];
  const affiche = sourcesPhoto(video.affiche);
  const texte = libelle ?? LIBELLES_VIDEO[id];
  return (
    <>
      <VideoSchema video={video} />
      {mode === "lien" ? <BoutonVideo video={video} affiche={affiche?.src ?? ""} libelle={texte} variante="lien" className={className} /> : <CadreVideo video={video} affiche={affiche} mode={mode} libelle={texte} priorite={priorite} immediat={immediat} tailles={tailles} className={className} cadre={cadre} />}
    </>
  );
}
