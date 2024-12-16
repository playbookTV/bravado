import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import { useTemplates } from '../../hooks/useTemplates'
import { useToast } from '../../utils/useToast'
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Label } from '../../components/ui/label'
import { Loader2, Plus, Search, Tag, Trash2 } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Template, TemplateCategory } from '../../types/content'

export default function TemplatesPage() {
  const router = useRouter()
  const { getTemplates, getCategories, deleteTemplate } = useTemplates()
  const { error: showError, success } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [selectedCategory, searchQuery, showPublicOnly])

  const fetchData = async () => {
    try {
      const [templatesData, categoriesData] = await Promise.all([
        getTemplates({
          categoryId: selectedCategory || undefined,
          isPublic: showPublicOnly || undefined,
          searchQuery: searchQuery || undefined,
        }),
        getCategories(),
      ])

      setTemplates(templatesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      showError('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    try {
      setIsDeleting(templateId)
      const success = await deleteTemplate(templateId)
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
        success('Template deleted successfully')
      } else {
        throw new Error('Failed to delete template')
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      showError('Failed to delete template')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleCreateNew = () => {
    router.push('/templates/new')
  }

  const handleEdit = (templateId: string) => {
    router.push(`/templates/${templateId}`)
  }

  return (
    <AuthenticatedLayout>
      <Head>
        <title>Templates - Bravado</title>
        <meta name="description" content="Browse and manage your content templates" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Templates</h1>
            <Button onClick={handleCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={showPublicOnly ? 'public' : 'all'}
              onValueChange={(value) => setShowPublicOnly(value === 'public')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="public">Public Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="line-clamp-2">{template.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Template</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this template? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(template.id)}
                                  disabled={isDeleting === template.id}
                                >
                                  {isDeleting === template.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    'Delete'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={template.is_public ? 'default' : 'secondary'}>
                            {template.is_public ? 'Public' : 'Private'}
                          </Badge>
                          <Badge variant="outline">{template.content_type}</Badge>
                          <Badge variant="outline">{template.tone}</Badge>
                          <Badge variant="outline">{template.length}</Badge>
                        </div>
                        {template.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {template.tags.map((tag) => (
                              <div
                                key={tag}
                                className="flex items-center gap-1 text-xs text-gray-500"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="mt-auto pt-4">
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleEdit(template.id)}
                        >
                          Edit Template
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">No templates found</h2>
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedCategory || showPublicOnly
                  ? 'Try adjusting your filters'
                  : 'Create your first template to get started'}
              </p>
              {!searchQuery && !selectedCategory && !showPublicOnly && (
                <Button onClick={handleCreateNew}>Create Template</Button>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 