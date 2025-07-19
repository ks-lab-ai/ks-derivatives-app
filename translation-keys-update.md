# Translation Keys Update for Module → Chapter → Course Structure

## Updated JSON Translation Keys

### Backoffice Section
```json
{
  "backoffice": {
    "title": "Backoffice",
    "administration": "Administration",
    "overview": "Vue d'ensemble",
    "modules": "Modules",
    "chapters": "Chapitres", 
    "courses": "Cours",
    "quizzes": "Quiz",
    "corrections": "Corrections",
    "users": "Utilisateurs",
    "subscriptions": "Abonnements",
    "statistics": "Statistiques",
    
    "createModule": "Créer un Module",
    "createModuleDescription": "Créez un nouveau module d'apprentissage avec des chapitres et des cours",
    "moduleInformation": "Informations du Module",
    "moduleChapters": "Chapitres du Module",
    "editModule": "Modifier le Module",
    "deleteModule": "Supprimer le Module",
    
    "createChapter": "Créer un Chapitre", 
    "chapterInformation": "Informations du Chapitre",
    "chapterCourses": "Cours du Chapitre",
    "editChapter": "Modifier le Chapitre",
    "deleteChapter": "Supprimer le Chapitre",
    
    "createCourse": "Créer un Cours",
    "courseInformation": "Informations du Cours", 
    "editCourse": "Modifier le Cours",
    "deleteCourse": "Supprimer le Cours",
    
    "preview": "Aperçu",
    "publish": "Publier",
    "draft": "Brouillon"
  }
}
```

### Common Section
```json
{
  "common": {
    "module": "Module",
    "modules": "Modules", 
    "chapter": "Chapitre",
    "chapters": "Chapitres",
    "course": "Cours",
    "courses": "Cours",
    "allModules": "Tous les Modules",
    "allChapters": "Tous les Chapitres", 
    "allCourses": "Tous les Cours",
    "backToModules": "Retour aux Modules",
    "backToChapters": "Retour aux Chapitres",
    "backToCourses": "Retour aux Cours"
  }
}
```

### Module Section
```json
{
  "module": {
    "title": "Titre du Module",
    "description": "Description du Module",
    "moduleTitlePlaceholder": "Entrez le titre du module",
    "moduleDescriptionPlaceholder": "Décrivez ce que les apprenants vont apprendre dans ce module",
    "moduleNotesPlaceholder": "Notes additionnelles, prérequis, etc.",
    "modulePicture": "Image du Module",
    "selectImageFile": "Veuillez sélectionner un fichier image",
    "fileSizeLimit": "La taille du fichier ne doit pas dépasser 5MB",
    "clickToUpload": "Cliquez pour télécharger",
    "dragAndDropSupported": "Ou glissez-déposez votre image",
    "uploadingPicture": "Téléchargement en cours...",
    "pictureRequirements": "PNG, JPG jusqu'à 5MB. Recommandé: 1200x800px",
    "errorUploadingPicture": "Erreur lors du téléchargement de l'image",
    "errorCreating": "Erreur lors de la création",
    "fillRequiredFields": "Veuillez remplir tous les champs obligatoires",
    "publishModule": "Publier le module",
    "noModules": "Aucun module",
    "addFirstModule": "Créez votre premier module d'apprentissage",
    "previewAlt": "Aperçu de l'image du module"
  }
}
```

### Chapter Section
```json
{
  "chapter": {
    "chapterName": "Nom du Chapitre",
    "chapterNamePlaceholder": "ex: Introduction aux Options",
    "addChapter": "Ajouter un Chapitre",
    "addChapterDescription": "Créez un nouveau chapitre dans ce module",
    "estimatedTimeMinutes": "Durée estimée (minutes)",
    "defaultDurationPlaceholder": "ex: 30",
    "noChapters": "Aucun chapitre",
    "addFirstChapter": "Ajoutez le premier chapitre à ce module"
  }
}
```

### Course Section (Individual Lessons)
```json
{
  "course": {
    "courseTitle": "Titre du Cours",
    "courseTitlePlaceholder": "ex: Comprendre le Delta",
    "courseDescription": "Description du Cours",
    "courseDescriptionPlaceholder": "Décrivez ce que ce cours enseigne spécifiquement",
    "videoRequired": "Vidéo (Obligatoire)",
    "videoUrl": "URL de la Vidéo",
    "videoDuration": "Durée de la Vidéo (minutes)",
    "attachedFile": "Fichier Attaché (Optionnel)",
    "attachedFileName": "Nom du Fichier",
    "quiz": "Quiz (Optionnel)",
    "selectQuiz": "Sélectionner un Quiz",
    "noQuiz": "Aucun Quiz",
    "addCourse": "Ajouter un Cours",
    "addCourseDescription": "Créez un nouveau cours dans ce chapitre",
    "noCourses": "Aucun cours",
    "addFirstCourse": "Ajoutez le premier cours à ce chapitre",
    "videoUpload": "Télécharger une Vidéo",
    "fileUpload": "Télécharger un Fichier"
  }
}
```

### Dashboard Updates
```json
{
  "dashboard": {
    "popularModules": "Modules Populaires",
    "continueModule": "Continuer le Module", 
    "startModule": "Commencer le Module",
    "moduleProgress": "Progression du Module",
    "completedChapters": "Chapitres Terminés",
    "totalChapters": "Total Chapitres",
    "currentChapter": "Chapitre Actuel",
    "nextCourse": "Cours Suivant"
  }
}
```

## Navigation Updates

### Main App Navigation
- "Modules" instead of "Courses" in main navigation
- "All Modules" instead of "All Courses" 
- Individual course pages show: "Module > Chapter > Course"

### Backoffice Navigation  
- "Modules" replaces "Courses" in sidebar
- New section: "Chapters" (optional, or manage within modules)
- Course management happens within chapters

## URL Structure Updates

### Current URLs → New URLs
- `/courses` → `/modules`
- `/courses/[id]` → `/modules/[id]` 
- `/backoffice/courses` → `/backoffice/modules`
- `/backoffice/courses/create` → `/backoffice/modules/create`
- `/backoffice/courses/[id]/edit` → `/backoffice/modules/[id]/edit`

### New URLs for Chapters & Courses
- `/modules/[moduleId]/chapters/[chapterId]`
- `/modules/[moduleId]/chapters/[chapterId]/courses/[courseId]`
- `/backoffice/modules/[moduleId]/chapters`
- `/backoffice/modules/[moduleId]/chapters/create`
- `/backoffice/modules/[moduleId]/chapters/[chapterId]/courses`

## Implementation Notes

1. **Phase 1**: Update translation keys and basic terminology
2. **Phase 2**: Update database queries to use new table names 
3. **Phase 3**: Update URL routing structure
4. **Phase 4**: Create new course management UI within chapters
5. **Phase 5**: Update progress tracking for individual courses

The hierarchy is now:
- **Module** (top-level learning unit, formerly "course")
- **Chapter** (section within module, formerly "module") 
- **Course** (individual lesson with video + optional quiz/file)