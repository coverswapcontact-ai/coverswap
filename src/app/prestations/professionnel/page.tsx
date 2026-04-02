import type { Metadata } from "next";
import Link from "next/link";
import TextureBackground from "@/components/TextureBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { FAQSchema, ServiceSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Covering Professionnel | Comptoirs, Restaurants, Hôtels & Bureaux",
  description:
    "Rénovez vos locaux professionnels sans fermer. Comptoirs de bar, réceptions, bureaux, hôtels. Covering adhésif posé en 1 nuit. Personnalisation aux couleurs de votre marque.",
  keywords:
    "covering professionnel, habillage comptoir bar, covering restaurant, rénovation hôtel adhésif, covering bureau, film adhésif professionnel",
};

const secteurs = [
  {
    title: "Restaurants & bars",
    description:
      "Comptoirs de bar, tables, mobilier de salle, banquettes : relookez votre établissement pour renouveler l'expérience client sans fermer un seul service.",
  },
  {
    title: "Hôtels",
    description:
      "Têtes de lit, meubles de chambre, réceptions, lobbies : modernisez vos espaces nuit après nuit, étage par étage, sans déranger vos clients.",
  },
  {
    title: "Bureaux & coworking",
    description:
      "Postes de travail, cloisons, tables de réunion, accueils : créez un environnement professionnel inspirant à moindre coût.",
  },
  {
    title: "Commerces & boutiques",
    description:
      "Comptoirs de caisse, présentoirs, étagères, murs d'accent : renforcez votre identité visuelle en magasin avec un covering personnalisé.",
  },
  {
    title: "Établissements de santé",
    description:
      "Mobilier, murs, portes, banques d'accueil : des revêtements certifiés, antibactériens et faciles à désinfecter pour les environnements médicaux.",
  },
  {
    title: "Établissements scolaires",
    description:
      "Tables, bureaux, casiers, portes de salles : des films ultra-résistants aux chocs et graffitis pour un mobilier toujours impeccable.",
  },
];

const avantages = [
  { title: "Pose de nuit ou weekend", description: "Nos équipes interviennent en dehors de vos heures d'ouverture pour un impact zéro sur votre activité." },
  { title: "0 interruption d'activité", description: "Aucune fermeture nécessaire. Votre chiffre d'affaires n'est jamais impacté pendant les travaux." },
  { title: "Conforme normes ERP", description: "Films classés M1/B1 (difficilement inflammables), conformes à la réglementation des établissements recevant du public." },
  { title: "Personnalisation logo/marque", description: "Impression numérique haute définition pour intégrer vos couleurs, votre logo et votre charte graphique." },
  { title: "Résistant usage intensif", description: "Films anti-rayures, anti-traces et résistants aux produits d'entretien professionnels les plus courants." },
  { title: "Devis sous 48h", description: "Audit sur site gratuit et devis détaillé envoyé en 48 heures maximum pour ne pas ralentir vos projets." },
  { title: "Garantie 10 ans pro", description: "Tous nos revêtements professionnels sont garantis 10 ans contre le décollement et l'usure prématurée." },
  { title: "-70% vs mobilier neuf", description: "Le covering coûte en moyenne 70% de moins que le remplacement complet de votre mobilier professionnel." },
];

const steps = [
  {
    num: "01",
    title: "Audit sur site",
    description:
      "Un expert CoverSwap se déplace gratuitement pour évaluer les surfaces, prendre les mesures et comprendre vos contraintes d'exploitation.",
  },
  {
    num: "02",
    title: "Devis & maquette",
    description:
      "Vous recevez un rendu visuel personnalisé aux couleurs de votre marque et un devis détaillé sous 48 heures.",
  },
  {
    num: "03",
    title: "Pose planifiée hors heures",
    description:
      "L'intervention est programmée de nuit, le weekend ou pendant vos périodes creuses. Aucune interruption d'activité.",
  },
  {
    num: "04",
    title: "Réception & garantie",
    description:
      "Vérification minutieuse des finitions avec vous, remise du certificat de garantie 10 ans et conseils d'entretien.",
  },
];

