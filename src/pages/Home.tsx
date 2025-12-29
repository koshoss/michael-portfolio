import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Wrench, Palette } from "lucide-react";
import { getSiteContent, subscribeToTable, unsubscribe } from "@/lib/supabase";

const defaultContent = {
  hero: { name: "Michael", subtitle: "I'm 19 years old with 3 years of experience in 3D modeling" },
  about: { title: "About Me", text: "I make game-ready 3D models using Blender, focusing on stylized characters, weapons, and props for Roblox games. I enjoy turning ideas into clean, optimized models that look great and perform well in-game.", highlight: "Blender" },
  cta: { title: "Ready to bring your ideas to life?", subtitle: "Let's collaborate and create something amazing together" },
  tools: { modeling: ["Blender", "Roblox Studio", "ZBrush"], texturing: ["Adobe Substance 3D Painter", "Krita"] }
};

const toolIcons: Record<string, string> = {
  "Blender": "🟠",
  "Roblox Studio": "🎮",
  "ZBrush": "🗿",
  "Adobe Substance 3D Painter": "🎨",
  "Krita": "✏️"
};

export function HomePage() {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    loadContent();
    const channel = subscribeToTable("site_content", loadContent);
    return () => unsubscribe(channel);
  }, []);

  const loadContent = async () => {
    const data = await getSiteContent("home");
    if (Object.keys(data).length > 0) {
      setContent({ ...defaultContent, ...data });
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <span key={i} className="text-primary font-medium">{part}</span> 
        : part
    );
  };

  return (
    <main className="pt-14 min-h-screen">
      {/* Hero */}
      <section className="py-12 sm:py-16 md:py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4">
          Hi, I'm <span className="text-primary">{content.hero.name}</span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto">
          {content.hero.subtitle}
        </p>
        <Link to="/portfolio" className="btn btn-primary">
          View My Work
        </Link>
      </section>

      {/* About Me */}
      <section className="container-custom mb-12 sm:mb-16">
        <div className="card max-w-3xl mx-auto">
          <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold mb-3 sm:mb-4">
            <Zap className="w-5 h-5 text-primary" />
            {content.about.title}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            {highlightText(content.about.text, content.about.highlight)}
          </p>
        </div>
      </section>

      {/* Tools */}
      <section className="container-custom mb-12 sm:mb-16">
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* Modeling Tools */}
          <div className="card">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold mb-3 sm:mb-4">
              <Wrench className="w-5 h-5 text-primary" />
              Modeling Tools
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {(content.tools.modeling || []).map((tool) => (
                <div key={tool} className="flex items-center gap-3 p-2.5 sm:p-3 bg-dark-600 rounded-lg">
                  <span className="text-lg sm:text-xl">{toolIcons[tool] || "🔧"}</span>
                  <span className="text-gray-300 text-sm sm:text-base">{tool}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Texturing Tools */}
          <div className="card">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold mb-3 sm:mb-4">
              <Palette className="w-5 h-5 text-primary" />
              Texturing Tools
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {(content.tools.texturing || []).map((tool) => (
                <div key={tool} className="flex items-center gap-3 p-2.5 sm:p-3 bg-dark-600 rounded-lg">
                  <span className="text-lg sm:text-xl">{toolIcons[tool] || "🎨"}</span>
                  <span className="text-gray-300 text-sm sm:text-base">{tool}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 px-4 text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
          {content.cta.title}
        </h2>
        <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8">
          {content.cta.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link to="/portfolio" className="btn btn-primary">View Portfolio</Link>
          <Link to="/pricing" className="btn btn-outline">See Pricing</Link>
        </div>
      </section>
    </main>
  );
}
