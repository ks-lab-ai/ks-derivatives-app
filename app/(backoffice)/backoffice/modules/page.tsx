'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { CoursePreviewCard } from '@/components/course-preview-card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Module {
  id: string
  title: string
  description: string
  difficulty: string
  picture_url: string
  is_published: boolean
  order_index: number
  created_at: string
  category: {
    name: string
  }
  chapters: any[]
  module_registrations: any[]
  _count?: {
    chapters: number
    module_registrations: number
  }
}

export default function ModulesManagementPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [filteredModules, setFilteredModules] = useState<Module[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadModules()
  }, [])

  useEffect(() => {
    const filtered = modules.filter(module =>
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredModules(filtered)
  }, [modules, searchTerm])

  async function loadModules() {
    try {
      const { data } = await supabase
        .from('modules')
        .select(`
          *,
          category:categories(name),
          chapters(id),
          module_registrations(id)
        `)
        .order('order_index', { ascending: true })

      if (data) {
        const modulesWithCount = data.map(module => ({
          ...module,
          _count: {
            chapters: module.chapters?.length || 0,
            module_registrations: module.module_registrations?.length || 0
          }
        }))
        setModules(modulesWithCount)
      }
    } catch (error) {
      console.error('Error loading modules:', error)
    } finally {
      setLoading(false)
    }
  }

  async function togglePublishStatus(moduleId: string, isPublished: boolean) {
    try {
      await supabase
        .from('modules')
        .update({ is_published: !isPublished })
        .eq('id', moduleId)

      setModules(modules.map(module =>
        module.id === moduleId ? { ...module, is_published: !isPublished } : module
      ))
    } catch (error) {
      console.error('Error updating module status:', error)
    }
  }

  async function deleteModule(moduleId: string) {
    try {
      await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      setModules(modules.filter(module => module.id !== moduleId))
      setShowDeleteDialog(false)
      setSelectedModule(null)
    } catch (error) {
      console.error('Error deleting module:', error)
    }
  }

  async function updateModuleOrder(moduleId: string, newOrder: number) {
    try {
      await supabase
        .from('modules')
        .update({ order_index: newOrder })
        .eq('id', moduleId)

      loadModules() // Reload to get updated order
    } catch (error) {
      console.error('Error updating module order:', error)
    }
  }

  function handleCreateModule() {
    router.push('/backoffice/modules/create')
  }

  function handleEditModule(moduleId: string) {
    router.push(`/backoffice/modules/${moduleId}/edit`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-din-semibold text-foreground">{t('backoffice.moduleManagement')}</h1>
          <p className="text-muted-foreground mt-2">{t('backoffice.manageModules')}</p>
        </div>
        <Button onClick={handleCreateModule}>
          <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
          {t('backoffice.createModule')}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('backoffice.searchModules')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-5 rounded-xl shadow-soft bg-background"
          />
        </div>
        <Badge variant="secondary" className="py-2 px-4 text-sm">
          {filteredModules.length} {t('backoffice.modules')}
        </Badge>
      </div>

      {/* Modules Grid */}
      {filteredModules.length === 0 ? (
        <div className="text-center py-16">
          <Icon icon="mdi:book-outline" className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">{t('backoffice.noModules')}</h3>
          <p className="text-muted-foreground mb-6">{t('backoffice.createFirstModule')}</p>
          <Button onClick={handleCreateModule}>
            <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
            {t('backoffice.createModule')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredModules.map((module) => (
            <div key={module.id} className="group relative cursor-pointer">
              <CoursePreviewCard
                course={module}
                userProgress={0}
                completionRate={85}
                isDisabled={false}
                className="h-64 w-full"
              />
              
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <Badge 
                  variant={module.is_published ? "default" : "secondary"}
                  className="shadow-md"
                >
                  {module.is_published ? t('backoffice.published') : t('backoffice.draft')}
                </Badge>
              </div>

              {/* Action Buttons Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push(`/backoffice/modules/${module.id}`)}
                  className="bg-white/90 text-black hover:bg-white"
                >
                  <Icon icon="mdi:cog" className="h-4 w-4 mr-1" />
                  {t('backoffice.manage')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEditModule(module.id)}
                  className="bg-white/90 text-black hover:bg-white"
                >
                  <Icon icon="mdi:pencil" className="h-4 w-4 mr-1" />
                  {t('common.edit')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="bg-white/90 text-black hover:bg-white px-2"
                    >
                      <Icon icon="mdi:dots-vertical" className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => togglePublishStatus(module.id, module.is_published)}
                    >
                      <Icon 
                        icon={module.is_published ? 'mdi:eye-off' : 'mdi:eye'} 
                        className="h-4 w-4 mr-2" 
                      />
                      {module.is_published ? t('backoffice.unpublish') : t('backoffice.publish')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => router.push(`/modules/${module.id}`)}
                    >
                      <Icon icon="mdi:eye" className="h-4 w-4 mr-2" />
                      {t('backoffice.preview')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedModule(module)
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-600"
                    >
                      <Icon icon="mdi:delete" className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Order Index */}
              <div className="absolute bottom-2 left-2">
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                  #{module.order_index}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('backoffice.deleteModule')}</DialogTitle>
            <DialogDescription>
              {t('backoffice.deleteModuleConfirm', { title: selectedModule?.title })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedModule && deleteModule(selectedModule.id)}
            >
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}