import type { Metadata } from "next";
import Link from "next/link";
import TextureBackground from "@/components/TextureBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { FAQSchema, ServiceSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Film pour Vitrage | Film Solaire, Intimité & Sécurité",
  description:
    "Films adhésifs pour vitrages : protection solaire, intimité, décoration, sécurité anti-effraction. Bureaux, commerces, habitations. Pose professionnelle. Devis gratuit.",
  keywords:
    "film vitrage, film solaire vitres, film intimité, film anti-chaleur, film décoratif vitrage, film sécurité vitres, covering vitrage",
};

const typesFilms = [
  {
    title: "Film solaire anti-chaleur",
    description:
      "Réduit jusqu'à 80% de la chaleur entrante par vos vitrages. Diminue significativement vos coûts de climatisation en été tout en préservant la luminosité naturelle.",
  },
  {
    title: "Film d'intimité",
    description:
      "Effet opaque, dépoli ou miroir sans tain : préservez la confidentialité de vos espaces sans sacrifier la lumière naturelle. Idéal pour bureaux et salles de réunion.",
  },
  {
    title: "Film décoratif",
    description:
      "Motifs géométriques, dégradés, logos d'entreprise, effets visuels : personnalisez vos surfaces vitrées pour affirmer votre identité et sublimer vos espaces.",
  },
  {
    title: "Film anti-UV",
    description:
      "Bloque jusqu'à 99% des rayons ultraviolets nocifs. Protège vos mobiliers, sols, oeuvres d'art et marchandises contre la décoloration et le vieillissement prématuré.",
  },
  {
    title: "Film de sécurité",
    description:
      "Film anti-effraction qui retient les éclats de verre en cas de bris. Renforce la résistance de vos vitrages face aux tentatives d'intrusion et aux accidents.",
  },
  {
    title: "Film teinté",
    description:
      "Réduit l'éblouissement et les reflets gênants sur les écrans. Améliore le confort visuel de vos collaborateurs tout en apportant une touche esthétique contemporaine.",
  },
];

const applications = [
  {
    title: "Bureaux et open spaces",
    description:
      "Contrôle solaire pour le confort des collaborateurs, films d'intimité pour les espaces dirigeants et cloisons vitrées personnalisées.",
  },
  {
    title: "Commerces et vitrines",
    description:
      "Protection anti-UV pour vos marchandises, films décoratifs pour votre identité visuelle et films de sécurité pour vos devantures.",
  },
  {
    title: "Salles de réunion",
    description:
      "Films d'intimité commutables ou dépolis pour la confidentialité de vos échanges, sans sacrifier la luminosité ambiante.",
  },
  {
    title: "Habitations (baies vitrées)",
    description:
      "Films solaires pour réduire la chaleur en été, films d'intimité pour les rez-de-chaussée et les vis-à-vis gênants.",
  },
  {
    title: "Vérandas",
    description:
      "Solutions anti-chaleur haute performance indispensables pour rendre vos vérandas confortables même en plein été, sans perte de luminosité.",
  },
  {
    title: "Établissements recevant du public",
    description:
      "Films de sécurité conformes aux normes ERP, films anti-UV pour protéger les expositions et films décoratifs pour les espaces d'accueil.",
  },
];

const benefices = [
  {
    title: "Économies d'énergie",
    value: "Jusqu'à 30%",
    description: "de réduction sur votre facture de climatisation grâce aux films solaires haute performance.",
  },
  {
    title: "Protection UV",
    value: "99%",
    description: "des rayons ultraviolets bloqués pour protéger vos biens et la santé de vos occupants.",
  },
  {
    title: "Confort thermique",
    value: "Été comme hiver",
    description: "Régulation naturelle de la température intérieure en toute saison, sans surconsommation énergétique.",
  },
  {
    title: "Intimité préservée",
    value: "100% lumière",
    description: "Bloquez les regards indiscrets tout en conservant l'apport de lumière naturelle dans vos espaces.",
  },
  {
    title: "Sécurité renforcée",
    value: "Anti-effraction",
    description: "Films retenant les éclats de verre en cas de bris, ralentissant les tentatives d'intrusion.",
  },
  {
    title: "Esthétique moderne",
    value: "Sur-mesure",
    description: "Personnalisation complète de vos vitrages : motifs, logos, dégradés, effets miroir ou dépoli.",
  },
];

const steps = [
  {
    num: "01",
    title: "Diagnostic vitrage",
    description:
      "Un expert analyse vos surfaces vitrées, leur orientation, leur exposition solaire et vos besoins spécifiques (intimité, solaire, sécurité, décoration).",
  },
  {
    num: "02",
    title: "Préconisation & devis",
    description:
      "Nous vous recommandons le film le plus adapté à votre situation et vous remettons un devis détaillé avec échantillons à tester sur place.",
  },
  {
    num: "03",
    title: "Pose professionnelle",
    description:
      "Application soignée sans bulles ni imperfections par nos poseurs certifiés. Résultat impeccable garanti, avec un temps de séchage minimal.",
  },
  {
    num: "04",
    title: "Contrôle & garantie",
    description:
      "Vérification finale de chaque vitrage traité, remise du certificat de garantie et conseils d'entretien pour une durabilité maximale.",
  },
];

