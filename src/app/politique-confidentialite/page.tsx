import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";
import { metadonneesPage } from "@/lib/metadonnees";
import OppositionMesure from "@/components/OppositionMesure";

export const metadata: Metadata = {
  ...metadonneesPage({
    titre: "Politique de confidentialité | CoverSwap",
    description: "Comment CoverSwap collecte, utilise et protège vos données personnelles : demandes de devis, simulations, photos, cookies, sous-traitants, droits RGPD.",
    chemin: "/politique-confidentialite",
  }),
  robots: { index: true, follow: true },
};

const MISE_A_JOUR = "30 septembre 2026";

function Section({ titre, id, children }: { titre: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="titre-2 text-encre">{titre}</h2>
      {children}
    </section>
  );
}

const SOUS_TRAITANTS: { nom: string; role: string; lieu: string }[] = [
  { nom: "Vercel Inc.", role: "hébergement du site et exécution des formulaires", lieu: "États-Unis (données servies depuis l'Europe)" },
  { nom: "Railway Corp.", role: "hébergement de notre outil de gestion des demandes (fiches, photos, simulations)", lieu: "centre de données dans l'Union européenne" },
  { nom: "OpenAI, L.L.C.", role: "analyse de votre photo (surfaces de la pièce) et génération du rendu du simulateur", lieu: "États-Unis" },
  { nom: "Anthropic, PBC", role: "aide à la rédaction de nos réponses à vos e-mails (seules les informations utiles à la réponse lui sont transmises)", lieu: "États-Unis" },
  { nom: "Google Ireland Ltd (Gmail, Google Drive)", role: "notre messagerie (vos e-mails et nos réponses) et la copie de sauvegarde de vos documents", lieu: "Irlande / États-Unis" },
  { nom: "Resend, Inc.", role: "envoi des e-mails de notification et de secours", lieu: "États-Unis" },
  { nom: "Meta Platforms Ireland Ltd", role: "mesure de nos publicités Facebook et Instagram : quand votre demande avance, notre outil de gestion lui transmet l'étape franchie et son montant, rattachés à votre demande par vos coordonnées sous forme hachée (voir le tableau ci-dessus). Aucun traceur Meta sur le site", lieu: "Irlande / États-Unis" },
  { nom: "Cloudflare, Inc. (Turnstile)", role: "protection du simulateur et des formulaires contre les robots", lieu: "États-Unis" },
];

