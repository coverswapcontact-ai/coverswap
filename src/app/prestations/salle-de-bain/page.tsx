import type { Metadata } from "next";
import Link from "next/link";
import TextureBackground from "@/components/TextureBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { ServiceSchema, FAQSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Covering Salle de Bain | Film Adhésif Waterproof & Anti-Moisissures",
  description: "Rénovez votre salle de bain sans casser le carrelage. Film adhésif waterproof, anti-moisissures, garanti 10 ans. Murs, sols, meubles vasque. Devis gratuit en 48h.",
  keywords: "covering salle de bain, film adhésif salle de bain, rénovation carrelage adhésif, film waterproof salle de bain, covering carrelage, revêtement adhésif douche",
};

const zones = [
  { title: "Murs et cloisons", description: "Recouvrez l'intégralité de vos murs avec un film étanche. Idéal pour remplacer une peinture qui cloque ou un papier peint vieillissant en zone humide." },
  { title: "Carrelage mural", description: "Posez le film directement sur votre ancien carrelage sans le retirer. Les joints sont lissés pour un rendu parfaitement uniforme et moderne." },
  { title: "Plan vasque et meuble sous-vasque", description: "Transformez un meuble de salle de bain abîmé en pièce design. Le film épouse les formes, résiste aux éclaboussures et aux produits cosmétiques." },
  { title: "Contour de baignoire", description: "Tablier, rebords et coffrages autour de la baignoire : chaque surface est protégée par un film 100 % waterproof qui ne se décolle pas à la vapeur." },
  { title: "Porte de douche (film)", description: "Appliquez un film dépoli, teinté ou décoratif sur votre paroi de douche pour gagner en intimité tout en modernisant l'esthétique." },
  { title: "Plinthes et coffrages", description: "Les détails font la différence. Plinthes, coffrages de tuyauterie et niches murales sont recouverts pour un rendu homogène du sol au plafond." },
];

