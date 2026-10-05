import { BandeMatiere } from "@/components/revue/BandeMatiere";
import { Echantillon } from "@/components/revue/Echantillon";
import { Pastille497 } from "@/components/revue/Pastille497";
import { Lien } from "@/components/simulation/Lien";
import { lienMatiere, matiereCartel, matieresVedettes } from "@/lib/matieres-vedettes";
import { NB_REFERENCES } from "@/lib/offre";
import { BANDES_ACCUEIL } from "./sections";

/**
 * 5. Le présentoir (site 3.0, lot B6 ; énoncé, § C.1) : la pastille rouge « 497 matières » (le nombre du catalogue, `NB_REFERENCES`), huit matières vedettes en VRAIS
 * échantillons (les vignettes du catalogue, `Echantillon`, une par famille d'usage, `lib/matieres-vedettes`), chacun
 * vers sa fiche (`/matieres?ref=`), et l'entrée vers tout le catalogue (secondaire). Il remplace les tuiles de la
 * mission 16. Il se ferme sur la bande de matière vert profond NF13 (en tête, elle aurait suivi la bande de marbre
 * sans rien entre les deux). Papier foncé, sans grain. Composant serveur.
 */
export function Presentoir() {
  const bande = BANDES_ACCUEIL.find((b) => b.apres === "dans-presentoir");
  const matiereBande = bande ? matiereCartel(bande.ref) : null;
  const vedettes = matieresVedettes().flatMap((v) => {
    const m = matiereCartel(v.ref);
    return m ? [m] : [];
  });
  return (
    <section id="presentoir" aria-labelledby="titre-presentoir" className="sous-la-ligne bg-fond-2">
      <div className="px-4 py-[var(--espace-5)] md:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="surtitre">Le présentoir</p>
              <h2 id="titre-presentoir" className="titre-2 mt-2 text-encre">
                {NB_REFERENCES} matières, à voir en vrai
              </h2>
              <p className="texte-2 mt-3">Bois, pierre, béton, métal, couleurs unies : des films Cover Styl&apos;, mats ou texturés. En voici huit ; on apporte les échantillons chez vous.</p>
            </div>
            <Pastille497 className="shrink-0" />
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 md:mt-10 md:gap-x-8">
            {vedettes.map((m) => (
              <li key={m.id}>
                <Echantillon matiere={m} href={lienMatiere(m.id)} />
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Lien href="/matieres" variante="secondaire">
              Voir les {NB_REFERENCES} matières
            </Lien>
          </div>
        </div>
      </div>
      {matiereBande ? <BandeMatiere matiere={matiereBande} /> : null}
    </section>
  );
}