const faqs = [
  {
    q: "Le film solaire réduit-il vraiment la chaleur ?",
    a: "Oui, de manière significative. Nos films solaires haute performance rejettent jusqu'à 80% de l'énergie solaire. En pratique, cela peut abaisser la température intérieure de 5 à 8°C en période de forte chaleur et réduire votre consommation de climatisation de 20 à 30%.",
  },
  {
    q: "Peut-on voir à travers un film d'intimité ?",
    a: "Cela dépend du type de film choisi. Un film dépoli laisse passer la lumière mais floute complètement la vue. Un film miroir sans tain permet de voir vers l'extérieur tout en empêchant de voir vers l'intérieur (en journée). Nous vous conseillerons le film adapté à votre usage.",
  },
  {
    q: "Le film pour vitrage est-il posé à l'intérieur ou l'extérieur ?",
    a: "La grande majorité de nos films se posent côté intérieur, ce qui les protège des intempéries et facilite l'entretien. Certains films solaires haute performance et films de sécurité spécifiques peuvent être posés côté extérieur pour une efficacité maximale.",
  },
  {
    q: "Combien de temps dure un film pour vitrage ?",
    a: "Nos films professionnels ont une durée de vie de 10 à 15 ans en pose intérieure, et de 7 à 10 ans en pose extérieure. Ils sont garantis contre le décollement, le bullage et la décoloration pendant toute la durée de la garantie.",
  },
  {
    q: "Le film peut-il être retiré sans abîmer la vitre ?",
    a: "Absolument. Nos films sont conçus pour être amovibles. Ils se retirent proprement sans laisser de résidu sur le verre. La vitre retrouve son état d'origine, ce qui est particulièrement important pour les locataires ou en cas de changement de besoin.",
  },
  {
    q: "Le film solaire assombrit-il la pièce ?",
    a: "Très peu. Nos films solaires dernière génération sont conçus pour rejeter la chaleur tout en laissant passer un maximum de lumière visible. Selon le modèle, la transmission lumineuse reste entre 50% et 70%, ce qui est suffisant pour un éclairage naturel confortable.",
  },
  {
    q: "Quel film choisir pour une salle de réunion ?",
    a: "Nous recommandons un film d'intimité dépoli ou à bandes alternées pour la confidentialité visuelle, combiné à un film anti-reflets pour le confort lors des présentations. Pour les salles exposées au sud, un film solaire en complément est idéal.",
  },
  {
    q: "Combien coûte la pose de film sur vitrage ?",
    a: "Le prix varie selon le type de film et la surface à couvrir. Comptez en moyenne entre 35 et 90 EUR/m2 pose comprise, selon la complexité. Un devis gratuit et personnalisé est systématiquement établi après diagnostic de vos vitrages.",
  },
];

export default function VitragesPage() {
  return (
    <main className="bg-noir min-h-screen">
      <ServiceSchema
        name="Film pour Vitrage"
        description="Films adhésifs pour vitrages : protection solaire, intimité, décoration, sécurité anti-effraction. Pose professionnelle pour bureaux, commerces et habitations."
        url="https://coverswap.fr/prestations/vitrages"
      />
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Prestations", url: "https://coverswap.fr/prestations" }, { name: "Films pour Vitrages", url: "https://coverswap.fr/prestations/vitrages" }]} />

      {/* Hero */}
      <section className="relative section-padding pt-40 overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1737930172367-30621b8d5d75?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.80)"
          fadeTop={false}
          fadeBottom
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-rouge/5 blur-[100px]" />
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
              Films pour Vitrages
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight max-w-4xl">
              Protégez, décorez et optimisez{" "}
              <span className="text-rouge">vos vitrages</span>
            </h1>
            <p className="text-gris-300 text-lg max-w-2xl leading-relaxed mb-10">
              Films solaires, films d&apos;intimité, films décoratifs et films
              de sécurité. Solutions professionnelles pour bureaux, commerces et
              habitations.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/simulation" className="btn-primary">
                Demander un diagnostic gratuit
              </Link>
              <Link href="/realisations" className="btn-secondary">
                Voir les réalisations
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Types de films */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Un film pour <span className="text-rouge">chaque besoin</span>
            </h2>
            <p className="text-gris-400 text-center max-w-2xl mx-auto mb-16">
              Notre gamme complète de films pour vitrage répond à tous les
              enjeux : confort thermique, intimité, esthétique et sécurité.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {typesFilms.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.1}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 h-full">
                  <h3 className="font-display text-lg font-bold mb-3 text-rouge">
                    {f.title}
                  </h3>
                  <p className="text-gris-400 text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1750036015902-c6f5ebca924e?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.88)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Pour tous les types de{" "}
              <span className="text-rouge">bâtiments</span>
            </h2>
            <p className="text-gris-400 text-center max-w-2xl mx-auto mb-16">
              Bureaux, commerces, habitations, établissements publics : nos
              films s&apos;adaptent à chaque environnement et à chaque
              contrainte.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((a, i) => (
              <ScrollReveal key={a.title} delay={i * 0.1}>
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

      {/* Bénéfices */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Les avantages des films pour{" "}
              <span className="text-rouge">vitrage</span>
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefices.map((b, i) => (
              <ScrollReveal key={b.title} delay={i * 0.1}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 h-full text-center">
                  <p className="text-rouge font-display text-2xl font-bold mb-1">
                    {b.value}
                  </p>
                  <h3 className="font-display text-lg font-bold mb-3">
                    {b.title}
                  </h3>
                  <p className="text-gris-400 text-sm leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Processus */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1704383014623-a6630096ff8c?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Comment ça <span className="text-rouge">marche</span> ?
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

      {/* FAQ */}
      <section className="section-padding">
        <div className="container-custom max-w-3xl">
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
                Protégez et embellissez vos vitrages
              </h2>
              <p className="text-gris-300 text-lg mb-8 max-w-xl mx-auto">
                Diagnostic gratuit de vos vitrages, recommandation personnalisée
                et devis détaillé. Pose professionnelle garantie sans bulles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/simulation" className="btn-primary text-lg px-10 py-5">
                  Recevoir mon diagnostic gratuit
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
