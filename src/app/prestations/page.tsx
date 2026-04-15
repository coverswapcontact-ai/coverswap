import type { Metadata } from "next";
import Link from "next/link";
import TextureBackground from "@/components/TextureBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { ServiceSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Nos Prestations | Covering Cuisine, Salle de Bain, Meubles & Pro",
  description:
    "Découvrez toutes nos prestations de covering adhésif : cuisine, salle de bain, meubles, locaux professionnels et vitrages. Rénovation intérieure sans travaux, garantie 10 ans.",
  keywords:
    "prestations covering, rénovation adhésive, covering intérieur, services covering, rénovation sans travaux",
};

const services = [
  {
    title: "Covering Cuisine",
    href: "/prestations/cuisine",
    emoji: "\uD83C\uDF73",
    description:
      "Plans de travail, crédences et façades de meubles : nos films Cover Styl' résistent à la chaleur, à l'eau et aux rayures. Finitions bois, marbre ou béton pour un rendu haut de gamme sans démolir votre cuisine.",
    stat: "dès 890\u00A0\u20AC",
    statLabel: "cuisine complète",
    schemaDesc:
      "Covering adhésif pour cuisine : plans de travail, crédences et façades. Films résistants chaleur et eau, finition premium.",
  },
  {
    title: "Covering Salle de Bain",
    href: "/prestations/salle-de-bain",
    emoji: "\uD83D\uDEBF",
    description:
      "Films 100 % waterproof et anti-moisissures pour murs, contours de vasque et parois de douche. Transformez votre salle d'eau en une journée, sans carreleur ni plombier.",
    stat: "pos\u00E9 en 1 journ\u00E9e",
    statLabel: "intervention rapide",
    schemaDesc:
      "Covering adhésif salle de bain : films waterproof anti-moisissures pour murs, vasques et parois de douche.",
  },
  {
    title: "Covering Meubles",
    href: "/prestations/meubles",
    emoji: "\uD83E\uDE91",
    description:
      "Donnez une seconde vie à n'importe quel meuble : commodes, buffets, bibliothèques, dressings. Effets bois, métal brossé ou marbre. Film amovible sans trace, idéal pour les locataires.",
    stat: "d\u00E8s 250\u00A0\u20AC",
    statLabel: "par meuble",
    schemaDesc:
      "Covering adhésif pour meubles : effets bois, métal ou marbre. Film amovible sans trace, durable et esthétique.",
  },
  {
    title: "Covering Professionnel",
    href: "/prestations/professionnel",
    emoji: "\uD83C\uDFE2",
    description:
      "Solutions sur-mesure pour restaurants, hôtels, bureaux et commerces. Installation en dehors des heures d'ouverture pour zéro perte d'exploitation. Large choix de textures professionnelles.",
    stat: "devis sous 48\u00A0h",
    statLabel: "réponse garantie",
    schemaDesc:
      "Covering professionnel pour restaurants, hôtels et bureaux. Installation rapide, large choix de textures.",
  },
  {
    title: "Films pour Vitrages",
    href: "/prestations/vitrages",
    emoji: "\uD83E\uDE9F",
    description:
      "Intimité, décoration, protection solaire et anti-UV : nos films pour vitres s'adaptent à tous les espaces. Réduction de la chaleur jusqu'à 80 %, économies d'énergie et confort toute l'année.",
    stat: "jusqu'\u00E0 \u221280\u00A0% chaleur",
    statLabel: "protection solaire",
    schemaDesc:
      "Films adhésifs pour vitrages : intimité, protection UV, décoration et économies d'énergie pour vitres et baies vitrées.",
  },
];

const trustReasons = [
  {
    icon: "\uD83D\uDEE1\uFE0F",
    title: "Garantie 10 ans",
    description: "Tous nos films sont garantis 10 ans contre le décollement et la décoloration.",
  },
  {
    icon: "\uD83C\uDFC5",
    title: "Poseur certifié",
    description: "Techniciens formés et certifiés Cover Styl' pour une pose irréprochable.",
  },
  {
    icon: "\u2B50",
    title: "Films Cover Styl' premium",
    description: "Marque leader mondial du covering architectural, près de 500 références.",
  },
  {
    icon: "\uD83D\uDCE9",
    title: "Devis gratuit sous 48h",
    description: "Recevez une estimation détaillée et personnalisée en moins de deux jours.",
  },
  {
    icon: "\uD83C\uDDEB\uD83C\uDDF7",
    title: "Intervention France entière",
    description: "Nous nous déplaçons partout en France métropolitaine, sans frais cachés.",
  },
  {
    icon: "\uD83D\uDE4C",
    title: "Artisan spécialisé Cover Styl'",
    description: "Expert en revêtements adhésifs texturés haut de gamme. Finitions soignées, sans sous-traitance.",
  },
];

