import Link from "next/link";
import { lienPrestation, prestationDeLaPiece } from "@/data/prestations";

/**
 * Site 3.0 (lot F5, maillage) : ce vers quoi mène une ambiance en plus de ses matières (les cartels de `CarteAmbiance`
 * sont des liens vers leur fiche) — sa prestation (`prestationDeLaPiece` : cuisine, salle de bain, meubles — les murs y
 * vont —, `/pro`). `ici` : l'adresse de la page qui l'affiche ; une carte posée sur la page de sa propre prestation ne
 * renvoie pas vers elle-même (rien n'est rendu). Composant serveur.
 */
export function LiensAmbiance({ piece, ici, className = "mt-2" }: { piece: string; ici?: string; className?: string }) {
  const prestation = prestationDeLaPiece(piece);
  if (!prestation) return null;
  const href = lienPrestation(prestation.slug);
  if (href === ici) return null;
  return (
    <p className={`${className} flex flex-wrap items-center gap-x-1.5 text-[15px] text-encre-2`}>
      <span>La prestation&nbsp;:</span>
      <Link href={href} className="inline-flex min-h-[44px] items-center text-encre underline underline-offset-4 hover:text-encre-2">
        {prestation.nom}
      </Link>
    </p>
  );
}
