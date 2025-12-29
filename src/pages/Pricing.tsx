import { useState, useEffect } from "react";
import { Check, Star, Clock, Package, Zap, Gift, ChevronDown, ChevronUp } from "lucide-react";
import { getPricing, getFAQs, getSiteContent, subscribeToTable, unsubscribe, DISCORD_URL, type Pricing, type FAQ } from "@/lib/supabase";

const defaultContent = {
  header: { title: "Pricing Plans", subtitle: "1$ = 250 Robux" },
  package_deals: { title: "Package Deals", subtitle: "Order multiple models and save!", items: ["3 Models = 5% OFF", "5 Models = 10% OFF", "10+ Models = 15% OFF"] },
  rush_delivery: { title: "Rush Delivery", subtitle: "Need it faster? We've got you covered!", items: ["24-48 hours delivery", "+30% of base price", "Priority queue"] },
  loyalty: { title: "Loyalty Program", description: "Returning customers get special discounts! After 5 completed orders, enjoy 5% off all future projects. After 10 orders, get 10% off permanently." },
  custom_quote: { title: "Need a custom quote?", description: "For large projects, bulk orders, or specialized requirements, I offer custom pricing tailored to your specific needs." }
};

export function PricingPage() {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [content, setContent] = useState(defaultContent);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const ch1 = subscribeToTable("pricing", loadData);
    const ch2 = subscribeToTable("faqs", loadData);
    const ch3 = subscribeToTable("site_content", loadData);
    return () => { unsubscribe(ch1); unsubscribe(ch2); unsubscribe(ch3); };
  }, []);

  const loadData = async () => {
    const [p, f, c] = await Promise.all([getPricing(), getFAQs(), getSiteContent("pricing")]);
    setPricing(p);
    setFaqs(f);
    if (Object.keys(c).length > 0) setContent({ ...defaultContent, ...c });
    setLoading(false);
  };

  // Sort pricing: non-popular first, popular in middle, non-popular last
  const sortedPricing = [...pricing].sort((a, b) => {
    if (a.is_popular && !b.is_popular) return 0;
    if (!a.is_popular && b.is_popular) return -1;
    return a.order_index - b.order_index;
  });

  // Reorder to put popular in the middle
  const orderedPricing = (() => {
    const popular = sortedPricing.find(p => p.is_popular);
    const others = sortedPricing.filter(p => !p.is_popular);
    if (!popular || others.length < 2) return sortedPricing;
    // Put popular in the middle
    const mid = Math.floor(others.length / 2);
    return [...others.slice(0, mid), popular, ...others.slice(mid)];
  })();

  return (
    <main className="pt-14 min-h-screen">
      {/* Header */}
      <section className="py-12 sm:py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{content.header.title}</h1>
        <p className="text-gray-400 text-sm sm:text-base">{content.header.subtitle}</p>
      </section>

      {/* Pricing Cards */}
      <section className="container-custom pb-12 sm:pb-16">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {orderedPricing.map((plan) => (
              <div
                key={plan.id}
                className={`card relative flex flex-col ${plan.is_popular ? "border-primary" : ""}`}
              >
                {/* Popular Badge */}
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Star className="w-3 h-3 fill-current" /> Most Popular
                  </div>
                )}

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-center mb-1">{plan.name}</h3>
                  <div className="text-center mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-primary">${plan.price}</span>
                    <span className="text-gray-400 text-sm">/{plan.price_label}</span>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm text-center flex items-center justify-center gap-1 mb-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {plan.delivery_time}
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm text-center mb-4 sm:mb-6">{plan.description}</p>

                  <ul className="space-y-2 sm:space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button - Always at bottom */}
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn w-full justify-center mt-auto ${plan.is_popular ? "btn-primary" : "btn-outline"}`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Package Deals & Rush Delivery */}
      <section className="container-custom pb-12 sm:pb-16">
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* Package Deals */}
          <div className="card">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold mb-3 sm:mb-4">
              <Package className="w-5 h-5 text-primary" /> {content.package_deals.title}
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">{content.package_deals.subtitle}</p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-300 mb-4">
              {(content.package_deals.items || []).map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-xs sm:text-sm py-2">
              Get Package Deal
            </a>
          </div>

          {/* Rush Delivery */}
          <div className="card">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold mb-3 sm:mb-4">
              <Zap className="w-5 h-5 text-primary" /> {content.rush_delivery.title}
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">{content.rush_delivery.subtitle}</p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-300 mb-4">
              {(content.rush_delivery.items || []).map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-xs sm:text-sm py-2">
              Request Rush Order
            </a>
          </div>
        </div>
      </section>

      {/* Loyalty Program */}
      <section className="container-custom pb-12 sm:pb-16">
        <div className="card text-center max-w-3xl mx-auto">
          <h3 className="flex items-center justify-center gap-2 text-lg sm:text-xl font-bold mb-3 sm:mb-4">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> {content.loyalty.title}
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">{content.loyalty.description}</p>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Join Loyalty Program
          </a>
        </div>
      </section>

      {/* Custom Quote */}
      <section className="container-custom pb-12 sm:pb-16">
        <div className="card text-center max-w-3xl mx-auto bg-dark-600">
          <h3 className="text-lg sm:text-xl font-bold mb-2">{content.custom_quote.title}</h3>
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">{content.custom_quote.description}</p>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Contact for Custom Quote
          </a>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="container-custom pb-12 sm:pb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-1">
            {faqs.map((faq) => (
              <div key={faq.id} className="border-b border-dark-600">
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between py-3 sm:py-4 text-left"
                >
                  <span className="font-medium text-sm sm:text-base pr-4">{faq.question}</span>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 shrink-0" />
                  )}
                </button>
                {openFaq === faq.id && (
                  <p className="pb-3 sm:pb-4 text-gray-400 text-xs sm:text-sm">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
