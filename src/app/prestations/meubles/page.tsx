import type { Metadata } from "next";
import Link from "next/link";
import TextureBackground from "@/components/TextureBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { ServiceSchema, FAQSchema, BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Covering Meuble | Relooking Mobilier Adhésif Bois, Marbre & Couleurs",
  description:
    "Donnez une seconde vie à vos meubles avec le covering adhésif. Commodes, buffets, bibliothèques, tables. Effets bois, marbre, couleurs unies. Résultat pro garanti 10 ans.",
  keywords:
    "covering meuble, relooking meuble adhésif, film adhésif meuble, rénovation meuble sans poncer, covering mobilier, habillage meuble adhésif",
};

const meubleTypes = [
  {
    title: "Commodes et buffets",
    description:
      "Modernisez vos commodes et buffets avec un covering effet bois naturel, laque mate ou marbre. La transformation est totale.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    title: "Bibliothèques et étagères",
    description:
      "Donnez du cachet à vos bibliothèques ouvertes ou fermées. Le covering transforme un meuble banal en pièce maîtresse.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    title: "Tables et bureaux",
    description:
      "Plateaux rayés, démodés ou ternes : le covering redonne vie à vos tables et bureaux avec un rendu lisse et impeccable.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
      </svg>
    ),
  },
  {
    title: "Armoires et dressings",
    description:
      "Portes coulissantes, façades battantes : le covering s\u2019adapte à toutes les configurations pour un dressing sur-mesure.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    title: "Meubles TV et consoles",
    description:
      "Sublimez votre espace salon avec un meuble TV recouvert d\u2019un film chêne clair, noyer fumé ou béton ciré.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    title: "Têtes de lit",
    description:
      "Créez une tête de lit unique et élégante grâce à un revêtement adhésif texturé bois, cuir ou tissu.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
      </svg>
    ),
  },
  {
    title: "Meubles de cuisine",
    description:
      "Façades, caissons, îlots : le covering cuisine mérite sa propre page. Découvrez nos solutions dédiées.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      </svg>
    ),
    link: "/prestations/cuisine",
  },
  {
    title: "Meubles IKEA et grande distribution",
    description:
      "Kallax, Billy, Malm, Bestå : le covering transforme un meuble en kit en pièce design unique et personnalisée.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
];

const finitions = [
  { name: "Chêne naturel clair", style: "Scandinave", color: "bg-amber-100" },
  { name: "Noyer fumé", style: "Luxe", color: "bg-amber-900" },
  { name: "Marbre blanc veiné", style: "Chic", color: "bg-gray-100" },
  { name: "Béton ciré", style: "Industriel", color: "bg-gray-400" },
  { name: "Couleurs mates", style: "Terracotta, vert sauge, bleu nuit", color: "bg-orange-700" },
  { name: "Métal brossé", style: "Moderne", color: "bg-zinc-500" },
];

const steps = [
  {
    num: "01",
    title: "Envoyez vos photos",
    description:
      "Photographiez les meubles à transformer et recevez une simulation du résultat par IA en quelques secondes.",
  },
  {
    num: "02",
    title: "Choisissez votre finition",
    description:
      "Chêne, noyer, marbre, béton, couleurs mates... Sélectionnez la texture qui correspond à votre intérieur.",
  },
  {
    num: "03",
    title: "Pose professionnelle",
    description:
      "Nos experts recouvrent vos meubles sur place, sans démontage. La pose est rapide, propre et sans odeur.",
  },
  {
    num: "04",
    title: "Profitez du résultat",
    description:
      "Vos meubles sont transformés, durables et garantis 10 ans. Le résultat est bluffant de réalisme.",
  },
];

