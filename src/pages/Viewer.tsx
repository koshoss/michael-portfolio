import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { getProjects, type Project, type ProjectImage } from "@/lib/supabase";

export function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    const projects = await getProjects();
    const found = projects.find(p => p.id === id);
    setProject(found || null);
    setLoading(false);
  };

  const getProjectImages = (project: Project): ProjectImage[] => {
    const images = project.images || [];
    if (images.length === 0 && project.image_url) {
      return [{ url: project.image_url, color: "#ffffff", name: "Default" }];
    }
    return images;
  };

  const images = project ? getProjectImages(project) : [];
  const currentImage = images[currentIndex];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setRotation(prev => prev + deltaX * 0.5);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    setRotation(prev => prev + deltaX * 0.5);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setRotation(0);
    setZoom(1);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setRotation(0);
    setZoom(1);
  };

  const resetView = () => {
    setRotation(0);
    setZoom(1);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!project) return;
    const validImages = images.filter(img => img.url);
    
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
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Project not found</p>
          <button onClick={() => navigate("/portfolio")} className="btn btn-primary">
            Back to Portfolio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main 
      ref={containerRef}
      className="min-h-screen bg-dark-900 flex flex-col"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-dark-700">
        <div className="flex items-center gap-4">
          <h1 className="text-lg sm:text-xl font-bold text-primary">{project.title}</h1>
          {currentImage && (
            <span className="text-gray-500 text-sm">
              {currentImage.name} ({currentIndex + 1}/{images.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAll}
            className="btn btn-outline py-2 px-3 text-sm"
            title="Download all images"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download All</span>
          </button>
        </div>
      </header>

      {/* Viewer */}
      <div 
        className="flex-1 relative overflow-hidden bg-dark-800 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentImage?.url ? (
          <img
            src={currentImage.url}
            alt={project.title}
            className="max-w-full max-h-full object-contain transition-transform duration-100"
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom})`,
            }}
            draggable={false}
          />
        ) : (
          <div className="text-gray-500 text-center">
            <span className="text-8xl mb-4 block">🎨</span>
            <p>No image available</p>
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-dark-700/80 hover:bg-dark-600 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-dark-700/80 hover:bg-dark-600 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-dark-700/90 backdrop-blur-sm rounded-full px-4 py-2">
          <button onClick={zoomOut} className="p-2 hover:bg-dark-600 rounded-full transition-colors" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} className="p-2 hover:bg-dark-600 rounded-full transition-colors" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-dark-500 mx-1" />
          <button onClick={resetView} className="p-2 hover:bg-dark-600 rounded-full transition-colors" title="Reset View">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-dark-600 rounded-full transition-colors" title="Fullscreen">
            <Maximize className="w-5 h-5" />
          </button>
        </div>

        {/* Drag Hint */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-500 text-sm bg-dark-700/80 px-3 py-1 rounded-full">
          Drag to rotate • Scroll to zoom
        </div>
      </div>

      {/* Color Variants */}
      {images.length > 1 && (
        <div className="p-4 border-t border-dark-700 bg-dark-800">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  resetView();
                }}
                className={`relative group flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  currentIndex === index ? "bg-dark-600" : "hover:bg-dark-700"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    currentIndex === index
                      ? "border-primary scale-110"
                      : "border-dark-500 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: img.color || "#666" }}
                />
                <span className="text-xs text-gray-400">{img.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Back Button - Fixed Bottom Right */}
      <button
        onClick={() => navigate("/portfolio")}
        className="fixed bottom-6 right-6 btn btn-primary shadow-lg"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
    </main>
  );
}
