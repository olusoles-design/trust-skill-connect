import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ComplianceBanner from "@/components/landing/ComplianceBanner";
import UserPathways from "@/components/landing/UserPathways";
import TripleVerification from "@/components/landing/TripleVerification";
import PlatformFeatures from "@/components/landing/PlatformFeatures";
import SupportMarketplace from "@/components/landing/SupportMarketplace";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ComplianceBanner />
      <UserPathways />
      <TripleVerification />
      <PlatformFeatures />
      <SupportMarketplace />
      <HowItWorks />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
