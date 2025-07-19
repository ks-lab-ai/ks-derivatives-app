"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { DashboardNavigator } from "@/components/dashboard/dashboard-navigator";
import { CoursePreviewCard } from "@/components/course-preview-card";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Module {
  id: string;
  title: string;
  description: string;
  category_id: string;
  picture_url: string | null;
  difficulty: string;
  is_published: boolean;
  order_index: number;
  created_at: string;
  category?: { name: string };
  _count?: {
    chapters: number;
    module_registrations: number;
  };
}

interface EnrolledModule extends Module {
  progress: number;
  nextChapter?: {
    name: string;
    type: 'video' | 'file' | 'quiz';
    estimatedTime?: number;
  };
}

interface UserData {
  day_streak: number;
  subscription_type: "free" | "premium_800" | "premium_2000";
}

export default function ModulesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [enrolledModules, setEnrolledModules] = useState<EnrolledModule[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'difficulty'>('date');
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user) {
        // Load user data
        const { data: profileData } = await supabase
          .from("users")
          .select("day_streak, subscription_type")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setUserData(profileData);
        }

        // Load all modules with category info and counts
        const { data: modulesData } = await supabase
          .from("modules")
          .select(`
            *,
            category:categories(name),
            chapters(id),
            module_registrations(user_id)
          `)
          .eq("is_published", true)
          .order("order_index", { ascending: true });

        if (modulesData) {
          // Format modules with counts
          const formattedModules = modulesData.map(module => ({
            ...module,
            _count: {
              chapters: module.chapters?.length || 0,
              module_registrations: module.module_registrations?.length || 0
            }
          }));
          setModules(formattedModules);

          // Get enrolled modules with progress
          const enrolledModulesData = await Promise.all(
            formattedModules
              .filter(module => 
                module.module_registrations?.some((reg: any) => reg.user_id === user.id)
              )
              .map(async (module) => {
                // Get progress
                const { data: chapters } = await supabase
                  .from("chapters")
                  .select(`
                    id,
                    name,
                    order_index,
                    estimated_time_minutes,
                    courses(id, video_url, file_url, quiz_id)
                  `)
                  .eq("module_id", module.id)
                  .order("order_index");

                let progress = 0;
                let nextChapter = null;

                if (chapters && chapters.length > 0) {
                  // For simplicity, we'll track chapter completion based on having any content
                  // In a full implementation, you'd track individual course completion within chapters
                  const completedChaptersCount = chapters.filter(chapter => 
                    chapter.courses && chapter.courses.length > 0
                  ).length;
                  
                  progress = Math.round((completedChaptersCount / chapters.length) * 100);

                  // Find next chapter (simplified)
                  const nextChapterData = chapters[0]; // First incomplete chapter
                  
                  if (nextChapterData && progress < 100) {
                    const contentType = nextChapterData.courses?.[0] ? 
                      (nextChapterData.courses[0].video_url ? 'video' : 
                       nextChapterData.courses[0].file_url ? 'file' : 'quiz') : 'file';
                    
                    nextChapter = {
                      name: nextChapterData.name,
                      type: contentType,
                      estimatedTime: nextChapterData.estimated_time_minutes
                    };
                  }
                }

                return {
                  ...module,
                  progress,
                  nextChapter
                } as EnrolledModule;
              })
          );

          setEnrolledModules(enrolledModulesData.filter(m => m.progress < 100));
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter modules based on status
  const getFilteredModules = () => {
    let filtered = modules;

    // Status filter
    if (statusFilter === 'not_started') {
      filtered = modules.filter(module => 
        !enrolledModules.some(em => em.id === module.id)
      );
    } else if (statusFilter === 'in_progress') {
      filtered = modules.filter(module => 
        enrolledModules.some(em => em.id === module.id && em.progress > 0 && em.progress < 100)
      );
    } else if (statusFilter === 'completed') {
      filtered = modules.filter(module => 
        enrolledModules.some(em => em.id === module.id && em.progress === 100)
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(module =>
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'difficulty') {
      const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      filtered.sort((a, b) => 
        (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 999) - 
        (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 999)
      );
    }

    return filtered;
  };

  const filteredModules = getFilteredModules();

  const canAccessModule = (module: Module, index: number) => {
    if (userData?.subscription_type === "premium_800" || userData?.subscription_type === "premium_2000") {
      return true;
    }
    return index === 0; // Only first module is free
  };

  if (loading) {
    return (
      <div className="space-y-0">
        <div className="-mx-6 -mt-6">
          <DashboardNavigator dayStreak={0} />
        </div>
        <div className="flex items-center justify-center h-96">
          <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Dashboard Navigator */}
      <div className="-mx-6 -mt-6">
        <DashboardNavigator dayStreak={userData?.day_streak || 0} />
      </div>
      
      <div className="space-y-8 pt-6">
        {/* Continue Section - Only show if there are enrolled modules */}
        {enrolledModules.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('modules.continue')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledModules.slice(0, 2).map((module) => (
                <div
                  key={module.id}
                  onClick={() => router.push(`/modules/${module.id}`)}
                  className="cursor-pointer"
                >
                  <CoursePreviewCard
                    course={module}
                    mode="horizontal"
                    userProgress={module.progress}
                    nextModule={module.nextChapter}
                    onContinue={() => router.push(`/modules/${module.id}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Modules Section */}
        <section>
          {/* Header with filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">{t('modules.allModules')}</h2>
              <Badge variant="secondary" className="rounded-full">
                {filteredModules.length}
              </Badge>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Status Filters */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'default' : 'ghost'}
                  className="rounded-full bg-muted border-none shadow-none"
                  onClick={() => setStatusFilter('all')}
                >
                  {t('common.all')}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'not_started' ? 'default' : 'ghost'}
                  className="rounded-full bg-muted border-none shadow-none"
                  onClick={() => setStatusFilter('not_started')}
                >
                  {t('common.notStarted')}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'in_progress' ? 'default' : 'ghost'}
                  className="rounded-full bg-muted border-none shadow-none"
                  onClick={() => setStatusFilter('in_progress')}
                >
                  {t('common.inProgress')}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'completed' ? 'default' : 'ghost'}
                  className="rounded-full bg-muted border-none shadow-none"
                  onClick={() => setStatusFilter('completed')}
                >
                  {t('common.completed')}
                </Button>
              </div>

              {/* Search and Sort */}
              <div className="flex gap-2 ml-auto">
                <div className="relative">
                  <Icon 
                    icon="mdi:magnify" 
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  />
                  <Input
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('common.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t('common.sortByDate')}</SelectItem>
                    <SelectItem value="name">{t('common.sortByName')}</SelectItem>
                    <SelectItem value="difficulty">{t('common.sortByDifficulty')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {filteredModules.map((module, index) => {
              const isAccessible = canAccessModule(module, index);
              const isEnrolled = enrolledModules.some(em => em.id === module.id);
              const enrolledModule = enrolledModules.find(em => em.id === module.id);
              
              return (
                <div
                  key={module.id}
                  onClick={() => isAccessible && router.push(`/modules/${module.id}`)}
                  className={isAccessible ? "cursor-pointer" : ""}
                >
                  <CoursePreviewCard
                    course={module}
                    userProgress={enrolledModule?.progress || 0}
                    completionRate={enrolledModule?.progress || 0}
                    isDisabled={!isAccessible}
                    className="h-full"
                  />
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <Icon 
                icon="mdi:book-open-variant" 
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
              />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('modules.noModules')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('common.tryDifferentFilter')}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}