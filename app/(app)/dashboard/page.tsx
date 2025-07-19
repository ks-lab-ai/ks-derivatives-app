"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { DashboardNavigator } from "@/components/dashboard/dashboard-navigator";
import { CourseShowcaseCarousel } from "@/components/dashboard/course-showcase-carousel";
import { CategoryFilters } from "@/components/dashboard/category-filters";
import { Marquee } from "@/components/ui/marquee";
import { CourseMarketingCard } from "@/components/course-marketing-card";
import { CTACard } from "@/components/cta-card";
import { createClient } from "@/lib/supabase/client";

interface UserData {
  first_name: string | null;
  last_name: string | null;
  day_streak: number;
  subscription_type: "free" | "premium_800" | "premium_2000";
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userProgress, setUserProgress] = useState({
    coursesCompleted: 0,
    totalCourses: 0,
    hoursLearned: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Get user profile data
        const { data: profileData } = await supabase
          .from("users")
          .select("first_name, last_name, day_streak, subscription_type")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setUserData(profileData);
        }

        // Get user progress data  
        const { data: registrations } = await supabase
          .from("module_registrations")
          .select(
            `
            module_id,
            modules(
              title,
              chapters(
                id,
                estimated_time_minutes,
                course_progress(completed)
              )
            )
          `
          )
          .eq("user_id", user.id);

        let coursesCompleted = 0;
        let totalCourses = registrations?.length || 0;
        let hoursLearned = 0;

        registrations?.forEach((reg) => {
          const chapters = reg.modules?.chapters || [];
          const completedChapters = chapters.filter(
            (chapter) => chapter.course_progress?.[0]?.completed
          );

          if (
            completedChapters.length === chapters.length &&
            chapters.length > 0
          ) {
            coursesCompleted++;
          }

          hoursLearned += completedChapters.reduce(
            (acc, chapter) => acc + (chapter.estimated_time_minutes || 0),
            0
          );
        });

        setUserProgress({
          coursesCompleted,
          totalCourses,
          hoursLearned: Math.round(hoursLearned / 60), // Convert to hours
        });

        // Update last login and calculate streak
        const today = new Date().toISOString().split("T")[0];
        await supabase
          .from("users")
          .update({ last_login_date: today })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard.goodMorning");
    if (hour < 18) return t("dashboard.goodAfternoon");
    return t("dashboard.goodEvening");
  };

  const userName =
    userData?.first_name || userData?.last_name || t("dashboard.learner");
  const progressPercentage =
    userProgress.totalCourses > 0
      ? Math.round(
          (userProgress.coursesCompleted / userProgress.totalCourses) * 100
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon
          icon="mdi:loading"
          className="h-8 w-8 animate-spin text-gray-500"
        />
      </div>
    );
  }

  // Temporary course data for carousel
  const courses = [
    {
      title: "Options Basics",
      subtitle: "Introduction aux options financières",
      runtime: "2h 30min",
      isNew: true,
    },
    {
      title: "Futures Trading",
      subtitle: "Comprendre les contrats à terme",
      runtime: "3h 15min",
      isNew: false,
    },
    {
      title: "Risk Management",
      subtitle: "Gestion des risques en dérivés",
      runtime: "2h 45min",
      isNew: false,
    },
    {
      title: "Greeks Explained",
      subtitle: "Delta, Gamma, Theta et plus",
      runtime: "3h 00min",
      isNew: true,
    },
    {
      title: "Volatility Trading",
      subtitle: "Stratégies de volatilité",
      runtime: "2h 20min",
      isNew: false,
    },
    {
      title: "Portfolio Hedging",
      subtitle: "Protection de portefeuille",
      runtime: "2h 50min",
      isNew: false,
    },
  ];

  return (
    <div className="space-y-0 -mx-4 md:-mx-8">
      {/* Dashboard Navigator */}
      <div className="px-4 md:px-8">
        <DashboardNavigator dayStreak={userData?.day_streak || 0} />
      </div>

      <div className="space-y-12 pt-8">
        {/* Main Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-8">
          {/* Video CTA Section */}
          <div className="relative aspect-video rounded-3xl overflow-hidden group cursor-pointer">
            <img
              className="w-full h-full object-cover"
              src="/video-cta.jpeg"
              alt="Derivatives Presentation"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="mdi:play" className="h-10 w-10 text-white ml-1" />
              </div>
            </div>
          </div>

          {/* Course Carousels Section */}
          <div className="space-y-6">
            <h2 className="text-3xl font-primary text-white">
              Formations Disponibles
            </h2>

            {/* First Carousel */}
            <div className="relative">
              <Marquee pauseOnHover className="[--duration:30s]">
                {courses.slice(0, 3).map((course, index) => (
                  <CourseMarketingCard
                    key={index}
                    title={course.title}
                    subtitle={course.subtitle}
                    imageUrl="/video-cta.jpeg"
                    runtime={course.runtime}
                    isNew={course.isNew}
                  />
                ))}
              </Marquee>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background to-transparent" />
            </div>

            {/* Second Carousel (Reverse) */}
            <div className="relative">
              <Marquee reverse pauseOnHover className="[--duration:30s]">
                {courses.slice(3, 6).map((course, index) => (
                  <CourseMarketingCard
                    key={index}
                    title={course.title}
                    subtitle={course.subtitle}
                    imageUrl="/video-cta.jpeg"
                    runtime={course.runtime}
                    isNew={course.isNew}
                  />
                ))}
              </Marquee>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background to-transparent" />
            </div>
          </div>
        </div>

        {/* All Courses Section */}
        <section className="px-4 md:px-8 pb-8 mt-38">
          <div className="mb-8 text-center">
            <p className="text-sm text-white/60 mb-6 font-inter">
              Une dose d'inspiration, quand vous en avez besoin.
            </p>
            <h2 className="text-4xl font-primary text-white mb-8">
              Populaire maintenant
            </h2>
          </div>

          <div className="mb-6">
            <CategoryFilters />
          </div>
          <CourseShowcaseCarousel />
        </section>

        {/* CTA Section */}
        <section className="px-4 md:px-8 pb-16 mt-38">
          <h2 className="text-3xl font-primary text-white mb-6 text-center">
            Rejoignez la Communaute
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CTACard
              title="Discord Community"
              subtitle="Rejoignez des milliers de traders"
              imageUrl="https://img.freepik.com/premium-photo/discord-logo-purple-wall-background-with-hard-shadow-space-text-graphics-3d-rendering_494516-1015.jpg"
              href="/discord"
              month="LIVE"
            />
            <CTACard
              title="BridgeYou Platform"
              subtitle="Accédez à des outils avancés"
              imageUrl="/bridgeyou-cta.png"
              href="/bridgeyou"
              month="BETA"
            />
          </div>
        </section>
      </div>

      {/* Subscription Banner for Non-Logged Users */}
      {userData?.subscription_type === "free" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-t border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-white/90 text-sm">
                  À partir de 10€/mois (facturé annuellement) pour tous les
                  cours et sessions
                </p>
              </div>
              <button className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-white/90 transition-colors">
                Terminer l'inscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
