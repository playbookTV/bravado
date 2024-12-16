import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AuthenticatedLayout from '../components/layout/AuthenticatedLayout'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Loader2, Search, Filter, Plus } from 'lucide-react'

interface Draft {
  id: string
  title: string
  content_type: string
  tone: string
  length: string
  created_at: string
  updated_at: string
  is_published: boolean
}

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'updated' | 'created'>('updated')

  useEffect(() => {
    if (user) {
      fetchDrafts()
    }
  }, [user])

  const fetchDrafts = async () => {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('user_id', user!.id)
        .order(sortBy === 'updated' ? 'updated_at' : 'created_at', { ascending: false })

      if (error) throw error

      setDrafts(data || [])
    } catch (error) {
      console.error('Error fetching drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = contentTypeFilter === 'all' || draft.content_type === contentTypeFilter
    return matchesSearch && matchesType
  })

  const handleCreateNew = () => {
    router.push('/new')
  }

  const handleEditDraft = (draftId: string) => {
    router.push(`/content/${draftId}`)
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Content</h1>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search drafts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={contentTypeFilter}
              onValueChange={setContentTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="blog">Blog Posts</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="seo">SEO Content</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value: 'updated' | 'created') => setSortBy(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="created">Created Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDrafts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrafts.map((draft) => (
              <Card key={draft.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{draft.title}</CardTitle>
                  <CardDescription>
                    {draft.content_type} • {draft.tone} • {draft.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(draft.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleEditDraft(draft.id)}
                  >
                    Edit
                  </Button>
                  {draft.is_published && (
                    <span className="text-green-600 dark:text-green-400 text-sm">
                      Published
                    </span>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No drafts found
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Get started by creating your first piece of content.
            </p>
            <Button onClick={handleCreateNew} className="mt-4">
              Create New Content
            </Button>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
} 