import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site coverswap.fr : éditeur, hébergeurs, propriété intellectuelle, médiation de la consommation.",
  alternates: { canonical: "https://coverswap.fr/mentions-legales" },
  robots: { index: true, follow: true },
};

const MISE_A_JOUR = "17 septembre 2026";

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-white">{titre}</h2>
      {children}
    </section>
  );
}

export default function MentionsLegales() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container-custom max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-2">Mentions légales</h1>
        <p className="text-sm text-gris-500 mb-10">Dernière mise à jour : {MISE_A_JOUR}</p>

        <div className="space-y-10 text-gris-300 leading-relaxed">
          <Section titre="Éditeur du site">
            <p>
              Le site <strong className="text-white">coverswap.fr</strong> est édité par <strong className="text-white">{SITE.owner}</strong>,
              entrepreneur individuel exerçant sous le nom commercial CoverSwap.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>SIRET : {SITE.siret} — code APE : {SITE.ape} (travaux de peinture et vitrerie)</li>
              <li>Siège : {SITE.address}, France</li>
              <li>Téléphone : {SITE.phone}</li>
              <li>E-mail : {SITE.email}</li>
              <li>TVA non applicable, article 293 B du Code général des impôts</li>
              <li>Directeur de la publication : {SITE.owner}</li>
            </ul>
          </Section>

          <Section titre="Assurance professionnelle">
            <p>
              Conformément à l&apos;article L. 243-2 du Code des assurances, les coordonnées de l&apos;assureur et la couverture géographique du
              contrat d&apos;assurance professionnelle figurent sur chaque devis et chaque facture.
            </p>
            <p className="text-sm text-gris-500">[À compléter : nom de l&apos;assureur, numéro de contrat, couverture géographique.]</p>
          </Section>

          <Section titre="Hébergement">
            <p>
              Le site est hébergé par <strong className="text-white">Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
              (vercel.com). Les demandes envoyées depuis le site sont traitées par notre outil de gestion, hébergé par{" "}
              <strong className="text-white">Railway Corp.</strong>, 548 Market St, San Francisco, CA 94104, États-Unis (railway.com), dans un
              centre de données situé dans l&apos;Union européenne.
            </p>
          </Section>

          <Section titre="Propriété intellectuelle">
            <p>
              L&apos;ensemble du site (textes, photographies, vidéos, logos, simulations, code) est protégé par le droit d&apos;auteur et le droit des
              marques. Toute reproduction, représentation ou adaptation, totale ou partielle, sans autorisation écrite préalable est interdite.
              « Cover Styl&apos; » est une marque de son titulaire ; les visuels d&apos;échantillons sont reproduits avec l&apos;accord du distributeur.
            </p>
            <p>
              Les rendus produits par le simulateur sont des illustrations générées par une intelligence artificielle à partir de la photo que
              vous fournissez ; ils n&apos;ont pas de valeur contractuelle et ne préjugent pas du résultat exact de la pose.
            </p>
          </Section>

          <Section titre="Données personnelles et cookies">
            <p>
              Le traitement de vos données et l&apos;usage des cookies sont décrits dans notre{" "}
              <Link href="/politique-confidentialite" className="text-rouge underline hover:text-white transition-colors">
                politique de confidentialité
              </Link>
              . Vous pouvez modifier vos choix de cookies à tout moment depuis le lien « Gérer les cookies » en bas de page.
            </p>
          </Section>

          <Section titre="Médiation de la consommation">
            <p>
              Conformément aux articles L. 611-1 et suivants du Code de la consommation, tout consommateur a le droit de recourir gratuitement à un
              médiateur de la consommation en vue de la résolution amiable d&apos;un litige l&apos;opposant à un professionnel. Après une réclamation
              écrite restée sans réponse satisfaisante sous deux mois, vous pouvez saisir le médiateur désigné ci-dessous.
            </p>
            <p className="text-sm text-gris-500">[À compléter après adhésion : nom du médiateur, adresse postale et site de saisie en ligne.]</p>
            <p>
              Vous pouvez également utiliser la plateforme européenne de règlement en ligne des litiges :{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-rouge underline hover:text-white transition-colors">
                ec.europa.eu/consumers/odr
              </a>
              .
            </p>
          </Section>

          <Section titre="Conditions de vente et droit applicable">
            <p>
              Les prestations proposées sont soumises à nos{" "}
              <Link href="/cgv" className="text-rouge underline hover:text-white transition-colors">
                conditions générales de vente
              </Link>
              . Le site et les présentes mentions sont régis par le droit français.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
