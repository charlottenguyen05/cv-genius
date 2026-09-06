import Link from "next/link";

/* ── Stats data from the project ───────────────────── */
const stats = [
  {
    id: "stat-users",
    number: "100+",
    label: "CVs Créés",
    description:
      "Des professionnels ont déjà généré leur CV optimisé grâce à notre IA Gemini.",
  },
  {
    id: "stat-satisfaction",
    number: "98%",
    label: "Satisfaction",
    description:
      "Nos utilisateurs obtiennent des entretiens plus rapidement grâce à des CV optimisés ATS.",
  },
];

export default function StatsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Text content ────────────────────── */}
          <div>
            <p className="section-label mb-4">// À Propos de Notre Plateforme //</p>

            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
              Transformez Votre CV avec{" "}
              <span className="text-primary-500">une IA Plus Rapide,</span>
              <br />
              Plus Intelligente
            </h2>

            <p className="text-gray-500 text-base leading-relaxed mb-4 max-w-md">
              CV Genius exploite la puissance de Gemini AI pour analyser vos
              expériences brutes et les transformer en un document professionnel
              structuré, prêt pour les recruteurs et les systèmes ATS.
            </p>

            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
              De la saisie à l&apos;export PDF, notre plateforme simplifie chaque
              étape de la création de CV pour maximiser vos chances d&apos;être
              sélectionné.
            </p>

            <Link href="/register" className="btn-primary">
              À Propos
            </Link>
          </div>

          {/* ── Right: Stat cards with corner-brackets ─── */}
          <div className="flex flex-col gap-6">
            {/* Green radial glow behind cards */}
            <div className="relative">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(76,175,80,0.08) 0%, transparent 70%)",
                }}
              />

              <div className="flex flex-col gap-6 relative z-10">
                {stats.map((stat) => (
                  <div
                    key={stat.id}
                    className="corner-bracket bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                    data-testid={stat.id}
                  >
                    <h3 className="text-4xl md:text-5xl font-black text-primary-500 mb-1">
                      {stat.number}
                    </h3>
                    <p className="text-xl font-bold text-gray-700 mb-3">
                      {stat.label}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                      {stat.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