const comparatif = [
  { critere: "Prix moyen", covering: "À partir de 40 EUR/m2", remplacement: "150 à 400 EUR/m2" },
  { critere: "Délai", covering: "1 à 3 nuits", remplacement: "2 à 6 semaines" },
  { critere: "Fermeture nécessaire", covering: "Non", remplacement: "Oui, souvent plusieurs jours" },
  { critere: "Personnalisation", covering: "Illimitée (couleurs RAL, logos, motifs)", remplacement: "Limitée au catalogue fabricant" },
  { critere: "Durabilité", covering: "7 à 10 ans garantis", remplacement: "10 à 15 ans" },
  { critere: "Impact écologique", covering: "Faible (pas de déchets lourds)", remplacement: "Élevé (mise en décharge)" },
];

const faqs = [
  {
    q: "Peut-on covering un comptoir de bar en activité ?",
    a: "Oui. Nous intervenons systématiquement en dehors des heures d'ouverture : de nuit, tôt le matin ou le dimanche. Votre bar reste opérationnel à 100% pendant toute la durée du projet. Le comptoir est prêt à l'emploi dès la réouverture.",
  },
  {
    q: "Le covering résiste-t-il à l'usage intensif d'un restaurant ?",
    a: "Absolument. Nos films professionnels sont spécifiquement conçus pour les environnements à fort passage. Ils résistent aux rayures, aux chocs, aux taches alimentaires et aux nettoyages répétés. Garantie 10 ans en usage professionnel.",
  },
  {
    q: "La pose peut-elle se faire de nuit ?",
    a: "C'est même notre spécialité. Plus de 60% de nos chantiers professionnels sont réalisés entre 21h et 6h du matin. Nos poseurs sont formés et équipés pour travailler dans ces conditions sans compromettre la qualité.",
  },
  {
    q: "Le covering est-il conforme aux normes ERP ?",
    a: "Oui. Tous nos films sont classés M1/B1 (difficilement inflammables) conformément à la réglementation des établissements recevant du public. Nous fournissons les certificats de conformité nécessaires pour vos contrôles de sécurité.",
  },
  {
    q: "Peut-on intégrer notre logo sur le covering ?",
    a: "Bien sûr. Grâce à l'impression numérique haute définition, nous intégrons votre logo, vos couleurs RAL exactes et tout élément de votre charte graphique directement dans le revêtement. Idéal pour uniformiser l'image de marque sur plusieurs établissements.",
  },
  {
    q: "Quel est le délai pour un projet professionnel ?",
    a: "Comptez 48h pour l'audit et le devis, puis 5 à 10 jours ouvrés pour la fabrication des films sur-mesure. La pose elle-même prend généralement 1 à 3 nuits selon la surface. Au total, votre projet est finalisé en 2 à 3 semaines.",
  },
  {
    q: "Le covering résiste-t-il aux produits d'entretien professionnels ?",
    a: "Oui. Nos films supportent les détergents, dégraissants et désinfectants utilisés en restauration et hôtellerie. Ils sont également compatibles avec les protocoles de nettoyage HACCP. Seuls les solvants agressifs (acétone pure) sont déconseillés.",
  },
  {
    q: "Quelle garantie pour un covering professionnel ?",
    a: "Nous offrons une garantie professionnelle de 10 ans couvrant le décollement, le bullage et l'usure prématurée. En cas de dommage accidentel localisé, nous pouvons remplacer uniquement la zone concernée sans refaire l'ensemble.",
  },
];

