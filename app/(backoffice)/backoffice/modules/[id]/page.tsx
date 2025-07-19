"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/client";
import { CoursePreviewCard } from "@/components/course-preview-card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Chapter {
  id: string;
  name: string;
  order_index: number;
  estimated_time_minutes: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  category_id: string;
  picture_url: string;
  notes: string;
  difficulty: string;
  is_published: boolean;
  category?: { name: string };
  _count?: {
    chapters: number;
    module_registrations: number;
  };
}

function SortableChapter({
  chapter,
  onDelete,
}: {
  chapter: Chapter;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { t } = useTranslation();

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="p-3 bg-background rounded-xl border border-border shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1"
            >
              <Icon icon="mdi:drag" className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Chapitre {chapter.order_index}</Badge>
                <h4 className="font-medium">{chapter.name}</h4>
              </div>
              <p className="text-sm text-gray-500">
                {chapter.estimated_time_minutes} {t("common.minutes")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(chapter.id)}
            className="h-8 w-8 text-red-500 hover:text-red-700"
          >
            <Icon icon="mdi:delete" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ModuleDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<Module | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 5;
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadModuleData();
  }, [moduleId]);

  async function loadModuleData() {
    try {
      setLoading(true);

      // Load module details
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select(
          `
          *,
          category:categories(name),
          _count:module_registrations(count)
        `
        )
        .eq("id", moduleId)
        .single();

      if (moduleError) throw moduleError;

      // Get registration count
      const { count: registrationCount } = await supabase
        .from("module_registrations")
        .select("*", { count: "exact", head: true })
        .eq("module_id", moduleId);

      setModule({
        ...moduleData,
        _count: {
          chapters: 0,
          module_registrations: registrationCount || 0,
        },
      });

      // Load chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from("chapters")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index");

      if (chaptersError) throw chaptersError;

      setChapters(chaptersData || []);

      // Update chapter count
      setModule((prev) =>
        prev
          ? {
              ...prev,
              _count: {
                ...prev._count!,
                chapters: chaptersData?.length || 0,
              },
            }
          : null
      );
    } catch (error) {
      console.error("Error loading module data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over?.id);

      const newChapters = arrayMove(chapters, oldIndex, newIndex).map(
        (chapter, index) => ({
          ...chapter,
          order_index: index + 1,
        })
      );

      setChapters(newChapters);

      // Update order in database
      try {
        const updates = newChapters.map((chapter) =>
          supabase
            .from("chapters")
            .update({ order_index: chapter.order_index })
            .eq("id", chapter.id)
        );

        await Promise.all(updates);
      } catch (error) {
        console.error("Error updating chapter order:", error);
        // Reload to restore original order on error
        loadModuleData();
      }
    }
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm(t("chapter.confirmDeleteChapter"))) return;

    try {
      await supabase.from("chapters").delete().eq("id", chapterId);

      setChapters(chapters.filter((c) => c.id !== chapterId));
    } catch (error) {
      console.error("Error deleting chapter:", error);
    }
  }

  function navigateToAddChapter() {
    router.push(`/backoffice/modules/${moduleId}/chapters/create`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground mb-2">
          {t("module.notFound")}
        </h3>
        <Button onClick={() => router.push("/backoffice/modules")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  // Pagination
  const totalPages = Math.ceil(chapters.length / chaptersPerPage);
  const paginatedChapters = chapters.slice(
    (currentPage - 1) * chaptersPerPage,
    currentPage * chaptersPerPage
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/backoffice/modules">
              {t("backoffice.modules")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{module.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Preview on the left */}
        <div>
          <CoursePreviewCard
            course={module}
            userProgress={0}
            completionRate={0}
            isDisabled={true}
          />
        </div>

        {/* Chapters list on the right */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("backoffice.moduleChapters")}
              <Button onClick={navigateToAddChapter}>
                <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                {t("chapter.addChapter")}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chapters.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Icon
                  icon="mdi:book-outline"
                  className="h-12 w-12 text-gray-400 mx-auto mb-3"
                />
                <p className="text-gray-500 mb-4">{t("chapter.noChapters")}</p>
                <Button variant="outline" onClick={navigateToAddChapter}>
                  <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                  {t("chapter.addChapter")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={paginatedChapters.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedChapters.map((chapter) => (
                      <SortableChapter
                        key={chapter.id}
                        chapter={chapter}
                        onDelete={deleteChapter}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <Icon icon="mdi:chevron-left" className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {t("common.page")} {currentPage} {t("common.of")}{" "}
                      {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <Icon icon="mdi:chevron-right" className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}