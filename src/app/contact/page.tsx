import type { Metadata } from "next";
import Link from "@/components/LienSite";
import Breadcrumb from "@/components/Breadcrumb";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { DELAI_REPONSE, VALIDITE_DEVIS_JOURS } from "@/lib/offre";
import FormulaireContact from "./_components/FormulaireContact";
import { chargerPrestations } from "@/lib/prestations";

export const metadata: Metadata = {
  ...metadonneesPage({
    titre: "Contact — Devis gratuit covering adhésif | CoverSwap",
    description: `Contactez CoverSwap pour un devis gratuit de covering adhésif. Rénovation cuisine, salle de bain, meubles et locaux pro. Réponse ${DELAI_REPONSE}.`,
    chemin: "/contact",
  }),
  keywords: "contact coverswap, devis covering, demande devis rénovation adhésive, covering montpellier contact",
};

/**
 * Contact (mission 16, partie 4) : une colonne, un but. « Écrivez-nous », le téléphone et l'e-mail, le formulaire
 * (source `SITE_CONTACT` au CRM), puis l'ancre `#espace` du pied de page : comment retrouver le lien de son espace
 * client. Rien n'est envoyé automatiquement : Lucas renvoie le lien (outil `envoyer_lien_espace`).
 */
export default async function ContactPage() {
  const familles = await chargerPrestations();
  const lienTexte = "text-encre underline underline-offset-4";
  return (
    <div className="bg-fond px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
      <div className="mx-auto max-w-3xl">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Contact", href: "/contact" }]} />
        <p className="surtitre">Contact</p>
        <h1 className="titre-1 mt-2 text-encre">Écrivez-nous</h1>
        <p className="texte mt-4 text-encre-2">
          Par téléphone au{" "}
          <a href={`tel:${ENTREPRISE.telephoneInternational}`} className={`${lienTexte} whitespace-nowrap`}>
            {ENTREPRISE.telephone}
          </a>{" "}
          ({ENTREPRISE.horaires.jours.toLowerCase()}, {ENTREPRISE.horaires.heures}), par e-mail à{" "}
          <a href={`mailto:${ENTREPRISE.email}`} className={lienTexte}>
            {ENTREPRISE.email}
          </a>
          , ou avec le formulaire. Réponse {DELAI_REPONSE}.
        </p>

        <div className="mt-8">
          <FormulaireContact familles={familles} />
        </div>

        {/* Site 3.0 (lot F6) : ce qui se passe après l'envoi, ce qu'il est utile de joindre, où l'on pose — le texte utile
            de la page (300 mots rendus au moins, `mots.test.ts`), sous le formulaire pour qu'il reste dans le premier écran. */}
        <section aria-labelledby="apres-titre" className="mt-[var(--espace-5)] border-t border-trait pt-8">
          <h2 id="apres-titre" className="titre-2 text-encre">
            Après votre message
          </h2>
          <p className="texte mt-3 text-encre">
            Votre message arrive chez nous, pas dans un centre d&apos;appels : on vous répond {DELAI_REPONSE}, du lundi au vendredi. Si un point manque, on vous
            rappelle ou on vous écrit pour le préciser. Le devis suit : chiffré au mètre linéaire, surface par surface, avec la référence de chaque film, gratuit
            et valable {VALIDITE_DEVIS_JOURS} jours. Si le projet vous convient, on passe chez vous avec les vrais échantillons et on mesure chaque surface. Rien
            ne vous engage avant la signature du devis.
          </p>
          <h3 className="mt-8 text-[19px] font-semibold text-encre">Ce qui nous aide à vous répondre juste</h3>
          <ul className="texte mt-3 list-disc space-y-2 pl-5 text-encre">
            <li>Deux ou trois photos de la pièce, de face et lumière allumée : une vue d&apos;ensemble, puis un détail des façades ou de la surface à recouvrir.</li>
            <li>Les dimensions, même approximatives : la longueur des meubles, la hauteur des colonnes, le nombre de portes et de tiroirs. On mesure de toute façon à la visite.</li>
            <li>
              La matière qui vous plaît, si vous l&apos;avez trouvée : sa référence (« NF13 », par exemple) ou le lien de sa fiche dans les{" "}
              <Link href="/matieres" className={lienTexte}>
                matières
              </Link>
              .
            </li>
            <li>L&apos;état du support : une façade gonflée par l&apos;eau ou un stratifié qui se décolle change la préparation. Mieux vaut le dire tout de suite.</li>
          </ul>
          <h3 className="mt-8 text-[19px] font-semibold text-encre">Où nous intervenons</h3>
          <p className="texte mt-3 text-encre">
            On est installés à {ENTREPRISE.adresse.ville} et on pose à Montpellier et dans sa métropole, dans l&apos;Hérault et le Gard : Lattes, Mauguio,
            Castelnau-le-Lez, Béziers, Nîmes, Sète. Plus loin, en France métropolitaine, c&apos;est sur devis, selon le projet. Le détail ville par ville est
            sur la page des{" "}
            <Link href="/zones" className={lienTexte}>
              zones d&apos;intervention
            </Link>
            , et le déroulé complet, de la photo à la pose, dans{" "}
            <Link href="/comment-ca-marche" className={lienTexte}>
              comment ça marche
            </Link>
            .
          </p>
        </section>

        <section id="espace" aria-labelledby="espace-titre" className="mt-[var(--espace-5)] scroll-mt-20 border-t border-trait pt-8">
          <h2 id="espace-titre" className="titre-2 text-encre">
            Votre espace client
          </h2>
          <p className="texte-2 mt-3">Votre lien d&apos;accès vous a été envoyé par SMS ou e-mail. Vous ne le retrouvez pas ? Écrivez-nous ci-dessus avec votre nom : nous vous le renvoyons.</p>
        </section>
      </div>
    </div>
  );
}
