"use client";
import useUserStatus from "@/lib/hooks/useUserStatus";
import { Sparkles, FileText, Zap, Users, Code, Database } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useUserStatus();

  const features = [
    {
      icon: Sparkles,
      title: "IA Générative",
      description:
        "Transformez vos idées brouillonnes en CV professionnel grâce à Gemini AI",
    },
    {
      icon: FileText,
      title: "Templates Modernes",
      description:
        "Choisissez parmi des modèles optimisés pour les ATS et recruteurs",
    },
    {
      icon: Zap,
      title: "Génération Rapide",
      description: "Obtenez votre CV optimisé en quelques secondes seulement",
    },
  ];

  const techStack = [
    {
      icon: Code,
      name: "Next.js 14",
      description: "App Router + Server Components",
    },
    {
      icon: Database,
      name: "Supabase",
      description: "Auth + Base de données temps réel",
    },
    {
      icon: Sparkles,
      name: "Gemini AI",
      description: "Intelligence artificielle avancée",
    },
    {
      icon: Users,
      name: "TypeScript",
      description: "Développement type-safe",
    },
  ];

  const learningObjectives = [
    "Clean Code & SOLID",
    "Design Patterns",
    "Tests (Unit, Integration, E2E)",
    "CI/CD avec Vercel",
    "Git & Workflow",
    "PostgreSQL & Supabase",
    "APIs REST",
    "Méthodologie Scrum",
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50" data-testid="homepage">

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Projet pédagogique - En développement
            {process.env.NODE_ENV === "development" && (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-700">
                🚧 Mode développement
              </span>
            )}
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transformez votre CV avec l'
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Intelligence Artificielle
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Saisissez vos expériences en vrac, notre IA les transforme en CV
            professionnel optimisé pour les recruteurs et les systèmes ATS.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* 🔧 SUGGESTION: Conditionner l'affichage selon l'état utilisateur */}
            {user ? (
              <Link
                href="/dashboard"
                className="btn-primary text-lg px-8 py-4 rounded-full"
                data-testid="start-building-cta"
              >
                Commencer mon CV
              </Link>
            ) : (
              <Link
                href="/register"
                className="btn-primary text-lg px-8 py-4 rounded-full"
                data-testid="get-started-cta"
              >
                Commencer gratuitement
              </Link>
            )}
            <Link
              href="/dashboard"
              className="btn-secondary text-lg px-8 py-4 rounded-full"
              data-testid="demo-link"
            >
              Voir la démo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir CV Genius ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une approche moderne et intelligente pour créer des CV qui se
              démarquent
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card hover:shadow-lg transition-shadow duration-300"
                // 🔧 SUGGESTION: Ajouter data-testid pour les tests
                data-testid={`feature-${index}`}
              >
                <feature.icon className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Technologies Modernes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Construit avec les meilleures technologies pour une expérience
              optimale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                // 🔧 SUGGESTION: Ajouter data-testid pour les tests
                data-testid={`tech-${index}`}
              >
                <tech.icon className="w-8 h-8 text-primary-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">
                  {tech.name}
                </h4>
                <p className="text-sm text-gray-600">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à créer votre CV parfait ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rejoignez les utilisateurs qui ont déjà transformé leur carrière
            avec CV Genius
          </p>

          {/* 🔧 SUGGESTION: Conditionner selon l'état utilisateur */}
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full font-semibold text-lg transition-colors"
              data-testid="cta-build-cv"
            >
              Créer mon CV maintenant
              <Sparkles className="w-5 h-5 ml-2" />
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-flex items-center bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full font-semibold text-lg transition-colors"
              data-testid="cta-register"
            >
              Commencer gratuitement
              <Sparkles className="w-5 h-5 ml-2" />
            </Link>
          )}
        </div>
      </section>

    </div>
  );
}