export default function PolitiqueConfidentialite() {
  return (
    <div className="bg-fond px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
      <div className="mx-auto max-w-3xl">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Politique de confidentialité", href: "/politique-confidentialite" }]} />
        <h1 className="titre-1 mb-2 text-encre">Politique de confidentialité</h1>
        <p className="mb-10 text-[14px] text-encre-2">Dernière mise à jour : {MISE_A_JOUR}</p>

        <div className="texte space-y-10 text-encre-2">
          <Section titre="Qui est responsable de vos données ?">
            <p>
              Le responsable du traitement est <strong className="text-encre">{SITE.owner}</strong>, entrepreneur individuel (CoverSwap),{" "}
              {SITE.address}. Pour toute question sur vos données : {SITE.email} ou {SITE.phone}.
            </p>
          </Section>

          <Section titre="Quelles données, pour quoi faire, sur quelle base ?">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-encre-2 border-b border-trait">
                    <th className="py-2 pr-4 font-medium">Données</th>
                    <th className="py-2 pr-4 font-medium">Finalité</th>
                    <th className="py-2 font-medium">Base légale</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  <tr className="border-b border-trait">
                    <td className="py-2 pr-4">Nom, téléphone, e-mail, ville, code postal, message</td>
                    <td className="py-2 pr-4">Répondre à votre demande de devis ou de contact, vous rappeler, établir le devis</td>
                    <td className="py-2">Mesures précontractuelles à votre demande</td>
                  </tr>
                  <tr className="border-b border-trait">
                    <td className="py-2 pr-4">Photos de votre intérieur (formulaire ou simulateur)</td>
                    <td className="py-2 pr-4">Comprendre les surfaces à couvrir, produire le rendu du simulateur, préparer le devis</td>
                    <td className="py-2">Mesures précontractuelles à votre demande</td>
                  </tr>
                  <tr className="border-b border-trait">
                    <td className="py-2 pr-4">Choix de références, rendu généré, date et heure de la demande</td>
                    <td className="py-2 pr-4">Retrouver votre projet lorsque nous vous rappelons</td>
                    <td className="py-2">Intérêt légitime (suivi de votre demande)</td>
                  </tr>
                  <tr className="border-b border-trait">
                    <td className="py-2 pr-4">Votre accord pour recevoir nos e-mails (case cochée, texte, date)</td>
                    <td className="py-2 pr-4">Vous envoyer conseils, nouveautés et offres, et prouver votre accord</td>
                    <td className="py-2">Consentement, retirable à tout moment</td>
                  </tr>
                  <tr className="border-b border-trait">
                    <td className="py-2 pr-4">Adresse IP au moment de l&apos;envoi</td>
                    <td className="py-2 pr-4">Limiter les envois automatisés et protéger les formulaires</td>
                    <td className="py-2">Intérêt légitime (sécurité)</td>
                  </tr>
                  <tr className="border-b border-trait">
                    <td className="py-2 pr-4">
                      Pages vues et étapes du simulateur, avec la provenance de la visite (site d&apos;où vous venez, campagne) et le fuseau horaire
                      de votre navigateur (sans cookie, sans nom ni coordonnées)
                    </td>
                    <td className="py-2 pr-4">
                      Mesurer l&apos;audience du site pour notre seul compte : compter les visites, voir d&apos;où elles viennent et où le parcours
                      s&apos;arrête, pour améliorer le site
                    </td>
                    <td className="py-2">Intérêt légitime (mesure d&apos;audience, exemptée de consentement ; vous pouvez vous y opposer)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      Quand votre demande avance (devis envoyé, signé, réglé ou sans suite) : l&apos;étape, le montant, et votre e-mail, téléphone,
                      nom, ville et code postal sous forme hachée (illisibles en clair) ; si votre demande vient d&apos;un formulaire Facebook ou
                      Instagram, son identifiant Meta
                    </td>
                    <td className="py-2 pr-4">Mesurer l&apos;efficacité de nos publicités : transmis à Meta par notre outil de gestion, jamais par le site</td>
                    <td className="py-2">Intérêt légitime (mesure de nos campagnes)</td>
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
              prestataires techniques listés ci-dessous. Pour le simulateur, votre photo est transmise à OpenAI le temps de l&apos;analyser et
              de produire le rendu ;
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
                  <strong className="text-encre">{s.nom}</strong> — {s.role} — {s.lieu}
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
              <li>
                Identifiant de parcours sur votre appareil : le temps de l&apos;onglet ouvert ; si vous utilisez le simulateur, 7 jours au plus
                depuis le début de votre parcours, jamais prolongés, puis effacé avec votre photo et vos choix.
              </li>
              <li>
                Pages vues et étapes du simulateur dans notre outil de gestion (page, provenance, visiteur du jour, type d&apos;appareil, pays) :
                25 mois, puis supprimées.
              </li>
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
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-encre underline underline-offset-4 hover:text-encre-2">
                cnil.fr
              </a>
              ).
            </p>
          </Section>

          <Section titre="Mesure d'audience" id="mesure-audience">
            <p>
              Nous mesurons l&apos;audience du site nous-mêmes, pour notre seul compte, sans cookie ni outil tiers ; pour compter les
              visites, rien n&apos;est gardé sur votre appareil. Cette mesure est exemptée de consentement (recommandations de la CNIL) : elle ne
              sert qu&apos;à produire des statistiques anonymes et aucune de ses données ne quitte notre outil de gestion.
            </p>
            <p>
              À chaque page vue et à chaque étape du simulateur, votre navigateur envoie à notre outil de gestion : la page, le site
              d&apos;où vous venez (son nom seulement, par exemple « google.com »), la campagne qui vous a amené s&apos;il y en a une, le
              fuseau horaire de votre navigateur, et l&apos;identifiant de parcours de l&apos;onglet, qui relie les étapes du simulateur entre
              elles.
            </p>
            <p>
              Notre outil de gestion en tire, à la réception : un visiteur du jour, empreinte calculée à partir de votre adresse IP tronquée
              et de votre navigateur, mélangés à une valeur aléatoire renouvelée et détruite chaque jour, qui compte une visite sans vous
              reconnaître d&apos;un jour à l&apos;autre ; le type d&apos;appareil (téléphone, tablette ou ordinateur) ; le pays, déduit du
              fuseau horaire, sans géolocalisation. Votre adresse IP et le détail de votre navigateur ne sont jamais conservés. Ces
              statistiques sont gardées 25 mois.
            </p>
            <p>
              Si vous nous envoyez une demande, sa provenance (site d&apos;où vous venez, campagne, page d&apos;arrivée) y est jointe pour
              savoir comment vous nous avez connus : cela relève du suivi de votre demande.
            </p>
            <p>
              Vous pouvez vous opposer à cette mesure : ce bouton retient votre refus dans le stockage local de votre navigateur (rien
              d&apos;autre, et rien n&apos;est envoyé), et plus aucune page vue ni étape n&apos;est alors transmise depuis ce navigateur. Le
              signal Global Privacy Control, s&apos;il est activé dans votre navigateur, vaut le même refus.
            </p>
            <OppositionMesure />
          </Section>

          <Section titre="Cookies et stockage sur votre appareil">
            <p>
              Le site ne dépose aucun cookie de mesure d&apos;audience ni de publicité et ne charge aucun traceur tiers : il n&apos;y a donc
              pas de bandeau cookies. L&apos;onglet garde, jusqu&apos;à sa fermeture, la provenance de votre arrivée et un identifiant de
              parcours tiré au hasard, qui relie les étapes du simulateur entre elles et à votre éventuelle demande.
            </p>
            <p>
              Le simulateur garde votre photo, vos choix et vos rendus dans le stockage de votre navigateur (IndexedDB), pour que vous
              retrouviez votre parcours : 7 jours au plus, puis tout est effacé et un nouveau parcours commence.
              Vos matières favorites (simulateur et page Matières) restent dans son stockage local, comme votre refus de la mesure
              d&apos;audience si vous l&apos;avez exprimé.
            </p>
            <p>
              Votre photo part vers notre outil de gestion dès que vous la choisissez : il y repère les surfaces de la pièce, et la convertit
              si votre téléphone l&apos;a enregistrée en HEIC. Vos choix de matières partent quand vous lancez une simulation ou envoyez une demande.
            </p>
            <p>
              Cloudflare Turnstile ne sert qu&apos;à protéger le simulateur et nos formulaires des robots. Il est chargé au premier geste dans
              un formulaire, et aux étapes du simulateur qui s&apos;adressent à notre serveur (choix des matières, résultat).
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
              <Link href="/mentions-legales" className="text-encre underline underline-offset-4 hover:text-encre-2">
                mentions légales
              </Link>{" "}
              et les{" "}
              <Link href="/cgv" className="text-encre underline underline-offset-4 hover:text-encre-2">
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
