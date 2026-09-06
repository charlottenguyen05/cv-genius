import { Sparkles, FileText, Download } from "lucide-react";

/* ── Features from the CV Genius project ────────────── */
const features = [
  {
    id: "feature-ai",
    variant: "dark" as const, // dark green card (like Image 2 card 1)
    icon: Sparkles,
    tag: "Gemini AI",
    title: "Saisie Intelligente",
    description:
      "Saisissez vos expériences en vrac. Notre IA Gemini structure, reformule et optimise automatiquement votre contenu pour les recruteurs.",
    mockup: (
      <div className="mt-4 bg-white/10 rounded-xl p-3 border border-white/10">
        <p className="text-[10px] text-primary-300 mb-1 font-semibold uppercase tracking-wider">
          Brouillon saisi
        </p>
        <div className="space-y-1">
          {["Expérience dev web 3 ans...", "Maîtrise React, Node.js...", "Projet e-commerce livré..."].map(
            (line, i) => (
              <div
                key={i}
                className="h-2 bg-white/20 rounded-full"
                style={{ width: `${85 - i * 12}%` }}
              />
            )
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-primary-400" />
          <p className="text-[9px] text-primary-300 font-medium">Génération en cours...</p>
          <div className="flex gap-0.5 ml-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-primary-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "feature-manage",
    variant: "light" as const, // light green tint card (like Image 2 card 2)
    icon: FileText,
    tag: "Dashboard",
    title: "Gérez Vos CVs",
    description:
      "Organisez, consultez et modifiez tous vos CVs depuis votre espace personnel. Gardez une vision complète de votre portfolio.",
    mockup: (
      <div className="mt-4 space-y-2">
        {[
          { name: "CV Développeur", score: 92 },
          { name: "CV Designer", score: 78 },
          { name: "CV Consultant", score: 85 },
        ].map((cv, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-medium text-gray-700">{cv.name}</span>
            </div>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
              {cv.score}%
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "feature-export",
    variant: "white" as const, // plain white card (like Image 2 card 3)
    icon: Download,
    tag: "Export PDF",
    title: "Export & Partage",
    description:
      "Téléchargez votre CV au format PDF professionnel en un clic. Optimisé pour les systèmes ATS et prêt à être partagé.",
    mockup: (
      <div className="mt-4">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-600">Aperçu PDF</span>
            <span className="text-[9px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
              ATS Compatible
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 bg-gray-800 rounded-full w-2/3" />
            <div className="h-1.5 bg-gray-300 rounded-full w-full" />
            <div className="h-1.5 bg-gray-300 rounded-full w-4/5" />
            <div className="h-1.5 bg-gray-200 rounded-full w-full mt-2" />
            <div className="h-1.5 bg-gray-200 rounded-full w-3/4" />
          </div>
          <div className="mt-3 flex justify-end">
            <div className="flex items-center gap-1 bg-primary-500 text-white rounded-lg px-3 py-1.5 cursor-pointer">
              <Download className="w-3 h-3" />
              <span className="text-[10px] font-semibold">Télécharger</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

/* ── Variant styles ───────────────────────────────── */
const variantStyles = {
  dark:  "bg-dark-card text-white",
  light: "bg-primary-50 text-gray-900 border border-primary-100",
  white: "bg-white text-gray-900 border border-gray-100 shadow-sm",
};

const tagStyles = {
  dark:  "bg-white/15 text-primary-300",
  light: "bg-primary-100 text-primary-700",
  white: "bg-gray-100 text-gray-600",
};

const descStyles = {
  dark:  "text-gray-300",
  light: "text-gray-600",
  white: "text-gray-500",
};

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-surface-tint">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-label mb-4">// Nos Fonctionnalités //</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            Créez Votre CV Parfait
            <br />
            De A à Z
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className={`rounded-3xl p-6 ${variantStyles[feature.variant]} transition-transform duration-300 hover:-translate-y-1`}
                data-testid={feature.id}
              >
                {/* Tag */}
                <span
                  className={`inline-block text-[11px] font-semibold px-3 py-1 rounded-full mb-4 ${tagStyles[feature.variant]}`}
                >
                  {feature.tag}
                </span>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>

                {/* Description */}
                <p className={`text-sm leading-relaxed ${descStyles[feature.variant]}`}>
                  {feature.description}
                </p>

                {/* Mockup illustration */}
                {feature.mockup}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
