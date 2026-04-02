import type { Metadata } from "next";
import Link from "next/link";
import TextureBackground from "@/components/TextureBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { ServiceSchema, FAQSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Covering Cuisine | Relooking Plan de Travail & Meubles Sans Travaux",
  description:
    "Rénovez votre cuisine en 1 journée avec le covering adhésif. Plans de travail, crédences, façades de meubles. 50+ textures marbre, bois, béton. Garanti 10 ans. Devis gratuit.",
  keywords:
    "covering cuisine, relooking cuisine sans travaux, film adhésif plan de travail, rénovation cuisine adhésif, covering plan de travail, covering meuble cuisine, revêtement adhésif cuisine",
};

const faqs = [
  {
    q: "Le covering résiste-t-il à la chaleur des plaques de cuisson ?",
    a: "Nos films adhésifs sont certifiés pour résister jusqu'à 75 °C en contact direct et prolongé. Autour des plaques de cuisson, nous posons un film technique haute température et recommandons l'usage de dessous-de-plat pour les casseroles brûlantes. Aucun risque de décollement ni de déformation dans des conditions normales d'utilisation.",
  },
  {
    q: "Peut-on poser du covering sur un plan de travail stratifié ?",
    a: "Oui, le stratifié est l'un des supports les plus adaptés au covering. Après un nettoyage minutieux et l'application d'un primaire d'accroche, le film adhère parfaitement et durablement. Nous intervenons également sur le mélaminé, le carrelage, l'inox et le bois brut.",
  },
  {
    q: "Combien de temps dure un covering cuisine ?",
    a: "Avec un entretien normal, nos revêtements conservent leur aspect pendant 7 à 10 ans minimum. Ils sont garantis contre le décollement, le jaunissement et la délamination. Passé ce délai, le film peut être retiré et remplacé par une nouvelle finition.",
  },
  {
    q: "Le covering supporte-t-il l'eau et les projections ?",
    a: "Absolument. Nos films sont 100 % imperméables et résistent aux projections d'eau, de graisse et de produits ménagers courants. Les joints sont scellés avec un mastic alimentaire transparent pour une étanchéité totale au niveau des éviers et crédences.",
  },
  {
    q: "Peut-on mettre du covering sur des meubles de cuisine IKEA ?",
    a: "C'est même l'un de nos cas les plus fréquents. Les façades IKEA en mélaminé sont un support idéal pour le covering. Nous transformons régulièrement des cuisines METOD et KALLARP pour leur donner un aspect haut de gamme à une fraction du coût d'un remplacement.",
  },
  {
    q: "Quel est le prix d'un covering cuisine complet ?",
    a: "Le prix varie selon la surface à couvrir et les finitions choisies. En moyenne, un covering cuisine complet (plans de travail + façades + crédence) revient entre 1 200 et 3 500 euros, soit 5 à 10 fois moins qu'une rénovation classique. Chaque devis est personnalisé et gratuit.",
  },
  {
    q: "Le covering est-il réversible ?",
    a: "Oui, c'est l'un de ses grands avantages. Le film adhésif peut être retiré à tout moment sans endommager le support d'origine. Un décapeur thermique permet un retrait propre, et la surface retrouve son état initial. Idéal pour les locataires ou ceux qui aiment changer de style.",
  },
  {
    q: "Comment entretenir un plan de travail recouvert ?",
    a: "L'entretien est très simple : un chiffon doux humide avec un peu de produit vaisselle suffit. Évitez les éponges abrasives et les solvants agressifs. Nos films sont anti-traces et oléofuges, ce qui facilite le nettoyage quotidien. Aucun traitement particulier n'est nécessaire.",
  },
];

const surfaces = [
  {
    icon: "🍳",
    title: "Plans de travail",
    description:
      "Stratifié, mélaminé ou carrelage : recouvrez votre plan de travail d'une finition marbre, bois ou béton sans dépose.",
  },
  {
    icon: "🧱",
    title: "Crédences",
    description:
      "Remplacez le carrelage vieillissant par un film adhésif lisse, facile à nettoyer et résistant aux projections.",
  },
  {
    icon: "🚪",
    title: "Façades de meubles",
    description:
      "Donnez un second souffle à vos caissons hauts et bas avec des façades effet laqué, bois naturel ou couleur unie.",
  },
  {
    icon: "🗄️",
    title: "Tiroirs et poignées",
    description:
      "Chaque détail compte : harmonisez tiroirs, plinthes et poignées pour un rendu cohérent et soigné.",
  },
  {
    icon: "🏝️",
    title: "Îlots centraux",
    description:
      "Transformez votre îlot en pièce maîtresse avec une finition premium : marbre Calacatta, chêne clair ou béton ciré.",
  },
  {
    icon: "📦",
    title: "Éléments hauts et bas",
    description:
      "Colonnes, meubles d'angle, habillages de hotte : toutes les surfaces sont couvertes pour un résultat uniforme.",
  },
];

