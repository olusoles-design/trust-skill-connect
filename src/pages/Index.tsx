import { useState } from "react";
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
import GetStartedModal from "@/components/landing/GetStartedModal";

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar onGetStarted={() => setModalOpen(true)} />
      <Hero onGetStarted={() => setModalOpen(true)} />
      <ComplianceBanner />
      <UserPathways />
      <TripleVerification />
      <PlatformFeatures />
      <SupportMarketplace />
      <HowItWorks />
      <Testimonials />
      <CTASection onGetStarted={() => setModalOpen(true)} />
      <Footer />
      <GetStartedModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default Index;
