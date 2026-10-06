import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { DELAI_REPONSE } from "@/lib/offre";
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
