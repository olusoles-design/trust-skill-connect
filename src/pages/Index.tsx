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

type ModalRole = "learner" | "sponsor" | "provider" | "practitioner" | "support_provider" | null;

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState<ModalRole>(null);

  const openModal = (role: ModalRole = null) => {
    setModalRole(role);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar onGetStarted={() => openModal()} />
      <Hero onGetStarted={() => openModal()} />
      <ComplianceBanner />
      <UserPathways onRoleSelect={openModal} />
      <TripleVerification />
      <PlatformFeatures />
      <SupportMarketplace />
      <HowItWorks />
      <Testimonials />
      <CTASection onGetStarted={() => openModal()} />
      <Footer />
      <GetStartedModal open={modalOpen} onClose={() => setModalOpen(false)} initialRole={modalRole} />
    </div>
  );
};

export default Index;
