import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, FolderOpen, DollarSign, Star, FileText, HelpCircle, Settings, 
  Plus, Trash2, Edit2, Save, X, Eye, RefreshCw, Home, AlertTriangle, Image as ImageIcon, ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  getProjects, createProject, updateProject, deleteProject,
  getPricing, createPricing, updatePricing, deletePricing,
  getAllReviews, deleteReview,
  getTermsSections, createTermsSection, updateTermsSection, deleteTermsSection,
  getAdditionalTerms, createAdditionalTerm, updateAdditionalTerm, deleteAdditionalTerm,
  getFAQs, createFAQ, updateFAQ, deleteFAQ,
  getSiteContent, updateSiteContent,
  type Project, type Pricing, type Review, type TermsSection, type AdditionalTerm, type FAQ, type ProjectImage
} from "@/lib/supabase";

const CATEGORIES = ["Characters", "UGC", "Weapons", "Stud Style", "Vehicles"];
const ICONS = ["FileText", "CreditCard", "Clock", "Shield"];
const IMAGE_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface ImageFormItem {
  url: string;
  color: string;
  name: string;
}

export function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"projects" | "pricing" | "reviews" | "terms" | "faqs" | "content">("pricing");
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState("");

  // Auth
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [termsSections, setTermsSections] = useState<TermsSection[]>([]);
  const [additionalTerms, setAdditionalTerms] = useState<AdditionalTerm[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [homeContent, setHomeContent] = useState<Record<string, any>>({});
  const [pricingContent, setPricingContent] = useState<Record<string, any>>({});
  const [reviewsContent, setReviewsContent] = useState<Record<string, any>>({});
  const [termsContent, setTermsContent] = useState<Record<string, any>>({});

  // Modals
  const [modal, setModal] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);

  // Forms
  const [projectForm, setProjectForm] = useState({ title: "", description: "", category: "Characters", tags: "" });
  const [imageCount, setImageCount] = useState(1);
  const [imageInputs, setImageInputs] = useState<ImageFormItem[]>([{ url: "", color: "#ff0000", name: "" }]);
  const [pricingForm, setPricingForm] = useState({ name: "", price: 0, price_label: "per model", delivery_time: "", description: "", features: "", is_popular: false });
  const [termsSectionForm, setTermsSectionForm] = useState({ title: "", icon: "FileText", items: "" });
  const [additionalTermForm, setAdditionalTermForm] = useState({ title: "", content: "" });
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    setLoading(true);
    setDbError("");
    try {
      const [p, pr, r, ts, at, f, hc, pc, rc, tc] = await Promise.all([
        getProjects(), getPricing(), getAllReviews(), getTermsSections(), getAdditionalTerms(), getFAQs(),
        getSiteContent("home"), getSiteContent("pricing"), getSiteContent("reviews"), getSiteContent("terms")
      ]);
      setProjects(p); setPricing(pr); setReviews(r); setTermsSections(ts); setAdditionalTerms(at); setFaqs(f);
      setHomeContent(hc); setPricingContent(pc); setReviewsContent(rc); setTermsContent(tc);
    } catch (err) {
      setDbError("Failed to load data. Please run the SQL migration.");
    }
    setLoading(false);
  };

  // Auth
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const error = authMode === "login" ? await signIn(email, password) : await signUp(email, password);
    if (error) setAuthError(error);
    else toast("Success!", "success");
  };

  // Projects CRUD
  const openProjectModal = (p?: Project) => {
    setEditing(p || null);
    if (p) {
      setProjectForm({ title: p.title, description: p.description, category: p.category, tags: p.tags.join(", ") });
      const imgs = p.images && p.images.length > 0 
        ? p.images
        : [{ url: p.image_url || "", color: "#ff0000", name: "Default" }];
      setImageCount(imgs.length);
      setImageInputs(imgs);
    } else {
      setProjectForm({ title: "", description: "", category: "Characters", tags: "" });
      setImageCount(1);
      setImageInputs([{ url: "", color: "#ff0000", name: "" }]);
    }
    setModal("project");
  };

  const handleImageCountChange = (count: number) => {
    setImageCount(count);
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ff8000", "#8000ff", "#00ff80", "#ff0080"];
    const newInputs: ImageFormItem[] = [];
    for (let i = 0; i < count; i++) {
      newInputs.push(imageInputs[i] || { url: "", color: colors[i % colors.length], name: "" });
    }
    setImageInputs(newInputs);
  };

  const updateImageInput = (index: number, field: keyof ImageFormItem, value: string) => {
    setImageInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = { ...newInputs[index], [field]: value };
      return newInputs;
    });
  };

  const saveProject = async () => {
    if (!projectForm.title) { toast("Title required", "error"); return; }
    setLoading(true);
    
    const validImages = imageInputs
      .filter(img => img.url)
      .map(img => ({ url: img.url, color: img.color, name: img.name || "Variant" }));
    
    const data = { 
      ...projectForm, 
      image_url: imageInputs[0]?.url || "",
      images: validImages.length > 0 ? validImages : [],
      tags: projectForm.tags.split(",").map(t => t.trim()).filter(Boolean), 
      order_index: projects.length + 1 
    };
    
    if (editing) {
      if (await updateProject(editing.id, data)) { toast("Updated!", "success"); loadAll(); }
      else toast("Failed", "error");
    } else {
      if (await createProject(data as any)) { toast("Added!", "success"); loadAll(); }
      else toast("Failed", "error");
    }
    setModal(null); setLoading(false);
  };

  const removeProject = async (id: string) => {
    if (!confirm("Delete?")) return;
    if (await deleteProject(id)) { toast("Deleted", "success"); loadAll(); }
  };

  // Pricing CRUD
  const openPricingModal = (p?: Pricing) => {
    setEditing(p || null);
    setPricingForm(p ? { name: p.name, price: p.price, price_label: p.price_label, delivery_time: p.delivery_time, description: p.description, features: p.features.join("\n"), is_popular: p.is_popular } : { name: "", price: 0, price_label: "per model", delivery_time: "", description: "", features: "", is_popular: false });
    setModal("pricing");
  };

  const savePricing = async () => {
    if (!pricingForm.name) { toast("Name required", "error"); return; }
    setLoading(true);
    const data = { ...pricingForm, features: pricingForm.features.split("\n").map(f => f.trim()).filter(Boolean), order_index: pricing.length + 1 };
    if (editing) {
      if (await updatePricing(editing.id, data)) { toast("Updated!", "success"); loadAll(); }
      else toast("Failed", "error");
    } else {
      if (await createPricing(data as any)) { toast("Added!", "success"); loadAll(); }
      else toast("Failed", "error");
    }
    setModal(null); setLoading(false);
  };

  const removePricing = async (id: string) => {
    if (!confirm("Delete?")) return;
    if (await deletePricing(id)) { toast("Deleted", "success"); loadAll(); }
  };

  // Reviews (delete only)
  const removeReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    if (await deleteReview(id)) { toast("Deleted", "success"); loadAll(); }
  };

  // Terms Sections CRUD
  const openTermsSectionModal = (t?: TermsSection) => {
    setEditing(t || null);
    setTermsSectionForm(t ? { title: t.title, icon: t.icon, items: t.items.join("\n") } : { title: "", icon: "FileText", items: "" });
    setModal("termsSection");
  };

  const saveTermsSection = async () => {
    if (!termsSectionForm.title) { toast("Title required", "error"); return; }
    setLoading(true);
    const data = { ...termsSectionForm, items: termsSectionForm.items.split("\n").map(i => i.trim()).filter(Boolean), order_index: termsSections.length + 1 };
    if (editing) {
      if (await updateTermsSection(editing.id, data)) { toast("Updated!", "success"); loadAll(); }
      else toast("Failed", "error");
    } else {
      if (await createTermsSection(data as any)) { toast("Added!", "success"); loadAll(); }
      else toast("Failed", "error");
    }
    setModal(null); setLoading(false);
  };

  const removeTermsSection = async (id: string) => {
    if (!confirm("Delete?")) return;
    if (await deleteTermsSection(id)) { toast("Deleted", "success"); loadAll(); }
  };

  // Additional Terms CRUD
  const openAdditionalTermModal = (t?: AdditionalTerm) => {
    setEditing(t || null);
    setAdditionalTermForm(t ? { title: t.title, content: t.content } : { title: "", content: "" });
    setModal("additionalTerm");
  };

  const saveAdditionalTerm = async () => {
    if (!additionalTermForm.title) { toast("Title required", "error"); return; }
    setLoading(true);
    const data = { ...additionalTermForm, order_index: additionalTerms.length + 1 };
    if (editing) {
      if (await updateAdditionalTerm(editing.id, data)) { toast("Updated!", "success"); loadAll(); }
      else toast("Failed", "error");
    } else {
      if (await createAdditionalTerm(data)) { toast("Added!", "success"); loadAll(); }
      else toast("Failed", "error");
    }
    setModal(null); setLoading(false);
  };

  const removeAdditionalTerm = async (id: string) => {
    if (!confirm("Delete?")) return;
    if (await deleteAdditionalTerm(id)) { toast("Deleted", "success"); loadAll(); }
  };

  // FAQs CRUD
  const openFaqModal = (f?: FAQ) => {
    setEditing(f || null);
    setFaqForm(f ? { question: f.question, answer: f.answer } : { question: "", answer: "" });
    setModal("faq");
  };

  const saveFaq = async () => {
    if (!faqForm.question) { toast("Question required", "error"); return; }
    setLoading(true);
    const data = { ...faqForm, order_index: faqs.length + 1 };
    if (editing) {
      if (await updateFAQ(editing.id, data)) { toast("Updated!", "success"); loadAll(); }
      else toast("Failed", "error");
    } else {
      if (await createFAQ(data)) { toast("Added!", "success"); loadAll(); }
      else toast("Failed", "error");
    }
    setModal(null); setLoading(false);
  };

  const removeFaq = async (id: string) => {
    if (!confirm("Delete?")) return;
    if (await deleteFAQ(id)) { toast("Deleted", "success"); loadAll(); }
  };

  // Site Content
  const saveContent = async (page: string, section: string, content: any) => {
    if (await updateSiteContent(page, section, content)) {
      toast("Saved!", "success");
      loadAll();
    } else {
      toast("Failed to save", "error");
    }
  };

  // Loading
  if (authLoading) return <main className="pt-20 min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading...</div></main>;

  // Login
  if (!user) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-md">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold">Admin Access</h1>
          </div>
          {authError && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">{authError}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="Email" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Password" required minLength={6} />
            <button type="submit" className="btn btn-primary w-full">{authMode === "login" ? "Sign In" : "Sign Up"}</button>
          </form>
          <button onClick={() => setAuthMode(m => m === "login" ? "signup" : "login")} className="w-full mt-4 text-primary text-sm hover:underline">
            {authMode === "login" ? "Create account" : "Already have account?"}
          </button>
        </div>
      </main>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center px-4">
        <div className="card text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Access Denied</h1>
          <div className="flex gap-3 justify-center">
            <button onClick={signOut} className="btn btn-outline">Sign Out</button>
            <button onClick={() => navigate("/")} className="btn btn-primary">Home</button>
          </div>
        </div>
      </main>
    );
  }

  // Admin Dashboard
  return (
    <main className="pt-16 sm:pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400 text-xs sm:text-sm">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={loadAll} className="btn btn-outline py-2 px-3" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => navigate("/")} className="btn btn-outline py-2 px-3">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={signOut} className="btn btn-outline py-2 text-sm">Logout</button>
          </div>
        </div>

        {/* Error */}
        {dbError && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-yellow-400 text-sm">{dbError}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "projects", label: "Projects", icon: FolderOpen, count: projects.length },
            { id: "pricing", label: "Pricing", icon: DollarSign, count: pricing.length },
            { id: "reviews", label: "Reviews", icon: Star, count: reviews.length },
            { id: "terms", label: "Terms", icon: FileText, count: termsSections.length },
            { id: "faqs", label: "FAQs", icon: HelpCircle, count: faqs.length },
            { id: "content", label: "Content", icon: Settings, count: 0 },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  tab === t.id ? "bg-primary text-white" : "bg-dark-700 text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
                {t.count > 0 && <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs">{t.count}</span>}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="card min-h-[400px]">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (
            <>
              {/* Projects Tab */}
              {tab === "projects" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg sm:text-xl font-bold">Projects</h2>
                    <button onClick={() => openProjectModal()} className="btn btn-primary py-2 text-sm">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                  {projects.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No projects yet</div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map((p) => (
                        <div key={p.id} className="bg-dark-600 rounded-xl p-4">
                          <div className="aspect-video bg-dark-700 rounded-lg mb-3 overflow-hidden">
                            {p.image_url || (p.images && p.images[0]?.url) ? (
                              <img src={p.images?.[0]?.url || p.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 text-4xl">🎨</div>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm sm:text-base mb-1">{p.title}</h3>
                          <p className="text-gray-400 text-xs mb-2">{p.images?.length || 1} variant(s)</p>
                          {/* Color dots */}
                          {p.images && p.images.length > 0 && (
                            <div className="flex gap-1 mb-3">
                              {p.images.slice(0, 6).map((img, i) => (
                                <div 
                                  key={i} 
                                  className="w-5 h-5 rounded-full border-2 border-dark-400" 
                                  style={{ backgroundColor: img.color }} 
                                  title={`${img.name}: ${img.color}`} 
                                />
                              ))}
                              {p.images.length > 6 && <span className="text-xs text-gray-500 ml-1">+{p.images.length - 6}</span>}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => openProjectModal(p)} className="btn btn-outline py-1 px-3 text-xs"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => removeProject(p.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pricing Tab */}
              {tab === "pricing" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg sm:text-xl font-bold">Pricing Plans</h2>
                    <button onClick={() => openPricingModal()} className="btn btn-primary py-2 text-sm">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                  {pricing.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No pricing plans yet</div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pricing.map((p) => (
                        <div key={p.id} className="bg-dark-600 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{p.name}</h3>
                            {p.is_popular && <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">Popular</span>}
                          </div>
                          <div className="text-2xl font-bold text-primary mb-2">${p.price}<span className="text-sm text-gray-400">/{p.price_label}</span></div>
                          <p className="text-gray-400 text-xs sm:text-sm mb-3">{p.delivery_time}</p>
                          <div className="flex gap-2">
                            <button onClick={() => openPricingModal(p)} className="btn btn-outline py-1 px-3 text-xs"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => removePricing(p.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {tab === "reviews" && (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-6">Reviews ({reviews.length})</h2>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No reviews yet</div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="bg-dark-600 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {r.discord_avatar && <img src={r.discord_avatar} alt="" className="w-8 h-8 rounded-full" />}
                              <span className="font-semibold text-sm">{r.name}</span>
                              <div className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}</div>
                            </div>
                            <p className="text-gray-400 text-xs sm:text-sm">{r.review_text}</p>
                          </div>
                          <button onClick={() => removeReview(r.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg self-start sm:self-auto shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Terms Tab */}
              {tab === "terms" && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg sm:text-xl font-bold">Terms Sections</h2>
                      <button onClick={() => openTermsSectionModal()} className="btn btn-primary py-2 text-sm">
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {termsSections.map((t) => (
                        <div key={t.id} className="bg-dark-600 rounded-xl p-4">
                          <h3 className="font-semibold mb-2">{t.title}</h3>
                          <p className="text-gray-400 text-xs mb-3">{t.items.length} items</p>
                          <div className="flex gap-2">
                            <button onClick={() => openTermsSectionModal(t)} className="btn btn-outline py-1 px-3 text-xs"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => removeTermsSection(t.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg sm:text-xl font-bold">Additional Terms</h2>
                      <button onClick={() => openAdditionalTermModal()} className="btn btn-primary py-2 text-sm">
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {additionalTerms.map((t) => (
                        <div key={t.id} className="bg-dark-600 rounded-xl p-4 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-sm">{t.title}</h3>
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{t.content}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => openAdditionalTermModal(t)} className="btn btn-outline py-1 px-3 text-xs"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => removeAdditionalTerm(t.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FAQs Tab */}
              {tab === "faqs" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg sm:text-xl font-bold">FAQs</h2>
                    <button onClick={() => openFaqModal()} className="btn btn-primary py-2 text-sm">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                  {faqs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No FAQs yet</div>
                  ) : (
                    <div className="space-y-3">
                      {faqs.map((f) => (
                        <div key={f.id} className="bg-dark-600 rounded-xl p-4 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-sm">{f.question}</h3>
                            <p className="text-gray-400 text-xs mt-1">{f.answer}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => openFaqModal(f)} className="btn btn-outline py-1 px-3 text-xs"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => removeFaq(f.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Content Tab */}
              {tab === "content" && (
                <div className="space-y-8">
                  <ContentEditor title="Home Page" page="home" content={homeContent} onSave={saveContent} />
                  <ContentEditor title="Pricing Page" page="pricing" content={pricingContent} onSave={saveContent} />
                  <ContentEditor title="Reviews Page" page="reviews" content={reviewsContent} onSave={saveContent} />
                  <ContentEditor title="Terms Page" page="terms" content={termsContent} onSave={saveContent} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === "project" && (
        <Modal title={editing ? "Edit Project" : "Add Project"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <input type="text" value={projectForm.title} onChange={(e) => setProjectForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Title *" />
            <textarea value={projectForm.description} onChange={(e) => setProjectForm(f => ({ ...f, description: e.target.value }))} className="input min-h-[80px]" placeholder="Description" />
            
            {/* Image Count Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">How many color variants?</label>
              <div className="relative">
                <select 
                  value={imageCount} 
                  onChange={(e) => handleImageCountChange(Number(e.target.value))} 
                  className="input appearance-none pr-10"
                >
                  {IMAGE_COUNTS.map(n => <option key={n} value={n}>{n} variant{n > 1 ? 's' : ''}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Image Inputs */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <ImageIcon className="w-4 h-4" />
                Images & Colors
              </div>
              
              {imageInputs.map((img, index) => (
                <div key={index} className="p-3 bg-dark-600 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-dark-400 shrink-0" 
                      style={{ backgroundColor: img.color }}
                    />
                    <span className="text-sm font-medium">Variant {index + 1}</span>
                  </div>
                  
                  {/* Image URL */}
                  <input 
                    type="text" 
                    value={img.url} 
                    onChange={(e) => updateImageInput(index, 'url', e.target.value)} 
                    className="input text-sm" 
                    placeholder="Image URL" 
                  />
                  
                  {/* Variant Name */}
                  <input 
                    type="text" 
                    value={img.name} 
                    onChange={(e) => updateImageInput(index, 'name', e.target.value)} 
                    className="input text-sm" 
                    placeholder="Variant name (e.g., Red, Gold, Blue)" 
                  />
                  
                  {/* Color Picker */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Choose Color</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={img.color} 
                        onChange={(e) => updateImageInput(index, 'color', e.target.value)} 
                        className="w-12 h-10 rounded-lg cursor-pointer border-2 border-dark-400"
                      />
                      <input 
                        type="text" 
                        value={img.color} 
                        onChange={(e) => updateImageInput(index, 'color', e.target.value)} 
                        className="input text-sm flex-1 font-mono" 
                        placeholder="#ff0000" 
                      />
                    </div>
                  </div>
                  
                  {/* Preview */}
                  {img.url && (
                    <div className="flex items-center gap-3 mt-2 p-2 bg-dark-700 rounded-lg">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-dark-800">
                        <img src={img.url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="text-xs text-gray-400">
                        <p>Name: <span className="text-white">{img.name || "Variant"}</span></p>
                        <p>Color: <span className="font-mono text-white">{img.color}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <select value={projectForm.category} onChange={(e) => setProjectForm(f => ({ ...f, category: e.target.value }))} className="input">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" value={projectForm.tags} onChange={(e) => setProjectForm(f => ({ ...f, tags: e.target.value }))} className="input" placeholder="Tags (comma separated)" />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={saveProject} disabled={loading} className="btn btn-primary flex-1"><Save className="w-4 h-4" /> Save</button>
          </div>
        </Modal>
      )}

      {modal === "pricing" && (
        <Modal title={editing ? "Edit Pricing" : "Add Pricing"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <input type="text" value={pricingForm.name} onChange={(e) => setPricingForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Name *" />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={pricingForm.price} onChange={(e) => setPricingForm(f => ({ ...f, price: Number(e.target.value) }))} className="input" placeholder="Price" />
              <input type="text" value={pricingForm.price_label} onChange={(e) => setPricingForm(f => ({ ...f, price_label: e.target.value }))} className="input" placeholder="per model" />
            </div>
            <input type="text" value={pricingForm.delivery_time} onChange={(e) => setPricingForm(f => ({ ...f, delivery_time: e.target.value }))} className="input" placeholder="Delivery time" />
            <input type="text" value={pricingForm.description} onChange={(e) => setPricingForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Description" />
            <textarea value={pricingForm.features} onChange={(e) => setPricingForm(f => ({ ...f, features: e.target.value }))} className="input min-h-[100px]" placeholder="Features (one per line)" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pricingForm.is_popular} onChange={(e) => setPricingForm(f => ({ ...f, is_popular: e.target.checked }))} className="w-5 h-5 accent-primary" />
              <span className="text-sm">Mark as Popular</span>
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={savePricing} disabled={loading} className="btn btn-primary flex-1"><Save className="w-4 h-4" /> Save</button>
          </div>
        </Modal>
      )}

      {modal === "termsSection" && (
        <Modal title={editing ? "Edit Terms Section" : "Add Terms Section"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <input type="text" value={termsSectionForm.title} onChange={(e) => setTermsSectionForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Title *" />
            <select value={termsSectionForm.icon} onChange={(e) => setTermsSectionForm(f => ({ ...f, icon: e.target.value }))} className="input">
              {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <textarea value={termsSectionForm.items} onChange={(e) => setTermsSectionForm(f => ({ ...f, items: e.target.value }))} className="input min-h-[150px]" placeholder="Items (one per line)" />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={saveTermsSection} disabled={loading} className="btn btn-primary flex-1"><Save className="w-4 h-4" /> Save</button>
          </div>
        </Modal>
      )}

      {modal === "additionalTerm" && (
        <Modal title={editing ? "Edit Term" : "Add Term"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <input type="text" value={additionalTermForm.title} onChange={(e) => setAdditionalTermForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Title *" />
            <textarea value={additionalTermForm.content} onChange={(e) => setAdditionalTermForm(f => ({ ...f, content: e.target.value }))} className="input min-h-[100px]" placeholder="Content" />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={saveAdditionalTerm} disabled={loading} className="btn btn-primary flex-1"><Save className="w-4 h-4" /> Save</button>
          </div>
        </Modal>
      )}

      {modal === "faq" && (
        <Modal title={editing ? "Edit FAQ" : "Add FAQ"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <input type="text" value={faqForm.question} onChange={(e) => setFaqForm(f => ({ ...f, question: e.target.value }))} className="input" placeholder="Question *" />
            <textarea value={faqForm.answer} onChange={(e) => setFaqForm(f => ({ ...f, answer: e.target.value }))} className="input min-h-[100px]" placeholder="Answer" />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={saveFaq} disabled={loading} className="btn btn-primary flex-1"><Save className="w-4 h-4" /> Save</button>
          </div>
        </Modal>
      )}
    </main>
  );
}

// Modal Component
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div className="bg-dark-700 border border-dark-500 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-dark-500">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[70vh]">{children}</div>
      </div>
    </div>
  );
}

// Content Editor Component
function ContentEditor({ title, page, content, onSave }: { title: string; page: string; content: Record<string, any>; onSave: (page: string, section: string, content: any) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const startEdit = (section: string) => {
    setEditing(section);
    setForm(content[section] || {});
  };

  const save = () => {
    if (editing) {
      onSave(page, editing, form);
      setEditing(null);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Home className="w-5 h-5 text-primary" /> {title}
      </h2>
      <div className="space-y-3">
        {Object.entries(content).map(([section, data]) => (
          <div key={section} className="bg-dark-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm capitalize">{section.replace(/_/g, ' ')}</h4>
              <button onClick={() => startEdit(section)} className="btn btn-outline py-1 px-2 text-xs">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            {editing === section ? (
              <div className="space-y-3">
                {Object.entries(data as Record<string, any>).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 block mb-1 capitalize">{key.replace(/_/g, ' ')}</label>
                    {Array.isArray(value) ? (
                      <textarea
                        value={(form[key] || []).join('\n')}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value.split('\n') }))}
                        className="input text-sm min-h-[80px]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={form[key] || ''}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="input text-sm"
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setEditing(null)} className="btn btn-outline py-1 text-xs flex-1">Cancel</button>
                  <button onClick={save} className="btn btn-primary py-1 text-xs flex-1">Save</button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                {Object.entries(data as Record<string, any>).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="text-gray-500">{key}:</span> {Array.isArray(value) ? value.join(', ') : String(value)}
                  </div>
                ))}
                {Object.keys(data as Record<string, any>).length > 2 && <div className="text-gray-500">+ {Object.keys(data as Record<string, any>).length - 2} more</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
