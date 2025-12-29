import { useState, useEffect } from "react";
import { FileText, CreditCard, Clock, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { getTermsSections, getAdditionalTerms, getSiteContent, subscribeToTable, unsubscribe, DISCORD_URL, type TermsSection, type AdditionalTerm } from "@/lib/supabase";

const icons: Record<string, any> = { FileText, CreditCard, Clock, Shield };

const defaultContent = {
  header: { title: "Terms & Conditions", subtitle: "Clear and transparent terms for our professional 3D modeling services. Please read carefully before starting your project." },
  footer: { text: "Last updated: December 2024" },
  contact: { title: "Questions about these terms?", subtitle: "If you have any questions about these terms and conditions, feel free to reach out before starting your project." }
};

export function TermsPage() {
  const [sections, setSections] = useState<TermsSection[]>([]);
  const [additional, setAdditional] = useState<AdditionalTerm[]>([]);
  const [content, setContent] = useState(defaultContent);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const ch1 = subscribeToTable("terms_sections", loadData);
    const ch2 = subscribeToTable("additional_terms", loadData);
    const ch3 = subscribeToTable("site_content", loadData);
    return () => { unsubscribe(ch1); unsubscribe(ch2); unsubscribe(ch3); };
  }, []);

  const loadData = async () => {
    const [s, a, c] = await Promise.all([getTermsSections(), getAdditionalTerms(), getSiteContent("terms")]);
    setSections(s);
    setAdditional(a);
    if (Object.keys(c).length > 0) setContent({ ...defaultContent, ...c });
    setLoading(false);
  };

  return (
    <main className="pt-14 min-h-screen">
      {/* Header */}
      <section className="py-12 sm:py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
          Terms & <span className="text-primary">Conditions</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">{content.header.subtitle}</p>
      </section>

      {/* Main Sections - 2x2 Grid */}
      {loading ? (
        <section className="container-custom pb-12 sm:pb-16">
          <div className="text-center py-12 text-gray-400">Loading...</div>
        </section>
      ) : (
        <section className="container-custom pb-12 sm:pb-16">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {sections.map((section) => {
              const Icon = icons[section.icon] || FileText;
              return (
                <div key={section.id} className="card">
                  <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                    {section.title}
                  </h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-400">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Additional Terms */}
      {additional.length > 0 && (
        <section className="container-custom pb-12 sm:pb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">Additional Terms</h2>
          <div className="max-w-3xl mx-auto space-y-1">
            {additional.map((term) => (
              <div key={term.id} className="border-b border-dark-600">
                <button
                  onClick={() => setOpen(open === term.id ? null : term.id)}
                  className="w-full flex items-center justify-between py-3 sm:py-4 text-left"
                >
                  <span className="font-medium text-sm sm:text-base pr-4">{term.title}</span>
                  {open === term.id ? (
                    <ChevronUp className="w-5 h-5 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 shrink-0" />
                  )}
                </button>
                {open === term.id && (
                  <p className="pb-3 sm:pb-4 text-gray-400 text-xs sm:text-sm">{term.content}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="container-custom pb-12 sm:pb-16">
        <div className="card text-center max-w-3xl mx-auto bg-dark-600">
          <h3 className="text-lg sm:text-xl font-bold mb-2">{content.contact.title}</h3>
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">{content.contact.subtitle}</p>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Contact Me
          </a>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">{content.footer.text}</div>
    </main>
  );
}