const finitions = [
  {
    title: "Marbre",
    varieties: "Carrara, Calacatta, noir Marquina",
    description:
      "Veinage naturel et profondeur de matière pour un rendu luxueux. Toucher lisse et brillant, indiscernable du vrai marbre.",
  },
  {
    title: "Bois",
    varieties: "Chêne clair, noyer, teck",
    description:
      "Grain et texture reproduits au millimètre. Chaleur du bois naturel sans les contraintes d'entretien ni la sensibilité à l'humidité.",
  },
  {
    title: "Béton",
    varieties: "Gris anthracite, béton ciré",
    description:
      "L'esprit loft et industriel dans votre cuisine. Finition mate et minérale avec une résistance supérieure au vrai béton ciré.",
  },
  {
    title: "Couleurs unies",
    varieties: "Mat, satiné, brillant",
    description:
      "Du blanc éclatant au noir profond en passant par toutes les teintes RAL. Finition uniforme et sans défaut pour un style épuré.",
  },
  {
    title: "Métal",
    varieties: "Inox brossé, laiton, cuivre",
    description:
      "Reflets métalliques authentiques pour une touche contemporaine. Idéal pour les crédences, îlots et éléments de contraste.",
  },
  {
    title: "Pierre naturelle",
    varieties: "Ardoise, granit, travertin",
    description:
      "Texture et grain de la pierre véritable. Robustesse visuelle et élégance brute pour une cuisine de caractère.",
  },
];

const steps = [
  {
    num: "01",
    title: "Envoyez vos photos",
    description:
      "Photographiez votre cuisine sous différents angles. Notre IA analyse les surfaces et génère un devis détaillé en 48 heures.",
  },
  {
    num: "02",
    title: "Choix des finitions",
    description:
      "Sélectionnez vos textures parmi 50+ références. Nous vous envoyons des échantillons physiques pour valider couleurs et toucher.",
  },
  {
    num: "03",
    title: "Préparation des surfaces",
    description:
      "Nettoyage professionnel, dégraissage, application d'un primaire d'accroche. Chaque surface est préparée pour une adhésion parfaite.",
  },
  {
    num: "04",
    title: "Pose professionnelle",
    description:
      "Nos poseurs certifiés interviennent en 1 journée. Découpe sur mesure, maroufflage sans bulles, finitions impeccables. Résultat immédiat.",
  },
];

const avantages = [
  { icon: "🔥", title: "Résistant chaleur", description: "Jusqu'à 75 °C en contact direct" },
  { icon: "💧", title: "Résistant eau et humidité", description: "100 % imperméable, joints scellés" },
  { icon: "🛡️", title: "Anti-rayures et anti-taches", description: "Surface oléofuge haute densité" },
  { icon: "🧹", title: "Entretien simple", description: "Eau + chiffon doux, sans produit spécial" },
  { icon: "✅", title: "Garanti 10 ans", description: "Anti-décollement, anti-jaunissement" },
  { icon: "♻️", title: "Réversible sans traces", description: "Retrait propre, support préservé" },
  { icon: "🍽️", title: "Conforme normes alimentaires", description: "Contact alimentaire indirect certifié" },
  { icon: "🌱", title: "Écologique (0 déchet)", description: "Pas de démolition, pas de gravats" },
];

const comparatif = [
  { critere: "Prix moyen", covering: "1 200 - 3 500 euros", classique: "5 000 - 15 000 euros" },
  { critere: "Durée des travaux", covering: "1 journée", classique: "2 à 3 semaines" },
  { critere: "Poussière / Bruit", covering: "Aucun", classique: "Important" },
  { critere: "Déménagement nécessaire", covering: "Non", classique: "Souvent oui" },
  { critere: "Durabilité", covering: "7 à 10 ans garanti", classique: "15 à 20 ans" },
  { critere: "Personnalisation", covering: "50+ textures, changeable", classique: "Limitée au choix initial" },
  { critere: "Impact écologique", covering: "Minimal (0 déchet)", classique: "Élevé (démolition, transport)" },
];

