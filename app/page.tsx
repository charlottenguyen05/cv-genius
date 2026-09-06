import HeroSection from "@/components/landing/HeroSection";
import LogoBar from "@/components/landing/LogoBar";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";

export default function HomePage() {
  return (
    <div data-testid="homepage">
      {/* 1. Hero — large title, floating profile cards, CTA buttons */}
      <HeroSection />

      {/* 2. Logo bar — technologies used in this project */}
      <LogoBar />

      {/* 3. Stats — About the platform + 98% satisfaction / 100+ CVs */}
      <StatsSection />

      {/* 4. Features — 3 illustrated cards (AI input, manage CVs, export PDF) */}
      <FeaturesSection />
    </div>
  );
}
