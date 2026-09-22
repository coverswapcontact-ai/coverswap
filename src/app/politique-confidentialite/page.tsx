import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment CoverSwap collecte, utilise et protège vos données personnelles : demandes de devis, simulations, photos, cookies, sous-traitants, droits RGPD.",
  alternates: { canonical: "https://coverswap.fr/politique-confidentialite" },
  robots: { index: true, follow: true },
};

const MISE_A_JOUR = "22 septembre 2026";

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-white">{titre}</h2>
      {children}
    </section>
  );
}

const SOUS_TRAITANTS: { nom: string; role: string; lieu: string }[] = [
  { nom: "Vercel Inc.", role: "hébergement du site et exécution des formulaires", lieu: "États-Unis (données servies depuis l'Europe)" },
  { nom: "Railway Corp.", role: "hébergement de notre outil de gestion des demandes (fiches, photos, simulations)", lieu: "centre de données dans l'Union européenne" },
  { nom: "OpenAI, L.L.C.", role: "génération du rendu du simulateur à partir de votre photo", lieu: "États-Unis" },
  { nom: "Anthropic, PBC", role: "aide à la rédaction de nos réponses à vos e-mails (seules les informations utiles à la réponse lui sont transmises)", lieu: "États-Unis" },
  { nom: "Google Ireland Ltd (Gmail, Google Drive)", role: "notre messagerie (vos e-mails et nos réponses) et la copie de sauvegarde de vos documents", lieu: "Irlande / États-Unis" },
  { nom: "Resend, Inc.", role: "envoi des e-mails de notification et de secours", lieu: "États-Unis" },
  { nom: "Google Ireland Ltd (Tag Manager, Analytics)", role: "mesure d'audience, avec votre accord", lieu: "Irlande / États-Unis" },
  { nom: "Meta Platforms Ireland Ltd (pixel)", role: "mesure des campagnes publicitaires, avec votre accord, lorsqu'il est activé", lieu: "Irlande / États-Unis" },
  { nom: "Microsoft Ireland (Clarity)", role: "analyse d'usage anonymisée, avec votre accord, lorsqu'elle est activée", lieu: "Irlande / États-Unis" },
  { nom: "Cloudflare, Inc. (Turnstile)", role: "protection des formulaires contre les robots", lieu: "États-Unis" },
];

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container-custom max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gris-500 mb-10">Dernière mise à jour : {MISE_A_JOUR}</p>

        <div className="space-y-10 text-gris-300 leading-relaxed">
          <Section titre="Qui est responsable de vos données ?">
            <p>
              Le responsable du traitement est <strong className="text-white">{SITE.owner}</strong>, entrepreneur individuel (CoverSwap),{" "}
              {SITE.address}. Pour toute question sur vos données : {SITE.email} ou {SITE.phone}.
            </p>
          </Section>

          <Section titre="Quelles données, pour quoi faire, sur quelle base ?">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-gris-400 border-b border-white/10">
                    <th className="py-2 pr-4 font-medium">Données</th>
                    <th className="py-2 pr-4 font-medium">Finalité</th>
                    <th className="py-2 font-medium">Base légale</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Nom, téléphone, e-mail, ville, code postal, message</td>
                    <td className="py-2 pr-4">Répondre à votre demande de devis ou de contact, vous rappeler, établir le devis</td>
                    <td className="py-2">Mesures précontractuelles à votre demande</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Photos de votre intérieur (formulaire ou simulateur)</td>
                    <td className="py-2 pr-4">Comprendre les surfaces à couvrir, produire le rendu du simulateur, préparer le devis</td>
                    <td className="py-2">Mesures précontractuelles à votre demande</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Choix de références, rendu généré, date et heure de la demande</td>
                    <td className="py-2 pr-4">Retrouver votre projet lorsque nous vous rappelons</td>
                    <td className="py-2">Intérêt légitime (suivi de votre demande)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Votre accord pour recevoir nos e-mails (case cochée, texte, date)</td>
                    <td className="py-2 pr-4">Vous envoyer conseils, nouveautés et offres, et prouver votre accord</td>
                    <td className="py-2">Consentement, retirable à tout moment</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Adresse IP au moment de l&apos;envoi</td>
                    <td className="py-2 pr-4">Limiter les envois automatisés et protéger les formulaires</td>
                    <td className="py-2">Intérêt légitime (sécurité)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Données de navigation (cookies de mesure d&apos;audience et de publicité)</td>
                    <td className="py-2 pr-4">Comprendre l&apos;usage du site et mesurer nos campagnes</td>
                    <td className="py-2">Consentement (bandeau cookies)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Aucune de ces données n&apos;est obligatoire pour consulter le site. Pour une demande de devis, le nom, le téléphone, l&apos;e-mail, la
              ville et le code postal sont nécessaires pour vous répondre. La case d&apos;accord aux e-mails commerciaux est facultative et jamais
              pré-cochée : ne pas la cocher ne change rien au traitement de votre demande.
            </p>
          </Section>

          <Section titre="Vos photos d'intérieur">
            <p>
              Les photos que vous nous confiez montrent votre domicile ou vos locaux. Elles sont stockées dans notre outil de gestion, accessible
              uniquement avec un identifiant et un mot de passe, et ne sont jamais publiées ni transmises à des tiers autres que les
              prestataires techniques listés ci-dessous. Pour le simulateur, votre photo est transmise à OpenAI le temps de produire le rendu ;
              selon les conditions de son API, OpenAI n&apos;utilise pas ces images pour entraîner ses modèles.
            </p>
          </Section>

          <Section titre="Nos échanges par e-mail">
            <p>
              Nous vous écrivons de nous-mêmes à quatre moments : quand votre simulation est prête, quand votre devis est disponible,
              quand nous recevons votre paiement et quand votre chantier est terminé. Ces messages concernent votre projet ; ils ne sont pas
              commerciaux. Une relance, elle, porte toujours un lien de désinscription, et une désinscription est définitive.
            </p>
            <p>
              Pour vous répondre plus vite, nous pouvons nous faire aider d&apos;un assistant de rédaction (Anthropic). Il ne reçoit que ce
              qui est utile à la réponse — votre message, nos échanges précédents, l&apos;état de votre projet —, jamais vos photos. Chaque
              réponse est relue et envoyée par nous. Selon les conditions de son API, Anthropic n&apos;utilise pas ces données pour entraîner
              ses modèles.
            </p>
          </Section>

          <Section titre="Qui a accès à vos données ?">
            <p>Vos données sont traitées par {SITE.owner} et, pour les seuls besoins techniques décrits, par les sous-traitants suivants :</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {SOUS_TRAITANTS.map((s) => (
                <li key={s.nom}>
                  <strong className="text-white">{s.nom}</strong> — {s.role} — {s.lieu}
                </li>
              ))}
            </ul>
            <p>
              Lorsque des données sont transférées hors de l&apos;Union européenne, ce transfert est encadré par les clauses contractuelles types
              de la Commission européenne ou par la décision d&apos;adéquation applicable (Data Privacy Framework pour les prestataires américains
              certifiés). Nous ne vendons ni ne louons vos données.
            </p>
          </Section>

          <Section titre="Combien de temps ?">
            <ul className="list-disc list-inside space-y-1">
              <li>Demandes, simulations et photos sans suite : 3 ans après notre dernier échange, puis anonymisation.</li>
              <li>Devis et factures : 10 ans (obligation comptable), l&apos;identité y restant lisible pendant cette durée.</li>
              <li>Accord aux e-mails commerciaux : jusqu&apos;à son retrait, puis conservé comme preuve 3 ans.</li>
              <li>Adresse IP liée à une demande : 12 mois.</li>
              <li>Cookies : 13 mois au plus ; votre choix est conservé 6 mois.</li>
            </ul>
          </Section>

          <Section titre="Vos droits">
            <p>
              Vous pouvez à tout moment demander l&apos;accès à vos données, leur rectification, leur effacement, la limitation de leur traitement,
              vous opposer à un traitement fondé sur notre intérêt légitime, retirer votre consentement, obtenir la portabilité des données que
              vous nous avez fournies, et définir des directives sur le sort de vos données après votre décès. Écrivez à {SITE.email} ou à
              l&apos;adresse postale ci-dessus ; nous répondons sous un mois. Une pièce d&apos;identité peut vous être demandée en cas de doute sur
              votre identité.
            </p>
            <p>
              Vous pouvez vous désinscrire de nos e-mails par le lien présent en bas de chaque message. Si vous estimez que vos droits ne sont
              pas respectés, vous pouvez introduire une réclamation auprès de la CNIL (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 —{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-rouge underline hover:text-white transition-colors">
                cnil.fr
              </a>
              ).
            </p>
          </Section>

          <Section titre="Cookies et traceurs">
            <p>
              À votre arrivée, seuls les cookies strictement nécessaires au fonctionnement du site sont déposés (mémorisation de votre choix,
              protection anti-robot). Les traceurs de mesure d&apos;audience (Google Tag Manager / Analytics) et de publicité (pixel Meta,
              Microsoft Clarity lorsqu&apos;ils sont activés) ne sont déposés qu&apos;après votre accord dans le bandeau, catégorie par catégorie.
              Refuser n&apos;a aucune conséquence sur l&apos;usage du site. Vous pouvez revenir sur votre choix depuis le lien « Gérer les cookies »
              en bas de chaque page.
            </p>
          </Section>

          <Section titre="Sécurité">
            <p>
              Les échanges avec le site sont chiffrés (HTTPS). Les demandes et photos sont conservées dans un outil accessible uniquement par
              authentification, journalisé, sauvegardé quotidiennement, et dont les accès sont limités à {SITE.owner}. Aucune donnée bancaire
              n&apos;est collectée sur le site.
            </p>
          </Section>

          <Section titre="Mineurs et mise à jour">
            <p>
              Le site s&apos;adresse à des personnes majeures. Cette politique peut évoluer ; la date en haut de page indique sa dernière version.
              Voir aussi les{" "}
              <Link href="/mentions-legales" className="text-rouge underline hover:text-white transition-colors">
                mentions légales
              </Link>{" "}
              et les{" "}
              <Link href="/cgv" className="text-rouge underline hover:text-white transition-colors">
                conditions générales de vente
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