const properties = [
  { title: "100 % waterproof", description: "Résiste à l'immersion totale et aux projections directes de douche. Certifié pour zones de contact eau prolongé.", icon: "M12 21a9.004 9.004 0 01-8.716-6.747M12 21a9.004 9.004 0 008.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" },
  { title: "Anti-moisissures", description: "Traitement fongicide intégré dans la masse du film. Empêche toute colonisation bactérienne, même dans les angles et les joints.", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
  { title: "Résistant vapeur", description: "Conçu pour supporter la condensation quotidienne et les variations de température propres aux salles de bain sans gondoler ni se décoller.", icon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" },
  { title: "Anti-bactérien", description: "Surface conforme aux normes sanitaires européennes. Empêche la prolifération des germes pour une hygiène irréprochable au quotidien.", icon: "M11.42 15.17l-5.42 3.24V6.26l5.42 3.24m0 5.67l5.42 3.24V6.26l-5.42 3.24m0 5.67V9.5" },
  { title: "Résistant aux produits ménagers", description: "Nettoyants, anticalcaire, javel : le film conserve son aspect et ses couleurs face à tous les produits d'entretien courants.", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
  { title: "Tenue UV", description: "Traitement anti-UV intégré pour éviter tout jaunissement ou décoloration, même dans une salle de bain exposée à la lumière naturelle.", icon: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" },
];

const finitions = [
  { title: "Marbre blanc Carrara", description: "Veinage fin et lumineux, idéal pour agrandir visuellement l'espace." },
  { title: "Travertin beige", description: "Chaleur méditerranéenne et texture naturelle pour une ambiance spa." },
  { title: "Carreaux de ciment", description: "Motifs géométriques rétro-chic pour un sol ou un mur plein de caractère." },
  { title: "Bois teck spa", description: "Esprit balnéo haut de gamme, rainures réalistes sans risque d'humidité." },
  { title: "Pierre naturelle ardoise", description: "Ton anthracite profond pour une salle de bain contemporaine et élégante." },
  { title: "Couleurs mates modernes", description: "Vert sauge, terracotta, bleu nuit : des teintes tendance en finition mate veloutée." },
];

const steps = [
  { num: "01", title: "Diagnostic & simulation", description: "Photographiez votre salle de bain et recevez une simulation réaliste du résultat grâce à notre outil IA, en moins de 60 secondes." },
  { num: "02", title: "Choix du film waterproof", description: "Sélectionnez la finition, la couleur et la texture parmi notre gamme certifiée pour pièces d'eau humides." },
  { num: "03", title: "Préparation des surfaces", description: "Nettoyage, dégraissage et traitement des joints. Chaque surface est préparée pour garantir une adhérence parfaite et durable." },
  { num: "04", title: "Pose experte en 1 journée", description: "Nos techniciens posent le film sans découpe de carrelage ni coupure d'eau. Vous retrouvez votre salle de bain le soir même." },
];

const comparatif = [
  { critere: "Prix moyen", covering: "1 200 - 2 500 \u20ac", classique: "6 000 - 12 000 \u20ac" },
  { critere: "Durée des travaux", covering: "1 journée", classique: "2 \u00e0 3 semaines" },
  { critere: "Démolition nécessaire", covering: "Aucune", classique: "Oui (carrelage, plâtre)" },
  { critere: "Plombier requis", covering: "Non", classique: "Oui" },
  { critere: "Durabilité", covering: "10 ans garanti", classique: "15-20 ans" },
  { critere: "Réversible", covering: "Oui, retrait sans trace", classique: "Non" },
];

const faqs = [
  { q: "Le covering résiste-t-il dans une douche à l'italienne ?", a: "Oui. Nos films waterproof sont certifiés pour les zones de projection directe et d'immersion partielle. Ils sont posés avec un traitement de joints étanche qui garantit une protection totale, même dans une douche à l'italienne sans receveur." },
  { q: "Peut-on poser le film adhésif sur du carrelage existant ?", a: "Tout à fait. Le covering se pose directement sur le carrelage après un nettoyage et un dégraissage minutieux. Les joints sont comblés au préalable pour obtenir un rendu parfaitement lisse. Aucun besoin de retirer l'ancien revêtement." },
  { q: "Le covering salle de bain jaunit-il avec le temps ?", a: "Non. Nos films intègrent un traitement anti-UV qui empêche tout jaunissement ou décoloration, même après plusieurs années d'exposition à la lumière naturelle et à l'humidité constante." },
  { q: "Comment entretenir un covering dans une salle de bain ?", a: "Un simple coup d'éponge humide ou de microfibre suffit. La surface non poreuse du film empêche les dépôts de calcaire et de savon de s'incruster. Aucun produit spécial n'est nécessaire." },
  { q: "Le film adhésif résiste-t-il aux produits nettoyants ?", a: "Oui. Nos films résistent aux nettoyants courants, à l'anticalcaire et même à la javel diluée. Les couleurs et textures restent intactes après des centaines de nettoyages." },
  { q: "Quel est le prix d'un covering salle de bain ?", a: "Le prix varie selon la surface à couvrir et les finitions choisies. En moyenne, comptez entre 1 200 et 2 500 euros pour une salle de bain complète, soit 70 % de moins qu'une rénovation traditionnelle avec carreleur et plombier." },
  { q: "Peut-on couvrir un meuble vasque avec du film adhésif ?", a: "Absolument. Le film épouse les formes du meuble, y compris les chants et les arrondis. Il résiste aux éclaboussures, aux produits cosmétiques et aux variations de température. Résultat : un meuble comme neuf en quelques heures." },
  { q: "Le covering empêche-t-il les moisissures ?", a: "Oui. Le traitement fongicide intégré dans la masse du film empêche toute formation de moisissures. Contrairement à la peinture ou au papier peint, le covering ne cloque pas et ne laisse aucune prise à l'humidité." },
];

const stats = [
  { value: "100 %", label: "Waterproof" },
  { value: "1", label: "Journée de pose" },
  { value: "-70 %", label: "vs rénovation classique" },
  { value: "10 ans", label: "Garantie" },
];

export default function SalleDeBainPage() {
  return (
    <main className="bg-noir min-h-screen">
      <ServiceSchema
        name="Covering Salle de Bain"
        description="Rénovation de salle de bain par film adhésif waterproof et anti-moisissures. Murs, sols, meubles vasque, contour de baignoire. Pose en 1 journée, garanti 10 ans."
        url="https://coverswap.fr/prestations/salle-de-bain"
      />
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Prestations", url: "https://coverswap.fr/prestations" }, { name: "Covering Salle de Bain", url: "https://coverswap.fr/prestations/salle-de-bain" }]} />

      {/* Hero */}
      <section className="relative section-padding pt-40 overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1754788358645-d6e6cca12e25?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.80)"
          fadeTop={false}
          fadeBottom
        />
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-rouge/5 blur-[100px]" />
        <div className="container-custom relative z-20">
          <Link href="/prestations" className="inline-flex items-center gap-2 text-gris-400 hover:text-white transition-colors mb-8 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Toutes les prestations
          </Link>
          <ScrollReveal>
            <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">Covering Salle de Bain</span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight max-w-3xl">
              Rénovez votre salle de bain <span className="text-rouge">sans casser le carrelage</span>
            </h1>
            <p className="text-gris-300 text-lg max-w-2xl leading-relaxed mb-10">
              Film adhésif waterproof, anti-moisissures, 100&nbsp;% étanche. Murs, sols, plans vasque transformés en 1&nbsp;journée.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact" className="btn-primary">Demander un devis gratuit</Link>
              <Link href="/contact" className="btn-secondary">Devis gratuit en 48h</Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Problem-Solution */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-6">
              Fini les rénovations salle de bain <span className="text-rouge">à 8&nbsp;000&nbsp;&euro;</span>
            </h2>
            <p className="text-gris-300 text-center max-w-2xl mx-auto mb-16 leading-relaxed">
              Casser le carrelage, c&apos;est 2 à 3 semaines de chantier, de la poussière partout, un plombier, un carreleur, un peintre... et une facture qui explose. Le covering waterproof CoverSwap transforme votre salle de bain en 1 journée, sans démolition, pour un résultat haut de gamme.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <div className="glass-card p-6 text-center hover:border-rouge/30 transition-all duration-300">
                  <span className="block font-display text-3xl sm:text-4xl font-bold text-rouge mb-2">{stat.value}</span>
                  <span className="text-gris-400 text-sm">{stat.label}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Zones couvertes */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1754522711595-84428937b07a?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Chaque surface de votre salle de bain, <span className="text-rouge">réinventée</span>
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone, i) => (
              <ScrollReveal key={zone.title} delay={i * 0.08}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 h-full">
                  <h3 className="font-display text-lg font-bold mb-2">{zone.title}</h3>
                  <p className="text-gris-400 text-sm leading-relaxed">{zone.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Propriétés techniques */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Un film conçu pour les <span className="text-rouge">pièces d&apos;eau</span>
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop, i) => (
              <ScrollReveal key={prop.title} delay={i * 0.08}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-lg bg-rouge/10 flex items-center justify-center text-rouge mb-4">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={prop.icon} />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">{prop.title}</h3>
                  <p className="text-gris-400 text-sm leading-relaxed">{prop.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Finitions */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1750036015902-c6f5ebca924e?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Des finitions qui imitent les <span className="text-rouge">matériaux nobles</span>
            </h2>
            <p className="text-gris-300 text-center max-w-2xl mx-auto mb-16 leading-relaxed">
              Chaque texture est reproduite avec un réalisme saisissant : veinage, relief, toucher. L&apos;illusion est parfaite, le budget est divisé par cinq.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {finitions.map((fin, i) => (
              <ScrollReveal key={fin.title} delay={i * 0.08}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 h-full">
                  <h3 className="font-display text-lg font-bold mb-2">{fin.title}</h3>
                  <p className="text-gris-400 text-sm leading-relaxed">{fin.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Processus 4 étapes */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              4 étapes pour une salle de bain <span className="text-rouge">comme neuve</span>
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <ScrollReveal key={s.num} delay={i * 0.1}>
                <div className="glass-card p-8 relative h-full">
                  <span className="text-rouge/20 font-display text-6xl font-bold absolute top-4 right-6">{s.num}</span>
                  <h3 className="font-display text-xl font-bold mb-3 mt-4">{s.title}</h3>
                  <p className="text-gris-400 leading-relaxed">{s.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparatif */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1617325697689-196257ac1829?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20 max-w-4xl">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Covering vs <span className="text-rouge">rénovation classique</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-gris-400 text-sm font-normal">Critère</th>
                    <th className="p-4 text-rouge font-display font-bold">Covering CoverSwap</th>
                    <th className="p-4 text-gris-400 font-display font-bold">Rénovation carreleur</th>
                  </tr>
                </thead>
                <tbody>
                  {comparatif.map((row) => (
                    <tr key={row.critere} className="border-b border-white/5 last:border-0">
                      <td className="p-4 text-sm font-medium">{row.critere}</td>
                      <td className="p-4 text-sm text-green-400">{row.covering}</td>
                      <td className="p-4 text-sm text-gris-400">{row.classique}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    Decouvrez nos finitions <span className="text-rouge">pierre, marbre et beton</span> pour votre salle de bain
                  </h3>
                  <p className="text-gris-400 leading-relaxed">
                    Notre catalogue de 497 references Cover Styl&apos; comprend des dizaines de finitions waterproof ideales pour les pieces d&apos;eau : travertin, ardoise, marbre Carrara et bien plus.
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
                    <svg className="w-5 h-5 text-rouge shrink-0 group-open:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
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
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Transformez votre salle de bain dès maintenant</h2>
              <p className="text-gris-300 text-lg mb-8 max-w-xl mx-auto">
                Recevez un devis détaillé en 48&nbsp;heures. Zéro engagement, zéro surprise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" className="btn-primary text-lg px-10 py-5">Demander un devis gratuit</Link>
                <Link href="/simulation" className="btn-secondary text-lg px-10 py-5">Simuler une cuisine (IA)</Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
