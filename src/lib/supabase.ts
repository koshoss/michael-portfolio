import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";
export const DISCORD_URL = import.meta.env.VITE_DISCORD_URL || "";
export const supabase = url && key ? createClient(url, key) : null;

// Types
export interface ProjectImage {
  url: string;
  color: string;
  name: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string;
  images: ProjectImage[];
  category: string;
  tags: string[];
  order_index: number;
}

export interface Pricing {
  id: string;
  name: string;
  price: number;
  price_label: string;
  delivery_time: string;
  description: string;
  features: string[];
  is_popular: boolean;
  order_index: number;
}

export interface Review {
  id: string;
  user_id?: string;
  name: string;
  rating: number;
  review_text: string;
  discord_username?: string;
  discord_avatar?: string;
  is_approved: boolean;
  created_at: string;
}

export interface TermsSection {
  id: string;
  title: string;
  icon: string;
  items: string[];
  order_index: number;
}

export interface AdditionalTerm {
  id: string;
  title: string;
  content: string;
  order_index: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

export interface SiteContent {
  id: string;
  page: string;
  section: string;
  content: Record<string, any>;
}

// Profanity Filter
const BAD_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'cunt', 'dick', 'cock', 'pussy', 'whore',
  'slut', 'bastard', 'nigger', 'nigga', 'faggot', 'fag', 'retard', 'motherfucker',
  'asshole', 'bullshit', 'piss', 'penis', 'vagina', 'porn', 'sex', 'nude', 'naked',
  'xxx', 'kill', 'murder', 'rape', 'suicide', 'terrorist', 'bomb', 'drug',
  'كس', 'طيز', 'زب', 'شرموط', 'عرص', 'متناك', 'منيك', 'خول', 'قحبه', 'نيك', 'احا'
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some(word => lower.includes(word));
}

// Auth
export async function signInWithDiscord() {
  if (!supabase) return { error: "Not configured" };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: `${window.location.origin}/reviews`, scopes: 'identify' }
  });
  return { error: error?.message };
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Projects
export async function getProjects(): Promise<Project[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("projects").select("*").order("order_index");
  return (data || []) as Project[];
}

export async function createProject(p: Omit<Project, "id">): Promise<Project | null> {
  if (!supabase) return null;
  const { data } = await supabase.from("projects").insert([p]).select().single();
  return data as Project | null;
}

export async function updateProject(id: string, p: Partial<Project>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("projects").update(p).eq("id", id);
  return !error;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("projects").delete().eq("id", id);
  return !error;
}

// Pricing
export async function getPricing(): Promise<Pricing[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("pricing").select("*").order("order_index");
  return (data || []) as Pricing[];
}

export async function createPricing(p: Omit<Pricing, "id">): Promise<Pricing | null> {
  if (!supabase) return null;
  const { data } = await supabase.from("pricing").insert([p]).select().single();
  return data as Pricing | null;
}

export async function updatePricing(id: string, p: Partial<Pricing>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("pricing").update(p).eq("id", id);
  return !error;
}

export async function deletePricing(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("pricing").delete().eq("id", id);
  return !error;
}

// Reviews (auto-approved)
export async function getReviews(): Promise<Review[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("reviews").select("*").eq("is_approved", true).order("created_at", { ascending: false });
  return (data || []) as Review[];
}

export async function getAllReviews(): Promise<Review[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  return (data || []) as Review[];
}

export async function createReview(r: { user_id: string; name: string; rating: number; review_text: string; discord_username?: string; discord_avatar?: string }): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Not configured" };
  
  if (containsProfanity(r.name) || containsProfanity(r.review_text)) {
    return { success: false, error: "Your review contains inappropriate content." };
  }
  
  const { error } = await supabase.from("reviews").insert([{ ...r, is_approved: true }]);
  return { success: !error, error: error?.message };
}

export async function deleteReview(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  return !error;
}

export async function hasUserReviewed(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.from("reviews").select("id").eq("user_id", userId);
  return (data?.length || 0) > 0;
}

// Terms Sections
export async function getTermsSections(): Promise<TermsSection[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("terms_sections").select("*").order("order_index");
  return (data || []) as TermsSection[];
}

export async function createTermsSection(t: Omit<TermsSection, "id">): Promise<TermsSection | null> {
  if (!supabase) return null;
  const { data } = await supabase.from("terms_sections").insert([t]).select().single();
  return data as TermsSection | null;
}

export async function updateTermsSection(id: string, t: Partial<TermsSection>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("terms_sections").update(t).eq("id", id);
  return !error;
}

export async function deleteTermsSection(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("terms_sections").delete().eq("id", id);
  return !error;
}

// Additional Terms
export async function getAdditionalTerms(): Promise<AdditionalTerm[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("additional_terms").select("*").order("order_index");
  return (data || []) as AdditionalTerm[];
}

export async function createAdditionalTerm(t: Omit<AdditionalTerm, "id">): Promise<AdditionalTerm | null> {
  if (!supabase) return null;
  const { data } = await supabase.from("additional_terms").insert([t]).select().single();
  return data as AdditionalTerm | null;
}

export async function updateAdditionalTerm(id: string, t: Partial<AdditionalTerm>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("additional_terms").update(t).eq("id", id);
  return !error;
}

export async function deleteAdditionalTerm(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("additional_terms").delete().eq("id", id);
  return !error;
}

// FAQs
export async function getFAQs(): Promise<FAQ[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("faqs").select("*").order("order_index");
  return (data || []) as FAQ[];
}

export async function createFAQ(f: Omit<FAQ, "id">): Promise<FAQ | null> {
  if (!supabase) return null;
  const { data } = await supabase.from("faqs").insert([f]).select().single();
  return data as FAQ | null;
}

export async function updateFAQ(id: string, f: Partial<FAQ>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("faqs").update(f).eq("id", id);
  return !error;
}

export async function deleteFAQ(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  return !error;
}

// Site Content
export async function getSiteContent(page: string): Promise<Record<string, any>> {
  if (!supabase) return {};
  const { data } = await supabase.from("site_content").select("*").eq("page", page);
  const result: Record<string, any> = {};
  data?.forEach((d: SiteContent) => { result[d.section] = d.content; });
  return result;
}

export async function updateSiteContent(page: string, section: string, content: any): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("site_content").upsert(
    { page, section, content, updated_at: new Date().toISOString() },
    { onConflict: "page,section" }
  );
  return !error;
}

// Realtime Subscriptions
export function subscribeToTable(table: string, callback: () => void): RealtimeChannel | null {
  if (!supabase) return null;
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel | null) {
  if (channel && supabase) {
    supabase.removeChannel(channel);
  }
}
