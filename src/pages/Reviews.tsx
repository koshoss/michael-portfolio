import { useState, useEffect } from "react";
import { LogIn, LogOut, Star, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase, getReviews, createReview, getSiteContent, subscribeToTable, unsubscribe, containsProfanity, type Review } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import type { User } from "@supabase/supabase-js";

const defaultContent = {
  header: { title: "Client Reviews", subtitle: "See what my clients say about their experience working with me on their 3D modeling projects." },
  stats: { stat1_value: "4+", stat1_label: "Total Projects", stat2_value: "100%", stat2_label: "Happy Clients", stat3_value: "5.0/5", stat3_label: "Average Rating", stat4_value: "100%", stat4_label: "On-Time Delivery" },
  cta: { title: "Ready to join my satisfied clients?", subtitle: "Let's discuss your project and bring your 3D vision to life with the same quality and attention to detail." }
};

export function ReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [content, setContent] = useState(defaultContent);
  const [user, setUser] = useState<User | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    loadData();
    checkUser();
    const ch1 = subscribeToTable("reviews", loadReviews);
    const ch2 = subscribeToTable("site_content", loadContent);
    
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null);
        if (session?.user) checkUserReviews(session.user.id);
      });
      return () => { subscription.unsubscribe(); unsubscribe(ch1); unsubscribe(ch2); };
    }
    return () => { unsubscribe(ch1); unsubscribe(ch2); };
  }, []);

  const loadData = async () => {
    await Promise.all([loadReviews(), loadContent()]);
    setLoading(false);
  };

  const loadReviews = async () => {
    const data = await getReviews();
    setReviews(data);
  };

  const loadContent = async () => {
    const data = await getSiteContent("reviews");
    if (Object.keys(data).length > 0) setContent({ ...defaultContent, ...data });
  };

  const checkUser = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) checkUserReviews(user.id);
  };

  const checkUserReviews = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from("reviews").select("id").eq("user_id", userId);
    setHasReviewed((data?.length || 0) > 0);
  };

  const handleDiscordLogin = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/reviews`, scopes: 'identify' }
    });
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setHasReviewed(false);
  };

  const handleTextChange = (text: string) => {
    setReviewText(text);
    if (text.length > 3 && containsProfanity(text)) {
      setWarning("Your review contains inappropriate content.");
    } else {
      setWarning("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast("Please login first", "error"); return; }
    if (!reviewText.trim() || reviewText.length < 10) { toast("Review must be at least 10 characters", "error"); return; }
    if (containsProfanity(reviewText)) { toast("Review contains inappropriate content", "error"); return; }

    setSubmitting(true);
    const result = await createReview({
      user_id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "User",
      rating,
      review_text: reviewText,
      discord_username: user.user_metadata?.preferred_username,
      discord_avatar: user.user_metadata?.avatar_url,
    });

    if (result.success) {
      toast("Review submitted successfully!", "success");
      setReviewText("");
      setRating(5);
      setHasReviewed(true);
      loadReviews();
    } else {
      toast(result.error || "Failed to submit", "error");
    }
    setSubmitting(false);
  };

  const stats = [
    { value: content.stats.stat1_value, label: content.stats.stat1_label },
    { value: content.stats.stat2_value, label: content.stats.stat2_label },
    { value: content.stats.stat3_value, label: content.stats.stat3_label },
    { value: content.stats.stat4_value, label: content.stats.stat4_label },
  ];

  return (
    <main className="pt-14 min-h-screen">
      {/* Header */}
      <section className="py-12 sm:py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          Client <span className="text-primary">Reviews</span>
        </h1>

        {user ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-dark-700 rounded-lg">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              )}
              <span className="font-medium text-sm sm:text-base">
                {user.user_metadata?.preferred_username || user.user_metadata?.name || user.email}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline py-2 text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        ) : (
          <button onClick={handleDiscordLogin} className="btn btn-primary mb-4 sm:mb-6">
            <LogIn className="w-4 h-4" /> Login with Discord
          </button>
        )}

        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">{content.header.subtitle}</p>
      </section>

      {/* Stats */}
      <section className="container-custom pb-8 sm:pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card text-center py-4 sm:py-6">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-gray-400 text-xs sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Review Form */}
      {user && !hasReviewed && (
        <section className="container-custom pb-8 sm:pb-12">
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" /> Write Your Review
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1"
                    >
                      <Star className={`w-7 h-7 sm:w-8 sm:h-8 ${star <= (hoverRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className={`input min-h-[100px] sm:min-h-[120px] ${warning ? 'border-red-500' : ''}`}
                  placeholder="Share your experience..."
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{reviewText.length}/500</span>
                </div>
                {warning && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4" /> {warning}
                  </div>
                )}
              </div>
              <button type="submit" disabled={submitting || !!warning} className="btn btn-primary w-full">
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Already Reviewed */}
      {user && hasReviewed && (
        <section className="container-custom pb-8 sm:pb-12">
          <div className="card text-center max-w-2xl mx-auto bg-green-500/10 border-green-500/30">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-bold mb-2">Thank you for your review!</h3>
            <p className="text-gray-400 text-sm">Your review is now visible to everyone.</p>
          </div>
        </section>
      )}

      {/* Reviews List */}
      {loading ? (
        <section className="container-custom pb-12 sm:pb-16">
          <div className="text-center py-12 text-gray-400">Loading...</div>
        </section>
      ) : reviews.length > 0 ? (
        <section className="container-custom pb-12 sm:pb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">What Clients Say</h2>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {reviews.map((review) => (
              <div key={review.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  {review.discord_avatar ? (
                    <img src={review.discord_avatar} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center font-bold text-sm">
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{review.name}</div>
                    {review.discord_username && (
                      <div className="text-gray-500 text-xs sm:text-sm">@{review.discord_username}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-0.5 sm:gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
                  ))}
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">{review.review_text}</p>
                <div className="mt-3 text-xs text-gray-600">{new Date(review.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="container-custom pb-12 sm:pb-16">
          <div className="text-center py-12 text-gray-400">No reviews yet. Be the first!</div>
        </section>
      )}

      {/* CTA */}
      <section className="container-custom pb-12 sm:pb-16">
        <div className="card text-center max-w-3xl mx-auto bg-dark-600">
          <h2 className="text-lg sm:text-xl font-bold mb-2">{content.cta.title}</h2>
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">{content.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link to="/pricing" className="btn btn-primary">View Pricing</Link>
            <Link to="/portfolio" className="btn btn-outline">View Portfolio</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
