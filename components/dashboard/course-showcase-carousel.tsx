"use client";

import { useEffect, useState, useRef } from "react";
import { CourseShowcaseCard } from "@/components/course-showcase-card";
import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  title: string;
  category?: string;
  picture_url?: string;
  difficulty?: string;
}

export function CourseShowcaseCarousel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // If no courses, show placeholder data
  const displayCourses = courses.length > 0 ? courses : [
    { id: "1", title: "Introduction aux Options", category: "Options", picture_url: "/video-cta.jpeg" },
    { id: "2", title: "Trading de Futures", category: "Futures", picture_url: "/video-cta.jpeg" },
    { id: "3", title: "Gestion des Risques", category: "Risk Management", picture_url: "/video-cta.jpeg" },
    { id: "4", title: "Les Grecques", category: "Options Avancées", picture_url: "/video-cta.jpeg" },
    { id: "5", title: "Stratégies de Volatilité", category: "Trading Avancé", picture_url: "/video-cta.jpeg" },
    { id: "6", title: "Couverture de Portefeuille", category: "Hedging", picture_url: "/video-cta.jpeg" },
  ];

  // Calculate visible items based on screen size
  const itemsPerView = 4; // Adjust based on responsive needs
  const maxIndex = Math.max(0, displayCourses.length - itemsPerView);

  // Helper to generate duration (temporary until we have real data)
  const getDuration = (index: number) => {
    const durations = ["2h 30min", "3h 15min", "2h 45min", "3h 00min", "2h 20min", "2h 50min"];
    return durations[index % durations.length];
  };

  async function loadCourses() {
    try {
      const { data } = await supabase
        .from("modules")
        .select(`
          id,
          title,
          picture_url,
          difficulty,
          categories(name)
        `)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (data) {
        setCourses(data.map((course: any) => ({
          ...course,
          category: course.categories?.name || "Finance"
        })));
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  }

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (loading) return;
    
    const startAutoScroll = () => {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, 4000); // Change slide every 4 seconds
    };

    startAutoScroll();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [maxIndex, loading]);

  // Scroll to current index
  useEffect(() => {
    if (scrollRef.current && !loading) {
      const scrollAmount = currentIndex * 300; // 280px card width + 20px gap
      scrollRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, loading]);

  if (loading) {
    return <div className="h-[420px] flex items-center justify-center text-muted-foreground">Chargement des cours...</div>;
  }

  const handlePrevious = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentIndex(index);
  };

  return (
    <div className="relative">
      {/* Navigation buttons */}
      <div className="absolute -top-16 right-0 flex gap-2 z-10">
        <button
          onClick={handlePrevious}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="Previous"
        >
          <Icon icon="mdi:chevron-left" className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleNext}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="Next"
        >
          <Icon icon="mdi:chevron-right" className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Carousel container */}
      <div className="relative overflow-hidden overflow-y-hidden">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-hidden overflow-y-hidden scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayCourses.map((course, index) => (
            <div
              key={course.id}
              className="flex-none"
              style={{ scrollSnapAlign: 'start' }}
            >
              <CourseShowcaseCard
                title={course.title}
                category={course.category || "Finance"}
                duration={getDuration(index)}
                imageUrl={course.picture_url || "/video-cta.jpeg"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: Math.min(displayCourses.length, maxIndex + 1) }).map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`h-2 transition-all duration-300 rounded-full ${
              currentIndex === index 
                ? 'w-8 bg-white' 
                : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}