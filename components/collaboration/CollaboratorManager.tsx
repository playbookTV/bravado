import { useState, useEffect } from 'react'
import { useCollaboration, CollaboratorRole } from '../../hooks/useCollaboration'
import { useToast } from '../../utils/useToast'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Loader2, Plus, Trash2, UserPlus } from 'lucide-react'

interface CollaboratorManagerProps {
  draftId: string
}

export default function CollaboratorManager({ draftId }: CollaboratorManagerProps) {
  const { getCollaborators, addCollaborator, updateCollaborator, removeCollaborator, loading } = useCollaboration(draftId)
  const { error: showError, success } = useToast()
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false)
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('')
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<CollaboratorRole>('viewer')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetchCollaborators()
  }, [draftId])

  const fetchCollaborators = async () => {
    try {
      const data = await getCollaborators()
      setCollaborators(data)
    } catch (error) {
      console.error('Failed to fetch collaborators:', error)
      showError('Failed to load collaborators')
    }
  }

  const handleAddCollaborator = async () => {
    try {
      setIsAddingCollaborator(true)
      const collaborator = await addCollaborator(newCollaboratorEmail, newCollaboratorRole)
      if (collaborator) {
        setCollaborators(prev => [...prev, collaborator])
        success('Collaborator added successfully')
        setNewCollaboratorEmail('')
        setNewCollaboratorRole('viewer')
      }
    } catch (error) {
      console.error('Failed to add collaborator:', error)
      showError('Failed to add collaborator')
    } finally {
      setIsAddingCollaborator(false)
    }
  }

  const handleUpdateRole = async (collaboratorId: string, role: CollaboratorRole) => {
    try {
      setIsUpdating(collaboratorId)
      const updatedCollaborator = await updateCollaborator(collaboratorId, role)
      if (updatedCollaborator) {
        setCollaborators(prev =>
          prev.map(c => (c.id === collaboratorId ? updatedCollaborator : c))
        )
        success('Collaborator role updated')
      }
    } catch (error) {
      console.error('Failed to update collaborator:', error)
      showError('Failed to update collaborator role')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      setIsRemoving(collaboratorId)
      const success = await removeCollaborator(collaboratorId)
      if (success) {
        setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
        success('Collaborator removed successfully')
      }
    } catch (error) {
      console.error('Failed to remove collaborator:', error)
      showError('Failed to remove collaborator')
    } finally {
      setIsRemoving(null)
    }
  }

  if (loading && !collaborators.length) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Collaborators</CardTitle>
          <CardDescription>Manage who can access this draft</CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Collaborator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Collaborator</DialogTitle>
              <DialogDescription>
                Invite someone to collaborate on this draft
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <Select
                  value={newCollaboratorRole}
                  onValueChange={(value: CollaboratorRole) => setNewCollaboratorRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddCollaborator}
                disabled={!newCollaboratorEmail || isAddingCollaborator}
              >
                {isAddingCollaborator ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Collaborator
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex items-center justify-between p-2 rounded-lg border"
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={collaborator.user?.avatar_url} />
                  <AvatarFallback>
                    {collaborator.user?.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{collaborator.user?.email}</p>
                  <p className="text-sm text-gray-500">
                    Added {new Date(collaborator.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={collaborator.role}
                  onValueChange={(value: CollaboratorRole) =>
                    handleUpdateRole(collaborator.id, value)
                  }
                  disabled={isUpdating === collaborator.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
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
                      <DialogTitle>Remove Collaborator</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to remove this collaborator? They will no longer have access to this draft.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        disabled={isRemoving === collaborator.id}
                      >
                        {isRemoving === collaborator.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          'Remove'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}

          {!collaborators.length && (
            <div className="text-center py-6 text-gray-500">
              <p>No collaborators yet</p>
              <p className="text-sm">Add collaborators to work together on this draft</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 