const steps = [
  {
    number: "01",
    title: "Simulation gratuite",
    description:
      "Décrivez votre projet en ligne ou envoyez-nous des photos. Notre IA vous fournit une estimation en 60 secondes.",
  },
  {
    number: "02",
    title: "Visite technique & devis",
    description:
      "Un technicien se déplace chez vous pour valider les mesures et vous présenter les échantillons de films.",
  },
  {
    number: "03",
    title: "Pose & garantie",
    description:
      "Installation professionnelle en 1 journée. Vous profitez immédiatement du résultat, garanti 10 ans.",
  },
];

export default function PrestationsPage() {
  return (
    <main className="bg-noir min-h-screen">
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Prestations", url: "https://coverswap.fr/prestations" }]} />
      {/* ── JSON-LD ServiceSchema for each service ── */}
      {services.map((s) => (
        <ServiceSchema
          key={s.href}
          name={s.title}
          description={s.schemaDesc}
          url={`https://coverswap.fr${s.href}`}
        />
      ))}

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative section-padding pt-40 overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1639405069836-f82aa6dcb900?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.80)"
          fadeTop={false}
          fadeBottom
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rouge/5 blur-[100px]" />

        <div className="container-custom relative z-20 text-center max-w-4xl mx-auto">
          <ScrollReveal direction="fade">
            <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">
              Nos prestations
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Des solutions de covering pour{" "}
              <span className="text-rouge">chaque surface</span> de votre
              int&eacute;rieur
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-gris-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Cuisine, salle de bain, meubles, locaux professionnels ou
              vitrages : CoverSwap transforme vos surfaces avec des films
              adh&eacute;sifs Cover&nbsp;Styl&rsquo; haut de gamme. R&eacute;sultat
              spectaculaire, pos&eacute; en 1&nbsp;journ&eacute;e, garanti 10&nbsp;ans
              &mdash;&nbsp;sans travaux ni poussi&egrave;re.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/simulation"
                className="btn-primary text-base px-8 py-4"
              >
                Simuler ma cuisine (IA gratuite)
              </Link>
              <Link
                href="/contact"
                className="border border-gris-600 text-white hover:border-rouge/60 hover:text-rouge rounded-xl text-base px-8 py-4 transition-colors font-semibold"
              >
                Nous contacter
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          5 SERVICE CARDS
      ══════════════════════════════════════════════ */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">
                Nos expertises
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                Un savoir-faire adapt&eacute; &agrave; chaque pi&egrave;ce
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <ScrollReveal key={service.href} delay={i * 0.1}>
                <Link
                  href={service.href}
                  className="glass-card p-8 group hover:border-rouge/40 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                >
                  {/* Emoji icon */}
                  <div className="w-14 h-14 rounded-xl bg-rouge/10 flex items-center justify-center text-2xl mb-6 group-hover:bg-rouge/20 transition-colors">
                    {service.emoji}
                  </div>

                  {/* Title */}
                  <h2 className="font-display text-2xl font-bold mb-3 group-hover:text-rouge transition-colors">
                    {service.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gris-400 leading-relaxed mb-6 flex-1">
                    {service.description}
                  </p>

                  {/* Key stat */}
                  <div className="mb-6 py-3 px-4 rounded-lg bg-rouge/5 border border-rouge/10">
                    <span className="text-rouge font-display font-bold text-lg">
                      {service.stat}
                    </span>
                    <span className="text-gris-400 text-sm ml-2">
                      {service.statLabel}
                    </span>
                  </div>

                  {/* CTA */}
                  <span className="inline-flex items-center gap-2 text-rouge font-semibold text-sm uppercase tracking-wider">
                    D&eacute;couvrir cette prestation
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </span>
                </Link>
              </ScrollReveal>
            ))}

            {/* CTA Card (6th slot) */}
            <ScrollReveal delay={0.5}>
              <div className="glass-card p-8 flex flex-col items-center justify-center text-center border-rouge/20 bg-rouge/5 h-full">
                <div className="w-14 h-14 rounded-xl bg-rouge/20 flex items-center justify-center text-2xl mb-6">
                  &#10024;
                </div>
                <h2 className="font-display text-2xl font-bold mb-3">
                  Un projet sur-mesure&nbsp;?
                </h2>
                <p className="text-gris-400 mb-6">
                  Décrivez votre projet et recevez un devis détaillé sous 48h.
                  Sans engagement.
                </p>
                <Link
                  href="/contact"
                  className="btn-primary text-base px-6 py-3"
                >
                  Demander un devis
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WHY COVERSWAP
      ══════════════════════════════════════════════ */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1754522711595-84428937b07a?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.82)"
          fadeTop
          fadeBottom
        />

        <div className="container-custom relative z-20">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">
                La diff&eacute;rence CoverSwap
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                Pourquoi{" "}
                <span className="text-rouge">nos clients</span> font confiance
                &agrave; CoverSwap
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {trustReasons.map((reason, i) => (
              <ScrollReveal key={reason.title} delay={i * 0.08}>
                <div className="glass-card p-6 text-center h-full">
                  <div className="text-4xl mb-4">{reason.icon}</div>
                  <h3 className="font-display text-xl font-bold mb-2">
                    {reason.title}
                  </h3>
                  <p className="text-gris-400 text-sm leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Catalogue banner */}
          <ScrollReveal delay={0.5}>
            <Link
              href="/revetements"
              className="block mt-12 glass-card p-8 border-rouge/20 bg-rouge/5 hover:border-rouge/40 transition-all duration-300 group text-center"
            >
              <h3 className="font-display text-2xl font-bold mb-2">
                Catalogue de <span className="text-rouge">près de 500 références</span> Cover&nbsp;Styl&rsquo;
              </h3>
              <p className="text-gris-400 mb-4 max-w-xl mx-auto">
                Bois, marbre, b&eacute;ton, m&eacute;tal, couleurs unies, cuir&hellip; Parcourez l&rsquo;int&eacute;gralit&eacute; de notre catalogue pour trouver la finition id&eacute;ale.
              </p>
              <span className="inline-flex items-center gap-2 text-rouge font-semibold group-hover:gap-3 transition-all">
                Explorer le catalogue
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROCESS OVERVIEW (3 steps)
      ══════════════════════════════════════════════ */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">
                Comment &ccedil;a marche
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                3&nbsp;&eacute;tapes simples pour transformer votre
                int&eacute;rieur
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 0.15}>
                <div className="relative glass-card p-8 text-center h-full">
                  {/* Step number */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-rouge flex items-center justify-center text-white font-display font-bold text-sm">
                    {step.number}
                  </div>
                  <h3 className="font-display text-xl font-bold mt-4 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gris-400 leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Connector line (desktop) */}
          <div className="hidden md:block max-w-5xl mx-auto mt-[-180px] mb-[130px] px-16 relative z-0">
            <div className="border-t-2 border-dashed border-gris-700 w-full" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA BAND
      ══════════════════════════════════════════════ */}
      <section className="section-padding bg-gradient-to-b from-noir to-noir-800">
        <div className="container-custom text-center">
          <ScrollReveal>
            <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">
              Passez &agrave; l&rsquo;action
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
              Quel projet souhaitez-vous r&eacute;aliser&nbsp;?
            </h2>
            <p className="text-gris-300 text-lg mb-10 max-w-xl mx-auto">
              D&eacute;crivez votre projet et recevez un devis
              personnalis&eacute; sous 48h. Simulation IA disponible pour les cuisines.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="btn-primary text-lg px-10 py-5"
              >
                Demander un devis gratuit
              </Link>
              <Link
                href="/contact"
                className="border border-gris-600 text-white hover:border-rouge/60 hover:text-rouge rounded-xl text-lg px-10 py-5 transition-colors font-semibold"
              >
                Appeler un conseiller
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