const avantages = [
  {
    title: "Sans ponçage ni sous-couche",
    description: "Le covering adhère directement sur la surface existante. Aucune préparation lourde n\u2019est nécessaire.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  {
    title: "Sans odeur ni COV",
    description: "Contrairement à la peinture, le covering ne dégage aucune substance volatile. Posable en milieu habité.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    title: "Pose en quelques heures",
    description: "Un meuble est recouvert en 1 à 3 heures selon sa taille. Pas besoin de bloquer une journée entière.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Thermoformable",
    description: "Le film s\u2019adapte aux arrondis, moulures et reliefs grâce à la technique de chauffe thermique.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      </svg>
    ),
  },
  {
    title: "Résistant rayures et taches",
    description: "Le film est traité anti-rayures et anti-taches. Il supporte l\u2019usure quotidienne sans broncher.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Réversible sans traces",
    description: "Envie de changer ? Le film se retire proprement sans abîmer la surface d\u2019origine du meuble.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
    ),
  },
  {
    title: "Écologique (0 déchet)",
    description: "Pas de meuble jeté, pas de peinture, pas de solvant. Le covering est la solution éco-responsable.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67" />
      </svg>
    ),
  },
  {
    title: "Économique vs achat neuf",
    description: "Le covering coûte 3 à 5 fois moins cher que le remplacement. Votre budget vous remerciera.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: "Sur quels types de surfaces le covering adhère-t-il ?",
    a: "Le covering adhère sur la grande majorité des surfaces lisses : bois massif, MDF, mélaminé, stratifié, métal, verre et même certains plastiques. Nos poseurs évaluent chaque surface avant intervention pour garantir une adhérence optimale et durable.",
  },
  {
    q: "Le covering tient-il sur du mélaminé ou du stratifié ?",
    a: "Oui, parfaitement. Le mélaminé et le stratifié sont même parmi les surfaces les plus faciles à recouvrir. Le film adhésif adhère de manière stable et durable sur ces matériaux, sans nécessiter de sous-couche ni de ponçage préalable.",
  },
  {
    q: "Peut-on recouvrir un meuble IKEA Kallax ou Billy ?",
    a: "Absolument, c\u2019est l\u2019un de nos cas les plus fréquents. Le covering transforme un meuble en kit basique en pièce design unique. Kallax, Billy, Malm, Bestå : tous les modèles sont compatibles et le résultat est bluffant.",
  },
  {
    q: "Le film adhésif résiste-t-il aux rayures du quotidien ?",
    a: "Nos films sont traités avec un vernis anti-rayures de qualité professionnelle. Ils résistent aux frottements quotidiens, aux ongles, aux objets posés et déplacés. La surface conserve son aspect neuf pendant des années.",
  },
  {
    q: "Combien coûte le covering d\u2019un meuble ?",
    a: "Le prix varie selon la taille du meuble et la complexité de la pose (nombre de tiroirs, moulures, etc.). En moyenne, comptez 3 à 5 fois moins cher que l\u2019achat d\u2019un meuble neuf de qualité équivalente. Demandez un devis gratuit pour un chiffrage précis.",
  },
  {
    q: "Le covering meuble est-il réversible ?",
    a: "Oui, à 100 %. Le film adhésif se retire proprement à l\u2019aide d\u2019un décapeur thermique, sans laisser de résidus ni endommager la surface d\u2019origine. C\u2019est la solution idéale pour les locataires ou ceux qui aiment changer de style régulièrement.",
  },
  {
    q: "Quelle est la durée de vie du covering sur un meuble ?",
    a: "Avec un entretien normal (nettoyage à l\u2019éponge humide), le covering conserve son aspect d\u2019origine pendant 7 à 10 ans minimum. Nos films sont garantis contre le décollement et le jaunissement.",
  },
  {
    q: "Peut-on covering une table à manger en bois ?",
    a: "Oui, tout à fait. Le plateau d\u2019une table à manger est une surface idéale pour le covering. Le film résiste aux taches, à la chaleur modérée et aux nettoyages fréquents. C\u2019est une alternative élégante et économique au remplacement du plateau.",
  },
];

const stats = [
  { value: "10 ans", label: "de durabilité garantie" },
  { value: "0", label: "ponçage nécessaire" },
  { value: "50+", label: "textures disponibles" },
  { value: "100%", label: "réversible" },
];