export default function CuisinePage() {
  return (
    <main className="bg-noir min-h-screen">
      <ServiceSchema
        name="Covering Cuisine"
        description="Rénovation de cuisine par revêtement adhésif texturé : plans de travail, crédences, façades de meubles. Plus de 50 finitions disponibles, pose en 1 journée, garanti 10 ans."
        url="https://coverswap.fr/prestations/cuisine"
      />
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Prestations", url: "https://coverswap.fr/prestations" }, { name: "Covering Cuisine", url: "https://coverswap.fr/prestations/cuisine" }]} />

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative section-padding pt-40 overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1758315417321-83eb30a39710?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.80)"
          fadeTop={false}
          fadeBottom
        />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-rouge/5 blur-[100px]" />
        <div className="container-custom relative z-20">
          <ScrollReveal direction="fade">
            <Link
              href="/prestations"
              className="inline-flex items-center gap-2 text-gris-400 hover:text-white transition-colors mb-8 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Toutes les prestations
            </Link>
          </ScrollReveal>

          <ScrollReveal direction="up">
            <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">
              Covering Cuisine
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight max-w-3xl">
              Relookez votre cuisine <span className="text-rouge">sans travaux</span>, en 1 journée
            </h1>
            <p className="text-gris-300 text-lg max-w-2xl leading-relaxed mb-10">
              Plans de travail, crédences, façades de meubles : transformez chaque surface avec un revêtement adhésif
              texturé haut de gamme. Plus de 50 finitions marbre, bois et béton, posées en une seule journée, pour un
              budget 10x inférieur à une rénovation classique.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/simulation" className="btn-primary">
                Simuler mon projet
              </Link>
              <Link href="/contact" className="btn-secondary">
                Demander un devis
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════ INTRODUCTION / PROBLEM-SOLUTION ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Pourquoi le covering est la <span className="text-rouge">révolution</span> de la rénovation cuisine
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <div className="space-y-6">
                <p className="text-gris-300 leading-relaxed">
                  Rénover une cuisine de manière traditionnelle, c&apos;est un budget de 5 000 à 15 000 euros, 2 à 3
                  semaines de travaux, des artisans qui se succèdent, de la poussière dans toute la maison et
                  l&apos;impossibilité de cuisiner pendant des jours. Sans compter le stress de gérer un chantier au
                  cœur de votre quotidien.
                </p>
                <p className="text-gris-300 leading-relaxed">
                  Le covering adhésif change complètement la donne. En une seule journée, nos poseurs experts
                  recouvrent l&apos;ensemble de vos surfaces &mdash; plans de travail, crédences, façades &mdash;
                  d&apos;un film adhésif texturé haute performance. Pas de démolition, pas de poussière, pas de bruit.
                  Vous retrouvez une cuisine neuve le soir même.
                </p>
                <p className="text-gris-300 leading-relaxed">
                  Le résultat est bluffant : des finitions marbre, bois ou béton indiscernables des matériaux
                  d&apos;origine, garanties 10 ans, pour une fraction du prix. C&apos;est la solution choisie par plus
                  de 500 particuliers et professionnels en France.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "1 journée", label: "de pose" },
                  { value: "10x", label: "moins cher" },
                  { value: "10 ans", label: "de garantie" },
                  { value: "500+", label: "projets réalisés" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center"
                  >
                    <span className="block font-display text-3xl font-bold text-rouge mb-1">{stat.value}</span>
                    <span className="text-gris-400 text-sm">{stat.label}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════ SURFACES COUVERTES ══════════════════ */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1639405069836-f82aa6dcb900?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.82)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Toutes les surfaces de votre cuisine, <span className="text-rouge">transformées</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {surfaces.map((s, i) => (
              <ScrollReveal key={s.title} direction="up" delay={i * 0.1}>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-rouge/30 transition-all duration-300 h-full">
                  <span className="text-3xl mb-4 block">{s.icon}</span>
                  <h3 className="font-display text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-gris-400 text-sm leading-relaxed">{s.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FINITIONS DISPONIBLES ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Plus de 50 textures pour <span className="text-rouge">votre style</span>
            </h2>
            <p className="text-gris-400 text-center max-w-2xl mx-auto mb-16">
              Chaque finition est sélectionnée pour son réalisme, sa durabilité et sa résistance aux contraintes
              spécifiques de la cuisine.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {finitions.map((f, i) => (
              <ScrollReveal key={f.title} direction="up" delay={i * 0.08}>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-rouge/30 transition-all duration-300 h-full">
                  <h3 className="font-display text-xl font-bold mb-1">{f.title}</h3>
                  <span className="text-rouge text-sm font-medium block mb-3">{f.varieties}</span>
                  <p className="text-gris-400 text-sm leading-relaxed">{f.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PROCESSUS EN 4 ÉTAPES ══════════════════ */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1722605090433-41d1183a792d?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.82)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Un relooking cuisine <span className="text-rouge">clé en main</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-rouge/0 via-rouge/40 to-rouge/0" />

            {steps.map((s, i) => (
              <ScrollReveal key={s.num} direction="up" delay={i * 0.15}>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 relative h-full">
                  <div className="w-12 h-12 rounded-full bg-rouge/20 border border-rouge/40 flex items-center justify-center mb-6 relative z-10">
                    <span className="text-rouge font-display font-bold text-lg">{s.num}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3">{s.title}</h3>
                  <p className="text-gris-400 leading-relaxed text-sm">{s.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ AVANTAGES TECHNIQUES ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Pourquoi nos clients choisissent le <span className="text-rouge">covering cuisine</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantages.map((a, i) => (
              <ScrollReveal key={a.title} direction="up" delay={i * 0.06}>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center hover:border-rouge/30 transition-all duration-300 h-full">
                  <span className="text-3xl mb-3 block">{a.icon}</span>
                  <h3 className="font-display font-bold mb-1">{a.title}</h3>
                  <p className="text-gris-400 text-sm">{a.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ COMPARATIF ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom max-w-4xl">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Covering vs rénovation <span className="text-rouge">classique</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 text-center font-display font-bold text-sm sm:text-base">
                <div className="p-4 border-b border-white/10" />
                <div className="p-4 border-b border-l border-white/10 text-rouge">Covering CoverSwap</div>
                <div className="p-4 border-b border-l border-white/10 text-gris-400">Remplacement complet</div>
              </div>
              {comparatif.map((row, i) => (
                <div
                  key={row.critere}
                  className={`grid grid-cols-3 text-center text-sm ${
                    i < comparatif.length - 1 ? "border-b border-white/10" : ""
                  }`}
                >
                  <div className="p-4 text-left font-medium text-white">{row.critere}</div>
                  <div className="p-4 border-l border-white/10 text-gris-300">{row.covering}</div>
                  <div className="p-4 border-l border-white/10 text-gris-400">{row.classique}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════ CATALOGUE CTA ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom">
          <ScrollReveal direction="scale">
            <Link href="/revetements" className="block glass-card p-10 border-rouge/20 bg-rouge/5 hover:border-rouge/40 transition-all duration-300 group">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-rouge/10 flex items-center justify-center shrink-0 group-hover:bg-rouge/20 transition-colors">
                  <svg className="w-8 h-8 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                </div>
                <div className="text-center lg:text-left flex-1">
                  <h3 className="font-display text-2xl font-bold mb-2">
                    Explorez nos 267 références bois et <span className="text-rouge">+50 finitions</span> pour votre cuisine
                  </h3>
                  <p className="text-gris-400 leading-relaxed">
                    Parcourez notre catalogue complet de 497 références Cover Styl&apos; : marbre, bois, béton, métal et bien plus. Trouvez la finition parfaite pour chaque surface de votre cuisine.
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

      {/* ══════════════════ FAQ ══════════════════ */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1759238136854-913e5e383308?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20 max-w-3xl">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">
              Vos questions sur le <span className="text-rouge">covering cuisine</span>
            </h2>
          </ScrollReveal>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <ScrollReveal key={faq.q} direction="up" delay={i * 0.05}>
                <details className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 group cursor-pointer">
                  <summary className="flex items-center justify-between font-display font-bold text-lg list-none">
                    {faq.q}
                    <svg
                      className="w-5 h-5 text-rouge shrink-0 group-open:rotate-45 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </summary>
                  <p className="text-gris-400 mt-4 leading-relaxed">{faq.a}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom text-center">
          <ScrollReveal direction="scale">
            <div className="bg-white/5 backdrop-blur border border-rouge/20 bg-rouge/5 rounded-2xl p-12">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Prêt à transformer votre <span className="text-rouge">cuisine</span> ?
              </h2>
              <p className="text-gris-300 text-lg mb-8 max-w-xl mx-auto">
                Envoyez-nous les photos de votre cuisine et recevez un aperçu réaliste ainsi qu&apos;un devis
                personnalisé sous 48 heures. Simulation gratuite, sans engagement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/simulation" className="btn-primary text-lg px-10 py-5">
                  Simuler mon projet
                </Link>
                <Link href="/contact" className="btn-secondary text-lg px-10 py-5">
                  Demander un devis gratuit
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
