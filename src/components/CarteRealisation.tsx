import Link from "next/link";
import { AvantApres } from "@/components/simulation/AvantApres";
import { lignePrixDuree, type EtudeReelle } from "@/lib/etude-de-cas";
import { lienMatiere } from "@/lib/matieres-vedettes";
import { sourcesPhotoCrm } from "@/lib/publications";

/**
 * La carte d'une réalisation publiée par le CRM (mission 16, partie 3) : UNE
 * carte pour l'accueil (« Ils l'ont fait ») et `/realisations`. Le curseur
 * avant / après sans outils (la photo après seule s'il n'y a pas d'avant), en
 * WebP réduit par le CRM (`sourcesPhotoCrm`) ; titre, légende (type · ville),
 * texte (`avecTexte`), matières posées vers la page Matières, prix et durée
 * (`lignePrixDuree` : publiés ; sans prix publié, aucun, la durée habituelle libellée comme telle).
 * Composant serveur.
 */
export const CLASSE_CARTE_REALISATION = "overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-white";
export const RATIO_CARTE_REALISATION = "4 / 3";
const TAILLES_PAR_DEFAUT = "(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw";

export function CarteRealisation({ etude, avecTexte = false, tailles = TAILLES_PAR_DEFAUT }: { etude: EtudeReelle; avecTexte?: boolean; tailles?: string }) {
  const ligne = lignePrixDuree(etude);
  return (
    <article className={CLASSE_CARTE_REALISATION}>
      {etude.apres ? (
        <AvantApres
          apres={etude.apres}
          avant={etude.avant}
          alt={`Après — ${etude.titre}`}
          altAvant={`Avant — ${etude.titre}`}
          ratio={RATIO_CARTE_REALISATION}
          preparees={{ apres: sourcesPhotoCrm(etude.apres), avant: etude.avant ? sourcesPhotoCrm(etude.avant) : null, tailles }}
          sansOutils
        />
      ) : null}
      <div className="p-5">
        <h3 className="text-[17px] font-semibold text-encre">{etude.titre}</h3>
        {etude.legende ? <p className="mt-0.5 text-[13.5px] text-encre-2">{etude.legende}</p> : null}
        {avecTexte && etude.texte ? <p className="texte-2 mt-2">{etude.texte}</p> : null}
        {etude.matieres.length > 0 ? (
          <p className="texte-2 mt-2">
            {etude.matieres.map((m, i) => (
              <span key={m.ref}>
                {i > 0 ? ", " : ""}
                <Link href={lienMatiere(m.ref)} className="text-encre underline underline-offset-4">
                  {m.nom}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
        {ligne ? <p className="mt-2 text-[15px] font-medium text-encre">{ligne}</p> : null}
      </div>
    </article>
  );
}