export default function MeublesPage() {
  return (
    <main className="bg-noir min-h-screen">
      <ServiceSchema
        name="Covering Meuble - Relooking Mobilier Adhésif"
        description="Rénovation et relooking de meubles par revêtement adhésif professionnel. Commodes, buffets, bibliothèques, tables, armoires. Effets bois, marbre, couleurs unies. Garanti 10 ans."
        url="https://coverswap.fr/prestations/meubles"
      />
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Prestations", url: "https://coverswap.fr/prestations" }, { name: "Covering Meubles", url: "https://coverswap.fr/prestations/meubles" }]} />

      {/* Hero */}
      <section className="relative section-padding pt-40 overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1764526624453-db32c24eca55?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.80)"
          fadeTop={false}
          fadeBottom
        />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-rouge/5 blur-[100px]" />
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
              Covering Meubles
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight max-w-4xl">
              Offrez une seconde vie <span className="text-rouge">à vos meubles</span>, sans poncer ni peindre
            </h1>
            <p className="text-gris-300 text-lg max-w-2xl leading-relaxed mb-10">
              Covering adhésif professionnel pour tout type de mobilier. Effets bois, marbre, couleurs tendance.
              Résultat bluffant garanti 10 ans.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact" className="btn-primary">
                Demander un devis gratuit
              </Link>
              <a href="https://www.instagram.com/cover.swap/" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                Voir nos réalisations
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Problem-Solution */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-6">
              Rénover plutôt que jeter : <span className="text-rouge">l&apos;alternative intelligente</span>
            </h2>
            <p className="text-gris-300 text-center max-w-3xl mx-auto mb-16 text-lg leading-relaxed">
              Vos meubles sont démodés, rayés ou ternis, mais leur structure est encore solide. Les jeter serait du
              gaspillage — les remplacer coûterait une fortune. Le covering adhésif offre une transformation totale :
              sans poncer, sans peindre, sans odeur. En quelques heures, vos meubles retrouvent une allure neuve.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1}>
                <div className="glass-card p-6 text-center">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-rouge block mb-2">
                    {stat.value}
                  </span>
                  <span className="text-gris-400 text-sm">{stat.label}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Types de meubles */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1601224503166-47e6afa2fc92?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Tous vos meubles peuvent être <span className="text-rouge">transformés</span>
            </h2>
            <p className="text-gris-300 text-center max-w-2xl mx-auto mb-16">
              Du meuble IKEA en kit au buffet ancien de famille, le covering s&apos;adapte à toutes les formes et tous
              les matériaux.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {meubleTypes.map((m, i) => (
              <ScrollReveal key={m.title} delay={i * 0.08}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-lg bg-rouge/10 flex items-center justify-center text-rouge mb-4">
                    {m.icon}
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">{m.title}</h3>
                  <p className="text-gris-400 text-sm leading-relaxed flex-1">{m.description}</p>
                  {m.link && (
                    <Link
                      href={m.link}
                      className="inline-flex items-center gap-1 text-rouge text-sm font-semibold mt-4 hover:underline"
                    >
                      Voir le covering cuisine
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Finitions tendance */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Les finitions qui <span className="text-rouge">subliment votre intérieur</span>
            </h2>
            <p className="text-gris-300 text-center max-w-2xl mx-auto mb-16">
              Notre catalogue 2025 regroupe les textures les plus demandées par les architectes d&apos;intérieur et les
              particuliers exigeants.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {finitions.map((f, i) => (
              <ScrollReveal key={f.name} delay={i * 0.1}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-lg ${f.color} shrink-0`} />
                  <div>
                    <h3 className="font-display text-lg font-bold mb-1">{f.name}</h3>
                    <p className="text-gris-400 text-sm">{f.style}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Processus 4 étapes */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1687942918532-69295473701d?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.80)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
              Comment ça <span className="text-rouge">marche</span> ?
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <ScrollReveal key={s.num} delay={i * 0.12}>
                <div className="glass-card p-8 relative h-full">
                  <span className="text-rouge/20 font-display text-6xl font-bold absolute top-4 right-6">
                    {s.num}
                  </span>
                  <h3 className="font-display text-xl font-bold mb-3 mt-4">{s.title}</h3>
                  <p className="text-gris-400 leading-relaxed">{s.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Pourquoi le covering meuble <span className="text-rouge">séduit</span>
            </h2>
            <p className="text-gris-300 text-center max-w-2xl mx-auto mb-16">
              Économique, écologique, rapide et réversible : le covering coche toutes les cases pour redonner vie à
              votre mobilier.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantages.map((a, i) => (
              <ScrollReveal key={a.title} delay={i * 0.08}>
                <div className="glass-card p-6 hover:border-rouge/30 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-lg bg-rouge/10 flex items-center justify-center text-rouge mb-4">
                    {a.icon}
                  </div>
                  <h3 className="font-display text-base font-bold mb-2">{a.title}</h3>
                  <p className="text-gris-400 text-sm leading-relaxed">{a.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
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
                    Parcourez nos <span className="text-rouge">497 references</span> pour trouver la finition ideale
                  </h3>
                  <p className="text-gris-400 leading-relaxed">
                    Bois, marbre, beton, metal, couleurs unies : explorez le catalogue complet Cover Styl&apos; et trouvez la texture qui sublimera chacun de vos meubles.
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
          src="https://images.unsplash.com/photo-1684846416931-dddf8cbfc2ad?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.80)"
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
              <ScrollReveal key={faq.q} delay={i * 0.06}>
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

      {/* CTA Final */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <ScrollReveal>
            <div className="glass-card p-12 border-rouge/20 bg-rouge/5">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Vos meubles méritent un relooking
              </h2>
              <p className="text-gris-300 text-lg mb-8 max-w-xl mx-auto">
                Décrivez votre projet meuble et recevez un devis détaillé sous 48h. Sans engagement.
              </p>
              <Link href="/contact" className="btn-primary text-lg px-10 py-5">
                Demander un devis gratuit
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
