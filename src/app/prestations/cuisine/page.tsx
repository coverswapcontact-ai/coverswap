import type { Metadata } from "next";
import Link from "next/link";
import TextureBackground from "@/components/TextureBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { ServiceSchema, FAQSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Covering Cuisine | Relooking Plan de Travail & Meubles Sans Travaux",
  description:
    "Renovez votre cuisine en 1 journee avec le covering adhesif. Plans de travail, credences, facades de meubles. 50+ textures marbre, bois, beton. Garanti 10 ans. Devis gratuit.",
  keywords:
    "covering cuisine, relooking cuisine sans travaux, film adhesif plan de travail, renovation cuisine adhesif, covering plan de travail, covering meuble cuisine, revetement adhesif cuisine",
};

const faqs = [
  {
    q: "Le covering resiste-t-il a la chaleur des plaques de cuisson ?",
    a: "Nos films adhesifs sont certifies pour resister jusqu'a 75 °C en contact direct et prolonge. Autour des plaques de cuisson, nous posons un film technique haute temperature et recommandons l'usage de dessous-de-plat pour les casseroles brulantes. Aucun risque de decollement ni de deformation dans des conditions normales d'utilisation.",
  },
  {
    q: "Peut-on poser du covering sur un plan de travail stratifie ?",
    a: "Oui, le stratifie est l'un des supports les plus adaptes au covering. Apres un nettoyage minutieux et l'application d'un primaire d'accroche, le film adhere parfaitement et durablement. Nous intervenons egalement sur le melamine, le carrelage, l'inox et le bois brut.",
  },
  {
    q: "Combien de temps dure un covering cuisine ?",
    a: "Avec un entretien normal, nos revetements conservent leur aspect pendant 7 a 10 ans minimum. Ils sont garantis contre le decollement, le jaunissement et la delamination. Passe ce delai, le film peut etre retire et remplace par une nouvelle finition.",
  },
  {
    q: "Le covering supporte-t-il l'eau et les projections ?",
    a: "Absolument. Nos films sont 100 % impermeables et resistent aux projections d'eau, de graisse et de produits menagers courants. Les joints sont scelles avec un mastic alimentaire transparent pour une etancheite totale au niveau des eviers et credences.",
  },
  {
    q: "Peut-on mettre du covering sur des meubles de cuisine IKEA ?",
    a: "C'est meme l'un de nos cas les plus frequents. Les facades IKEA en melamine sont un support ideal pour le covering. Nous transformons regulierement des cuisines METOD et KALLARP pour leur donner un aspect haut de gamme a une fraction du cout d'un remplacement.",
  },
  {
    q: "Quel est le prix d'un covering cuisine complet ?",
    a: "Le prix varie selon la surface a couvrir et les finitions choisies. En moyenne, un covering cuisine complet (plans de travail + facades + credence) revient entre 1 200 et 3 500 euros, soit 5 a 10 fois moins qu'une renovation classique. Chaque devis est personnalise et gratuit.",
  },
  {
    q: "Le covering est-il reversible ?",
    a: "Oui, c'est l'un de ses grands avantages. Le film adhesif peut etre retire a tout moment sans endommager le support d'origine. Un decapeur thermique permet un retrait propre, et la surface retrouve son etat initial. Ideal pour les locataires ou ceux qui aiment changer de style.",
  },
  {
    q: "Comment entretenir un plan de travail recouvert ?",
    a: "L'entretien est tres simple : un chiffon doux humide avec un peu de produit vaisselle suffit. Evitez les eponges abrasives et les solvants agressifs. Nos films sont anti-traces et oleofuges, ce qui facilite le nettoyage quotidien. Aucun traitement particulier n'est necessaire.",
  },
];

