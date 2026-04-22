import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy text-white/60 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
                Skills<span className="text-teal">Mark</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              South Africa's connected skills development directory.
            </p>
          </div>

          {/* Links */}
          {[
            {
              heading: "Platform",
              links: ["For Learners", "For Sponsors", "For SDPs", "For Practitioners", "For Suppliers"],
            },
            {
              heading: "Features",
              links: ["Directory Search", "Profiles", "BEE Dashboard", "Marketplace", "Micro-Tasks"],
            },
            {
              heading: "Compliance",
              links: ["POPIA Policy", "SETA Reporting", "BEE Verification", "SARS Compliance"],
            },
            {
              heading: "Company",
              links: ["About", "Careers", "Blog", "Contact", "Partners"],
            },
          ].map((col) => (
            <div key={col.heading}>
              <div className="font-semibold text-white text-sm mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
                {col.heading}
              </div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs">© 2025 SkillsMark (Pty) Ltd. All rights reserved. Registered in South Africa.</p>
          <p className="text-xs">POPIA Compliant · SETA Aligned · B-BBEE Ready</p>
        </div>
      </div>
    </footer>
  );
}
