import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import MeetCarlSection from "@/components/landing/MeetCarlSection";
import PersonalitySection from "@/components/landing/PersonalitySection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TransparencySection from "@/components/landing/TransparencySection";
import AnalyticsSection from "@/components/landing/AnalyticsSection";
import RolesSection from "@/components/landing/RolesSection";
import CandidateSection from "@/components/landing/CandidateSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import StatsSection from "@/components/landing/StatsSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import PreLoader from "@/components/landing/PreLoader";
import ScrollReveal from "@/components/landing/ScrollReveal";

export default function Home() {
  return (
    <>
      <PreLoader />
      <Navbar />
      <main>
        <HeroSection />
        <ScrollReveal><ProblemSection /></ScrollReveal>
        <ScrollReveal><SolutionSection /></ScrollReveal>
        <ScrollReveal><MeetCarlSection /></ScrollReveal>
        <ScrollReveal><PersonalitySection /></ScrollReveal>
        <ScrollReveal><HowItWorksSection /></ScrollReveal>
        <ScrollReveal><FeaturesSection /></ScrollReveal>
        <ScrollReveal><TransparencySection /></ScrollReveal>
        <ScrollReveal><AnalyticsSection /></ScrollReveal>
        <ScrollReveal><RolesSection /></ScrollReveal>
        <ScrollReveal><CandidateSection /></ScrollReveal>
        <ScrollReveal><TestimonialsSection /></ScrollReveal>
        <ScrollReveal><StatsSection /></ScrollReveal>
        {/* <PricingSection /> */}
        <ScrollReveal><FAQSection /></ScrollReveal>
        <ScrollReveal><CTASection /></ScrollReveal>
      </main>
      <ScrollReveal><Footer /></ScrollReveal>
    </>
  );
}
