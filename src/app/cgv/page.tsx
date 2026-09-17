import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { ACOMPTE_POURCENT, DELAI_REPONSE, GARANTIE_ANS, GARANTIE_ETENDUE_ANS } from "@/lib/offre";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description:
    "Conditions générales de vente de CoverSwap : devis, commande, prix, exécution, paiement, droit de rétractation, garanties, médiation.",
  alternates: { canonical: "https://coverswap.fr/cgv" },
  robots: { index: true, follow: true },
};

const MISE_A_JOUR = "17 septembre 2026";

function Article({ numero, titre, children }: { numero: number; titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-white">
        Article {numero} — {titre}
      </h2>
      {children}
    </section>
  );
}

export default function CGV() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container-custom max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-2">Conditions générales de vente</h1>
        <p className="text-sm text-gris-500 mb-10">Dernière mise à jour : {MISE_A_JOUR}</p>

        <div className="space-y-10 text-gris-300 leading-relaxed">
          <Article numero={1} titre="Objet et champ d'application">
            <p>
              Les présentes conditions régissent les prestations de rénovation intérieure par pose de revêtements adhésifs (films Cover Styl&apos;)
              réalisées par <strong className="text-white">{SITE.owner}</strong>, entrepreneur individuel exerçant sous le nom CoverSwap
              (SIRET {SITE.siret}, {SITE.address}), ci-après « le prestataire », au profit de tout client, particulier ou professionnel. Toute
              commande implique l&apos;acceptation sans réserve de ces conditions, remises avec le devis.
            </p>
          </Article>

          <Article numero={2} titre="Devis">
            <p>
              Tout devis est gratuit et sans engagement. Il est établi à partir des informations, photos et, si nécessaire, de la visite sur
              place, et transmis {DELAI_REPONSE} après réception des éléments. Il détaille les surfaces, les références choisies, la fourniture,
              la pose, les éventuels frais de déplacement et le délai prévisionnel d&apos;intervention. Un devis est valable{" "}
              <strong className="text-white">30 jours</strong> à compter de sa date d&apos;émission.
            </p>
            <p>
              Les rendus du simulateur en ligne sont des illustrations indicatives ; seuls le devis et les échantillons présentés font foi
              quant aux références et à l&apos;aspect final.
            </p>
          </Article>

          <Article numero={3} titre="Commande">
            <p>
              La commande est ferme à réception du devis daté et signé « bon pour accord » et du versement de l&apos;acompte de{" "}
              <strong className="text-white">{ACOMPTE_POURCENT} %</strong> du montant total. Les films sont commandés auprès du fabricant après
              cet acompte ; toute modification de référence après commande peut entraîner un surcoût et un nouveau délai.
            </p>
          </Article>

          <Article numero={4} titre="Prix et paiement">
            <p>
              Les prix sont exprimés en euros. Le prestataire relève de la franchise en base de TVA : « TVA non applicable, article 293 B du
              CGI ». Le solde est payable à la fin de l&apos;intervention, à réception de la facture, par virement, chèque ou espèces dans les
              limites légales. Pour un client professionnel, tout retard de paiement entraîne de plein droit des pénalités égales à trois fois le
              taux d&apos;intérêt légal et une indemnité forfaitaire de 40 € pour frais de recouvrement (art. L. 441-10 du Code de commerce). Pour
              un consommateur, des intérêts au taux légal sont dus à compter de la mise en demeure restée infructueuse.
            </p>
          </Article>

          <Article numero={5} titre="Délais et exécution">
            <p>
              La date d&apos;intervention est convenue avec le client à la commande, sous réserve de la disponibilité des films chez le fabricant.
              La plupart des cuisines et salles de bain courantes sont posées en une journée ; le devis précise la durée prévue. Un retard
              dû au fabricant, à un cas de force majeure ou au fait du client (accès impossible, surfaces non préparées) ne donne pas lieu à
              indemnité ; le client en est informé sans délai et une nouvelle date lui est proposée.
            </p>
            <p>
              Le client s&apos;engage à donner accès aux lieux à la date convenue, à libérer et dégager les surfaces à couvrir, et à signaler tout
              défaut connu du support (humidité, décollement, peinture instable). Le prestataire nettoie et dégraisse les surfaces avant la
              pose ; les réparations lourdes du support ne sont pas comprises sauf mention au devis.
            </p>
          </Article>

          <Article numero={6} titre="Réception">
            <p>
              À la fin de l&apos;intervention, le client et le prestataire vérifient ensemble les finitions. Les réserves éventuelles sont notées
              par écrit et levées dans les meilleurs délais. En l&apos;absence de réserve, la réception est réputée acquise sans réserve.
            </p>
          </Article>

          <Article numero={7} titre="Droit de rétractation (consommateurs)">
            <p>
              Lorsque le devis est signé à distance ou hors établissement (à votre domicile, par exemple), vous disposez d&apos;un délai de{" "}
              <strong className="text-white">14 jours</strong> à compter de la signature pour vous rétracter sans motif, en nous adressant une
              déclaration dénuée d&apos;ambiguïté (courrier ou e-mail à {SITE.email}) ou le formulaire ci-dessous. L&apos;acompte vous est alors
              remboursé sous 14 jours.
            </p>
            <p>
              Si vous souhaitez que l&apos;intervention commence avant la fin de ce délai, vous devez nous le demander expressément par écrit ; en
              cas de rétractation après le début des travaux, le prix des prestations déjà réalisées et des films commandés à votre demande
              reste dû. Le droit de rétractation ne s&apos;applique pas aux films découpés sur mesure ni aux travaux entièrement exécutés avec votre
              accord exprès avant la fin du délai (art. L. 221-28 du Code de la consommation).
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-sm">
              <p className="font-semibold text-white mb-2">Formulaire de rétractation</p>
              <p>
                À l&apos;attention de CoverSwap — {SITE.owner}, {SITE.address}, {SITE.email} : je vous notifie par la présente ma rétractation
                du contrat portant sur la prestation ci-dessous. Devis n° … signé le … — Nom : … — Adresse : … — Date : … — Signature (si envoi
                papier).
              </p>
            </div>
          </Article>

          <Article numero={8} titre="Garanties">
            <p>
              Les films Cover Styl&apos; et leur pose sont garantis <strong className="text-white">{GARANTIE_ANS} ans</strong> contre le
              décollement et la décoloration en usage normal ; certaines références haute température bénéficient d&apos;une garantie fabricant
              étendue à {GARANTIE_ETENDUE_ANS} ans, précisée au devis. Sont exclus : les dommages mécaniques (coupures, chocs, objets brûlants
              posés directement), l&apos;usage de produits abrasifs ou solvants, les défauts du support signalés au devis, et toute intervention
              d&apos;un tiers sur le revêtement.
            </p>
            <p>
              Ces garanties s&apos;ajoutent aux garanties légales : garantie des vices cachés (art. 1641 et suivants du Code civil) et
              responsabilité du prestataire pour les dommages causés par son intervention, couverte par son assurance professionnelle dont les
              références figurent au devis et à la facture.
            </p>
          </Article>

          <Article numero={9} titre="Responsabilité">
            <p>
              Le prestataire est tenu d&apos;une obligation de moyens quant au résultat esthétique, apprécié au regard des échantillons validés.
              De légères différences de teinte entre échantillon, rendu simulé et pose finale sont possibles et ne constituent pas un défaut.
              La responsabilité du prestataire est limitée au montant de la prestation concernée, sauf faute lourde ou dommage corporel.
            </p>
          </Article>

          <Article numero={10} titre="Données personnelles">
            <p>
              Les données nécessaires au devis et à l&apos;intervention sont traitées comme décrit dans notre{" "}
              <Link href="/politique-confidentialite" className="text-rouge underline hover:text-white transition-colors">
                politique de confidentialité
              </Link>
              . Les photos du chantier ne sont jamais publiées sans votre accord écrit.
            </p>
          </Article>

          <Article numero={11} titre="Médiation et litiges">
            <p>
              En cas de réclamation, écrivez d&apos;abord à {SITE.email}. Sans réponse satisfaisante sous deux mois, un consommateur peut saisir
              gratuitement le médiateur de la consommation indiqué dans nos{" "}
              <Link href="/mentions-legales" className="text-rouge underline hover:text-white transition-colors">
                mentions légales
              </Link>
              , ou la plateforme européenne de règlement en ligne des litiges. À défaut d&apos;accord amiable, le litige relève des tribunaux
              français compétents selon les règles de droit commun ; pour un client professionnel, le tribunal de commerce de Montpellier est
              seul compétent.
            </p>
          </Article>

          <Article numero={12} titre="Droit applicable">
            <p>Les présentes conditions sont soumises au droit français. Elles peuvent être modifiées ; la version applicable est celle remise avec le devis.</p>
          </Article>
        </div>
      </div>
    </div>
  );
}