const surfaces = [
  {
    icon: "🍳",
    title: "Plans de travail",
    description:
      "Stratifie, melamine ou carrelage : recouvrez votre plan de travail d'une finition marbre, bois ou beton sans depose.",
  },
  {
    icon: "🧱",
    title: "Credences",
    description:
      "Remplacez le carrelage vieillissant par un film adhesif lisse, facile a nettoyer et resistant aux projections.",
  },
  {
    icon: "🚪",
    title: "Facades de meubles",
    description:
      "Donnez un second souffle a vos caissons hauts et bas avec des facades effet laque, bois naturel ou couleur unie.",
  },
  {
    icon: "🗄️",
    title: "Tiroirs et poignees",
    description:
      "Chaque detail compte : harmonisez tiroirs, plinthes et poignees pour un rendu coherent et soigne.",
  },
  {
    icon: "🏝️",
    title: "Ilots centraux",
    description:
      "Transformez votre ilot en piece maitresse avec une finition premium : marbre Calacatta, chene clair ou beton cire.",
  },
  {
    icon: "📦",
    title: "Elements hauts et bas",
    description:
      "Colonnes, meubles d'angle, habillages de hotte : toutes les surfaces sont couvertes pour un resultat uniforme.",
  },
];

const finitions = [
  {
    title: "Marbre",
    varieties: "Carrara, Calacatta, noir Marquina",
    description:
      "Veinage naturel et profondeur de matiere pour un rendu luxueux. Toucher lisse et brillant, indiscernable du vrai marbre.",
  },
  {
    title: "Bois",
    varieties: "Chene clair, noyer, teck",
    description:
      "Grain et texture reproduits au millimetre. Chaleur du bois naturel sans les contraintes d'entretien ni la sensibilite a l'humidite.",
  },
  {
    title: "Beton",
    varieties: "Gris anthracite, beton cire",
    description:
      "L'esprit loft et industriel dans votre cuisine. Finition mate et minerale avec une resistance superieure au vrai beton cire.",
  },
  {
    title: "Couleurs unies",
    varieties: "Mat, satine, brillant",
    description:
      "Du blanc eclatant au noir profond en passant par toutes les teintes RAL. Finition uniforme et sans defaut pour un style epure.",
  },
  {
    title: "Metal",
    varieties: "Inox brosse, laiton, cuivre",
    description:
      "Reflets metalliques authentiques pour une touche contemporaine. Ideal pour les credences, ilots et elements de contrast.",
  },
  {
    title: "Pierre naturelle",
    varieties: "Ardoise, granit, travertin",
    description:
      "Texture et grain de la pierre veritable. Robustesse visuelle et elegance brute pour une cuisine de caractere.",
  },
];

const steps = [
  {
    num: "01",
    title: "Envoyez vos photos",
    description:
      "Photographiez votre cuisine sous differents angles. Notre IA analyse les surfaces et genere un devis detaille en 48 heures.",
  },
  {
    num: "02",
    title: "Choix des finitions",
    description:
      "Selectionnez vos textures parmi 50+ references. Nous vous envoyons des echantillons physiques pour valider couleurs et toucher.",
  },
  {
    num: "03",
    title: "Preparation des surfaces",
    description:
      "Nettoyage professionnel, degraissage, application d'un primaire d'accroche. Chaque surface est preparee pour une adhesion parfaite.",
  },
  {
    num: "04",
    title: "Pose professionnelle",
    description:
      "Nos poseurs certifies interviennent en 1 journee. Decoupe sur mesure, maroufflage sans bulles, finitions impeccables. Resultat immediat.",
  },
];

const avantages = [
  { icon: "🔥", title: "Resistant chaleur", description: "Jusqu'a 75 °C en contact direct" },
  { icon: "💧", title: "Resistant eau et humidite", description: "100 % impermeable, joints scelles" },
  { icon: "🛡️", title: "Anti-rayures et anti-taches", description: "Surface oleofuge haute densite" },
  { icon: "🧹", title: "Entretien simple", description: "Eau + chiffon doux, sans produit special" },
  { icon: "✅", title: "Garanti 10 ans", description: "Anti-decollement, anti-jaunissement" },
  { icon: "♻️", title: "Reversible sans traces", description: "Retrait propre, support preserve" },
  { icon: "🍽️", title: "Conforme normes alimentaires", description: "Contact alimentaire indirect certifie" },
  { icon: "🌱", title: "Ecologique (0 dechet)", description: "Pas de demolition, pas de gravats" },
];

