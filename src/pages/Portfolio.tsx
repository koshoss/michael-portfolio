import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Download } from "lucide-react";
import { getProjects, subscribeToTable, unsubscribe, type Project, type ProjectImage } from "@/lib/supabase";

const CATEGORIES = ["All", "Characters", "UGC", "Weapons", "Stud Style", "Vehicles"];

export function PortfolioPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<Record<string, number>>({});
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    const channel = subscribeToTable("projects", loadProjects);
    return () => unsubscribe(channel);
  }, []);

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
    setLoading(false);
  };

  const filtered = category === "All" ? projects : projects.filter((p) => p.category === category);

  const getProjectImages = (project: Project): ProjectImage[] => {
    const images = project.images || [];
    if (images.length === 0 && project.image_url) {
      return [{ url: project.image_url, color: "#ffffff", name: "Default" }];
    }
    return images;
  };

  const getCurrentImage = (project: Project): ProjectImage | null => {
    const images = getProjectImages(project);
    const selectedIndex = selectedImages[project.id] || 0;
    return images[selectedIndex] || images[0] || null;
  };

  const handleColorSelect = (projectId: string, index: number) => {
    setSelectedImages(prev => ({ ...prev, [projectId]: index }));
  };

  const handleView3D = (project: Project) => {
    navigate(`/view/${project.id}`);
  };

  const handleDownloadAll = async (project: Project) => {
    const images = getProjectImages(project);
    const validImages = images.filter(img => img.url);
    
    if (validImages.length === 0) {
      alert("No images to download");
      return;
    }

    setDownloading(project.id);

    for (let i = 0; i < validImages.length; i++) {
      const img = validImages[i];
      try {
        const response = await fetch(img.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.title}-${img.name || i + 1}.${img.url.split('.').pop() || 'png'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Download failed:", error);
      }
    }

    setDownloading(null);
  };

  return (
    <main className="pt-14 min-h-screen">
      {/* Hero Banner */}
      <section className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-b from-dark-700 to-dark-900 flex items-center px-4">
        <div className="container-custom">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            My 3D <span className="text-primary">Portfolio</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-lg">
            Explore my collection of 3D models, characters, and digital art created with passion and precision
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container-custom py-6 sm:py-8">
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                category === cat
                  ? "bg-primary text-white"
                  : "bg-transparent border border-dark-500 text-gray-400 hover:border-gray-500 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Projects Grid */}
      <section className="container-custom pb-12 sm:pb-16">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No projects in this category</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((project) => {
              const images = getProjectImages(project);
              const currentImage = getCurrentImage(project);
              const selectedIndex = selectedImages[project.id] || 0;

              return (
                <div key={project.id} className="bg-dark-700 rounded-xl overflow-hidden group">
                  {/* Image */}
                  <div className="aspect-square bg-dark-600 relative overflow-hidden">
                    {currentImage?.url ? (
                      <img
                        src={currentImage.url}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span className="text-5xl sm:text-6xl">🎨</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-bold text-primary mb-1">{project.title}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">{project.description}</p>

                    {/* Color Variants */}
                    {images.length > 0 && images.some(img => img.color) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {images.map((img, index) => (
                          <div key={index} className="relative group/color">
                            <button
                              onClick={() => handleColorSelect(project.id, index)}
                              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                                selectedIndex === index
                                  ? "border-white scale-110 shadow-lg"
                                  : "border-dark-500 hover:border-gray-400"
                              }`}
                              style={{ backgroundColor: img.color || "#666" }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/color:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                              {project.title.toLowerCase().replace(/\s+/g, '-')}-{(img.name || 'variant').toLowerCase()}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-800" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      {project.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 sm:py-1 bg-dark-600 text-gray-400 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView3D(project)}
                        className="flex-1 btn btn-outline text-xs sm:text-sm py-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> View
                      </button>
                      <button
                        onClick={() => handleDownloadAll(project)}
                        disabled={downloading === project.id}
                        className="p-2 bg-dark-600 rounded-lg hover:bg-dark-500 transition-colors disabled:opacity-50"
                        title="Download all images"
                      >
                        {downloading === project.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