export default function ProfessionnelPage() {
  return (
    <main className="bg-noir min-h-screen">
      <ServiceSchema
        name="Covering Professionnel"
        description="Rénovation de locaux professionnels par covering adhésif : restaurants, hôtels, bureaux, commerces. Pose de nuit ou weekend, zéro interruption d'activité."
        url="https://coverswap.fr/prestations/professionnel"
      />
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Prestations", url: "https://coverswap.fr/prestations" }, { name: "Covering Professionnel", url: "https://coverswap.fr/prestations/professionnel" }]} />

      {/* Hero */}
      <section className="relative section-padding pt-40 overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1767022724924-993b00fc04b3?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.80)"
          fadeTop={false}
          fadeBottom
        />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-rouge/5 blur-[100px]" />
        <div className="container-custom relative z-20">
          <Link
            href="/prestations"
            className="inline-flex items-center gap-2 text-gris-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Toutes les prestations
          </Link>
          <ScrollReveal>
            <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">
              Covering Professionnel
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight max-w-4xl">
              Rénovez vos locaux professionnels{" "}
              <span className="text-rouge">sans fermer un seul jour</span>
            </h1>
            <p className="text-gris-300 text-lg max-w-2xl leading-relaxed mb-10">
              Comptoirs, réceptions, mobilier de bureau, chambres d&apos;hôtel.
              Covering adhésif posé de nuit ou en weekend. 0 interruption
              d&apos;activité.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/simulation" className="btn-primary">
                Demander un audit gratuit
              </Link>
              <Link href="/realisations" className="btn-secondary">
                Voir les réalisations
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Secteurs d'activité */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Une solution pour <span className="text-rouge">chaque secteur</span>
            </h2>
            <p className="text-gris-400 text-center max-w-2xl mx-auto mb-16">
              Quel que soit votre domaine d&apos;activité, le covering adhésif
              s&apos;adapte à vos contraintes et à vos exigences de qualité.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {secteurs.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 0.1}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 h-full">
                  <h3 className="font-display text-lg font-bold mb-3 text-rouge">
                    {s.title}
                  </h3>
                  <p className="text-gris-400 text-sm leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages pro */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1682888813913-e13f18692019?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Pourquoi les pros choisissent{" "}
              <span className="text-rouge">CoverSwap</span>
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantages.map((a, i) => (
              <ScrollReveal key={a.title} delay={i * 0.08}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 h-full">
                  <h3 className="font-display text-base font-bold mb-2">
                    {a.title}
                  </h3>
                  <p className="text-gris-400 text-sm leading-relaxed">
                    {a.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Personnalisation */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
                Aux couleurs de <span className="text-rouge">votre marque</span>
              </h2>
              <p className="text-gris-300 leading-relaxed mb-4">
                Votre identité visuelle est un atout stratégique. Le covering
                adhésif vous permet de la décliner sur toutes les surfaces de
                vos locaux : comptoirs, murs d&apos;accent, mobilier,
                signalétique intérieure.
              </p>
              <p className="text-gris-300 leading-relaxed mb-4">
                Grâce à notre technologie d&apos;impression numérique haute
                définition, nous reproduisons fidèlement vos couleurs RAL ou
                Pantone, intégrons votre logo et vos motifs graphiques
                directement dans le revêtement.
              </p>
              <p className="text-gris-300 leading-relaxed mb-6">
                Vous gérez plusieurs établissements ? Le covering garantit une
                cohérence visuelle parfaite entre tous vos sites, pour une image
                de marque homogène à l&apos;échelle nationale.
              </p>
              <ul className="space-y-3">
                {[
                  "Correspondance exacte de vos couleurs RAL / Pantone",
                  "Intégration logo et charte graphique",
                  "Cohérence multi-sites garantie",
                  "Motifs et textures sur-mesure",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gris-300">
                    <svg className="w-5 h-5 text-rouge shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="glass-card p-8 bg-rouge/5 border-rouge/20">
                <h3 className="font-display text-xl font-bold mb-4">
                  Le saviez-vous ?
                </h3>
                <p className="text-gris-300 leading-relaxed mb-4">
                  Un environnement professionnel cohérent avec votre marque
                  augmente la reconnaissance client de 80% et renforce la
                  confiance envers votre établissement.
                </p>
                <p className="text-gris-300 leading-relaxed">
                  Avec CoverSwap, vous pouvez rafraîchir l&apos;image de vos
                  locaux aussi souvent que vous le souhaitez, à une fraction du
                  coût d&apos;une rénovation traditionnelle. Idéal pour suivre
                  les tendances ou les évolutions de votre identité visuelle.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Processus 4 étapes */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1758448721205-8465cebc26af?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Notre <span className="text-rouge">processus</span> en 4 étapes
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <ScrollReveal key={s.num} delay={i * 0.15}>
                <div className="glass-card p-8 relative h-full">
                  <span className="text-rouge/20 font-display text-6xl font-bold absolute top-4 right-6">
                    {s.num}
                  </span>
                  <h3 className="font-display text-xl font-bold mb-3 mt-4">
                    {s.title}
                  </h3>
                  <p className="text-gris-400 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparatif */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Covering pro vs{" "}
              <span className="text-rouge">remplacement mobilier</span>
            </h2>
            <p className="text-gris-400 text-center max-w-2xl mx-auto mb-12">
              Comparez les deux options pour prendre la meilleure décision
              pour votre établissement.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-blanc/10">
                      <th className="p-4 font-display text-sm uppercase tracking-wider text-gris-400">
                        Critère
                      </th>
                      <th className="p-4 font-display text-sm uppercase tracking-wider text-rouge">
                        Covering CoverSwap
                      </th>
                      <th className="p-4 font-display text-sm uppercase tracking-wider text-gris-400">
                        Remplacement mobilier
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparatif.map((row) => (
                      <tr
                        key={row.critere}
                        className="border-b border-blanc/5 last:border-0"
                      >
                        <td className="p-4 font-bold text-sm">{row.critere}</td>
                        <td className="p-4 text-sm text-gris-300">
                          {row.covering}
                        </td>
                        <td className="p-4 text-sm text-gris-400">
                          {row.remplacement}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Catalogue CTA */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <Link href="/revetements" className="block glass-card p-10 border-rouge/20 bg-rouge/5 hover:border-rouge/40 transition-all duration-300 group">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-rouge/10 flex items-center justify-center shrink-0 group-hover:bg-rouge/20 transition-colors">
                  <svg className="w-8 h-8 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                </div>
                <div className="text-center lg:text-left flex-1">
                  <h3 className="font-display text-2xl font-bold mb-2">
                    Consultez notre catalogue complet pour <span className="text-rouge">vos projets professionnels</span>
                  </h3>
                  <p className="text-gris-400 leading-relaxed">
                    497 references Cover Styl&apos; disponibles, dont des finitions personnalisables aux couleurs de votre marque. Comptoirs, murs, mobilier : trouvez la texture adaptee a votre secteur.
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-2 text-rouge font-semibold group-hover:gap-3 transition-all">
                    Voir le catalogue
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1742490382029-98357c08f3cd?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20 max-w-3xl">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">
              Questions <span className="text-rouge">fréquentes</span>
            </h2>
          </ScrollReveal>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <ScrollReveal key={faq.q} delay={i * 0.05}>
                <details className="glass-card p-6 group cursor-pointer">
                  <summary className="flex items-center justify-between font-display font-bold text-lg list-none">
                    {faq.q}
                    <svg
                      className="w-5 h-5 text-rouge shrink-0 group-open:rotate-45 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </summary>
                  <p className="text-gris-400 mt-4 leading-relaxed">{faq.a}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <ScrollReveal>
            <div className="glass-card p-12 border-rouge/20 bg-rouge/5">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Un projet professionnel ?
              </h2>
              <p className="text-gris-300 text-lg mb-8 max-w-xl mx-auto">
                Audit gratuit sur site, devis sous 48h, pose planifiée hors
                heures d&apos;ouverture. Transformez vos locaux sans perdre un
                jour de chiffre d&apos;affaires.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/simulation" className="btn-primary text-lg px-10 py-5">
                  Demander un audit gratuit
                </Link>
                <Link href="/contact" className="btn-secondary text-lg px-10 py-5">
                  Nous contacter
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
