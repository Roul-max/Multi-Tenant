'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, LogOut, Trash2, Edit, Loader2, Crown, Users, Building2, Sparkles, Calendar, User, Zap, TrendingUp, FileText, Star } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'member';
  tenant: {
    id: string;
    slug: string;
    name: string;
    plan: 'free' | 'pro';
  };
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    email: string;
  };
}

interface NotesAppProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export function NotesApp({ user, token, onLogout }: NotesAppProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.notes);
    } catch (error) {
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  const handleCreateNote = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          
        },
        body: JSON.stringify(formData),
        
      });


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create note');
      }

      toast.success('Note created successfully');
      setFormData({ title: '', content: '' });
      setIsDialogOpen(false);
      fetchNotes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create note');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update note');
      }

      toast.success('Note updated successfully');
      setFormData({ title: '', content: '' });
      setEditingNote(null);
      setIsDialogOpen(false);
      fetchNotes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update note');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      toast.success('Note deleted successfully');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleUpgradeTenant = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch(`/api/tenants/${user.tenant.slug}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade');
      }

      toast.success('Successfully upgraded to Pro plan!');
      // Update user data in localStorage
      const updatedUser = { ...user, tenant: { ...user.tenant, plan: 'pro' as const } };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Trigger a re-render by updating state
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  const openCreateDialog = () => {
    setFormData({ title: '', content: '' });
    setEditingNote(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (note: Note) => {
    setFormData({ title: note.title, content: note.content });
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  const canCreateMoreNotes = user.tenant.plan === 'pro' || notes.length < 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  user.tenant.slug === 'acme' 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-600'
                } shadow-lg`}>
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {user.tenant.name}
                  </h1>
                  <p className="text-sm text-gray-500 -mt-1">Workspace</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge 
                  variant={user.tenant.plan === 'pro' ? 'default' : 'secondary'}
                  className={`px-3 py-1 font-semibold ${
                    user.tenant.plan === 'pro' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {user.tenant.plan === 'pro' ? (
                    <>
                      <Star className="w-3 h-3 mr-1" />
                      Pro Plan
                    </>
                  ) : (
                    'Free Plan'
                  )}
                </Badge>
                <Badge 
                  variant={user.role === 'admin' ? 'default' : 'outline'}
                  className={`px-3 py-1 font-semibold ${
                    user.role === 'admin' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg' 
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {user.role === 'admin' ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Admin
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 mr-1" />
                      Member
                    </>
                  )}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user.email}</p>
                <p className="text-xs text-gray-500">{user.role === 'admin' ? 'Administrator' : 'Team Member'}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Plan Status */}
        {user.tenant.plan === 'free' && (
          <Alert className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semibold text-amber-800">
                    Free Plan: {notes.length}/3 notes used
                  </p>
                  <p className="text-sm text-amber-700">
                    {notes.length >= 3 
                      ? 'You\'ve reached your limit. Upgrade to Pro for unlimited notes!' 
                      : `${3 - notes.length} notes remaining`
                    }
                  </p>
                </div>
              </div>
              {user.role === 'admin' && (
                <Button
                  size="sm" 
                  onClick={handleUpgradeTenant}
                  disabled={isUpgrading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </>
                  )}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Create Note Button */}
        <div className="mb-8">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={openCreateDialog}
                disabled={!canCreateMoreNotes}
                className="w-full sm:w-auto h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {editingNote ? 'Edit Note' : 'Create New Note'}
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  {editingNote ? 'Update your note below.' : 'Add a new note to your collection.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Title</label>
                  <Input
                    placeholder="Enter note title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Content</label>
                  <Textarea
                    placeholder="Write your note content here..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingNote ? handleUpdateNote : handleCreateNote}
                    disabled={isCreating}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingNote ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingNote ? 'Update Note' : 'Create Note'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
            <p className="text-gray-600 font-medium">Loading your notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Notes Yet</h3>
                <p className="text-gray-600 mb-6">Create your first note to get started with your workspace.</p>
                <Button 
                  onClick={openCreateDialog}
                  disabled={!canCreateMoreNotes}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Your First Note
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Card 
                key={note.id} 
                className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-700 transition-colors duration-200">
                      {note.title}
                    </CardTitle>
                    <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(note)}
                        className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                    <User className="w-3 h-3" />
                    {note.users.email}
                    <span>•</span>
                    <Calendar className="w-3 h-3" />
                    {new Date(note.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed">
                    {note.content || 'No content'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Powered by NotesFlow • Enterprise Multi-Tenant Architecture
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}