const comparatif = [
  { critere: "Prix moyen", covering: "1 200 - 3 500 euros", classique: "5 000 - 15 000 euros" },
  { critere: "Duree des travaux", covering: "1 journee", classique: "2 a 3 semaines" },
  { critere: "Poussiere / Bruit", covering: "Aucun", classique: "Important" },
  { critere: "Demenagement necessaire", covering: "Non", classique: "Souvent oui" },
  { critere: "Durabilite", covering: "7 a 10 ans garanti", classique: "15 a 20 ans" },
  { critere: "Personnalisation", covering: "50+ textures, changeable", classique: "Limitee au choix initial" },
  { critere: "Impact ecologique", covering: "Minimal (0 dechet)", classique: "Eleve (demolition, transport)" },
];

export default function CuisinePage() {
  return (
    <main className="bg-noir min-h-screen">
      <ServiceSchema
        name="Covering Cuisine"
        description="Renovation de cuisine par revetement adhesif texture : plans de travail, credences, facades de meubles. Plus de 50 finitions disponibles, pose en 1 journee, garanti 10 ans."
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
              Relookez votre cuisine <span className="text-rouge">sans travaux</span>, en 1 journee
            </h1>
            <p className="text-gris-300 text-lg max-w-2xl leading-relaxed mb-10">
              Plans de travail, credences, facades de meubles : transformez chaque surface avec un revetement adhesif
              texture haut de gamme. Plus de 50 finitions marbre, bois et beton, posees en une seule journee, pour un
              budget 10x inferieur a une renovation classique.
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
              Pourquoi le covering est la <span className="text-rouge">revolution</span> de la renovation cuisine
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <div className="space-y-6">
                <p className="text-gris-300 leading-relaxed">
                  Renover une cuisine de maniere traditionnelle, c&apos;est un budget de 5 000 a 15 000 euros, 2 a 3
                  semaines de travaux, des artisans qui se succedent, de la poussiere dans toute la maison et
                  l&apos;impossibilite de cuisiner pendant des jours. Sans compter le stress de gerer un chantier au
                  coeur de votre quotidien.
                </p>
                <p className="text-gris-300 leading-relaxed">
                  Le covering adhesif change completement la donne. En une seule journee, nos poseurs experts
                  recouvrent l&apos;ensemble de vos surfaces &mdash; plans de travail, credences, facades &mdash;
                  d&apos;un film adhesif texture haute performance. Pas de demolition, pas de poussiere, pas de bruit.
                  Vous retrouvez une cuisine neuve le soir meme.
                </p>
                <p className="text-gris-300 leading-relaxed">
                  Le resultat est bluffant : des finitions marbre, bois ou beton indiscernables des materiaux
                  d&apos;origine, garanties 10 ans, pour une fraction du prix. C&apos;est la solution choisie par plus
                  de 500 particuliers et professionnels en France.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "1 journee", label: "de pose" },
                  { value: "10x", label: "moins cher" },
                  { value: "10 ans", label: "de garantie" },
                  { value: "500+", label: "projets realises" },
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
              Toutes les surfaces de votre cuisine, <span className="text-rouge">transformees</span>
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
              Chaque finition est selectionnee pour son realisme, sa durabilite et sa resistance aux contraintes
              specifiques de la cuisine.
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

      {/* ══════════════════ PROCESSUS EN 4 ETAPES ══════════════════ */}
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
              Un relooking cuisine <span className="text-rouge">cle en main</span>
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
              Covering vs renovation <span className="text-rouge">classique</span>
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
                Pret a transformer votre <span className="text-rouge">cuisine</span> ?
              </h2>
              <p className="text-gris-300 text-lg mb-8 max-w-xl mx-auto">
                Envoyez-nous les photos de votre cuisine et recevez un apercu realiste ainsi qu&apos;un devis
                personnalise sous 48 heures. Simulation gratuite, sans engagement.
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
