'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Command,
  Crown,
  FileText,
  Grid2X2,
  Keyboard,
  List,
  Loader2,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  PlusCircle,
  Search,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserPlus,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardWidget } from '@/components/ui/dashboard-widget';
import { DataTable, DataTableCell, DataTableHead } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
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
  users?: {
    id: string;
    email: string;
  };
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: {
    title?: string;
    email?: string;
    role?: string;
  };
  created_at: string;
  actor?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'disabled';
  created_at: string;
  invited_at?: string;
}

interface AnalyticsData {
  stats: {
    totalNotes: number;
    teamMembers: number;
    activityCount: number;
    plan: string;
  };
  notesCreatedOverTime: Array<{
    date: string;
    count: number;
  }>;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

interface NotesAppProps {
  user: User;
  token: string;
  onLogout: () => void;
}

type SortMode = 'updated' | 'created' | 'title';
type ViewMode = 'grid' | 'list';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();

export function NotesApp({ user, token, onLogout }: NotesAppProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEnterpriseLoading, setIsEnterpriseLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'today'>('all');
  const [query, setQuery] = useState('');
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'member' as TeamMember['role'] });
  const [profileData, setProfileData] = useState({ name: '', avatarUrl: '' });
  const searchRef = useRef<HTMLInputElement>(null);

  const roleLabel = user.role === 'superadmin' ? 'Superadmin' : user.role === 'admin' ? 'Admin' : 'User';
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const canCreateMoreNotes = user.tenant.plan === 'pro' || notes.length < 3;

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/notes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.data.notes);
    } catch (error) {
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchEnterpriseData = useCallback(async () => {
    setIsEnterpriseLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      const [activityResponse, analyticsResponse, profileResponse, teamResponse] = await Promise.all([
        fetch('/api/activity?limit=20', { headers }),
        fetch('/api/analytics', { headers }),
        fetch('/api/profile', { headers }),
        isAdmin ? fetch('/api/team', { headers }) : Promise.resolve(null),
      ]);

      if (activityResponse.ok) {
        const data = await activityResponse.json();
        setActivities(data.data.activities);
      }

      if (analyticsResponse.ok) {
        const data = await analyticsResponse.json();
        setAnalytics(data.data);
      }

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfile(data.data.profile);
        setProfileData({
          name: data.data.profile.name || '',
          avatarUrl: data.data.profile.avatarUrl || '',
        });
      }

      if (teamResponse && teamResponse.ok) {
        const data = await teamResponse.json();
        setTeamMembers(data.data.members);
      }
    } catch (error) {
      toast.error('Failed to load enterprise workspace data');
    } finally {
      setIsEnterpriseLoading(false);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    fetchNotes();
    fetchEnterpriseData();
  }, [fetchEnterpriseData, fetchNotes]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandOpen(true);
      }

      if (!isTyping && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openCreateDialog();
      }

      if (!isTyping && event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesQuery = `${note.title} ${note.content}`.toLowerCase().includes(query.toLowerCase());
        const matchesFilter =
          filterMode === 'all' ||
          (filterMode === 'mine' && note.users?.email === user.email) ||
          (filterMode === 'today' && isToday(note.created_at));
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (sortMode === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortMode === 'created') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [filterMode, notes, query, sortMode, user.email]);

  const metrics = useMemo(() => {
    const todayCount = notes.filter((note) => isToday(note.created_at)).length;
    const mineCount = notes.filter((note) => note.users?.email === user.email).length;
    const lastUpdated = notes.length
      ? formatDate([...notes].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at)
      : 'No activity';

    return {
      todayCount,
      mineCount,
      teamCount: notes.length,
      lastUpdated,
    };
  }, [notes, user.email]);

  const recentActivity = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 4);
  }, [notes]);

  const activityFeed = activities.length
    ? activities
    : recentActivity.map((note) => ({
        id: note.id,
        action: 'note.updated',
        entityType: 'note',
        entityId: note.id,
        metadata: { title: note.title },
        created_at: note.updated_at,
        actor: note.users,
      }));

  const maxChartValue = Math.max(1, ...(analytics?.notesCreatedOverTime || []).map((item) => item.count));

  const globalSearchResults = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    return [
      ...notes
        .filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 4)
        .map((note) => ({
          id: `note-${note.id}`,
          label: note.title,
          description: 'Note',
          icon: FileText,
          action: () => openEditDialog(note),
        })),
      ...teamMembers
        .filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 3)
        .map((member) => ({
          id: `member-${member.id}`,
          label: member.email,
          description: `${member.role} team member`,
          icon: Users,
          action: () => setIsSettingsOpen(true),
        })),
    ];
  }, [notes, query, teamMembers]);

  const updateTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const openCreateDialog = () => {
    if (!canCreateMoreNotes) {
      toast.error('Free plan allows a maximum of 3 notes. Upgrade to Pro for unlimited notes.');
      return;
    }
    setEditingNote(null);
    setFormData({ title: '', content: '' });
    setIsEditorOpen(true);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content });
    setIsEditorOpen(true);
  };

  const handleSaveNote = async () => {
    if (!formData.title.trim()) {
      toast.error('Add a title before saving');
      return;
    }

    setIsSaving(true);
    const previousNotes = notes;

    try {
      if (editingNote) {
        const optimisticNote = {
          ...editingNote,
          title: formData.title,
          content: formData.content,
          updated_at: new Date().toISOString(),
        };
        setNotes((current) => current.map((note) => (note.id === editingNote.id ? optimisticNote : note)));

        const response = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update note');
        }

        setNotes((current) => current.map((note) => (note.id === editingNote.id ? data.data.note : note)));
        toast.success('Note updated');
      } else {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create note');
        }

        setNotes((current) => [data.data.note, ...current]);
        toast.success('Note created');
      }

      fetchEnterpriseData();
      setFormData({ title: '', content: '' });
      setEditingNote(null);
      setIsEditorOpen(false);
    } catch (error) {
      setNotes(previousNotes);
      toast.error(error instanceof Error ? error.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteTarget) {
      return;
    }

    const previousNotes = notes;
    setNotes((current) => current.filter((note) => note.id !== deleteTarget.id));
    setDeleteTarget(null);

    try {
      const response = await fetch(`/api/notes/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      toast.success('Note deleted');
      fetchEnterpriseData();
    } catch (error) {
      setNotes(previousNotes);
      toast.error('Failed to delete note');
    }
  };

  const handleInviteMember = async () => {
    if (!inviteData.email.trim()) {
      toast.error('Enter an email address');
      return;
    }

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inviteData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to invite team member');
      }

      setTeamMembers((current) => [...current, data.data.member]);
      setInviteData({ name: '', email: '', role: 'member' });
      setIsInviteOpen(false);
      fetchEnterpriseData();
      toast.success(`Team member invited. Temporary password: ${data.data.temporaryPassword}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to invite team member');
    }
  };

  const handleRoleChange = async (memberId: string, role: TeamMember['role']) => {
    try {
      const response = await fetch(`/api/team/${memberId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update role');
      }

      setTeamMembers((current) => current.map((member) => (member.id === memberId ? data.data.member : member)));
      fetchEnterpriseData();
      toast.success('Role updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Choose a PNG, JPEG, or WebP image');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('Avatar image must be 1MB or smaller');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileData((current) => ({ ...current, avatarUrl: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setProfile(data.data.profile);
      fetchEnterpriseData();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleUpgradeTenant = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch(`/api/tenants/${user.tenant.slug}/upgrade`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upgrade');
      }

      toast.success('Workspace upgraded to Pro');
      const updatedUser = { ...user, tenant: { ...user.tenant, plan: 'pro' as const } };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  const commandActions = [
    { label: 'Create note', icon: PlusCircle, action: openCreateDialog },
    { label: 'Focus search', icon: Search, action: () => searchRef.current?.focus() },
    { label: 'Invite team member', icon: UserPlus, action: () => setIsInviteOpen(true) },
    { label: 'Open settings', icon: Settings, action: () => setIsSettingsOpen(true) },
    { label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', icon: theme === 'dark' ? Sun : Moon, action: updateTheme },
  ];

  const describeActivity = (activity: ActivityItem) => {
    const title = activity.metadata?.title || activity.metadata?.email || activity.entityType;
    const actor = activity.actor?.email || 'Someone';
    const labels: Record<string, string> = {
      'note.created': 'created',
      'note.updated': 'updated',
      'note.deleted': 'deleted',
      'user.invited': 'invited',
      'user.role_updated': 'changed role for',
      'profile.updated': 'updated profile',
    };

    return `${actor} ${labels[activity.action] || activity.action} ${title}`;
  };

  const NavItems = () => (
    <nav className="grid gap-1 text-sm" aria-label="Primary navigation">
      {[
        { label: 'Overview', icon: BarChart3 },
        { label: 'Notes', icon: FileText },
        { label: 'Activity', icon: Bell },
        { label: 'Settings', icon: Settings, onClick: () => setIsSettingsOpen(true) },
      ].map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          className="flex items-center gap-3 rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );

  return (
    <main className="min-h-screen bg-muted/30 text-foreground dark:bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background px-4 py-5 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">NotesFlow</p>
            <p className="text-xs text-muted-foreground">SaaS workspace</p>
          </div>
        </div>
        <NavItems />
        <Card className="mt-6 bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm font-semibold">{user.tenant.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Tenant slug: {user.tenant.slug}</p>
            <div className="mt-3 flex gap-2">
              <Badge variant={user.tenant.plan === 'pro' ? 'default' : 'secondary'}>{user.tenant.plan} plan</Badge>
              <Badge variant="outline">{roleLabel}</Badge>
            </div>
          </CardContent>
        </Card>
      </aside>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-50 bg-background p-5 lg:hidden">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 font-semibold">
              <Building2 className="h-5 w-5" />
              NotesFlow
            </div>
            <Button variant="ghost" size="compactIcon" aria-label="Close navigation" onClick={() => setIsMobileNavOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <NavItems />
        </div>
      ) : null}

      <section className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="compactIcon" className="lg:hidden" aria-label="Open navigation" onClick={() => setIsMobileNavOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold sm:text-xl">Workspace Dashboard</h1>
                <p className="hidden text-sm text-muted-foreground sm:block">{user.tenant.name} knowledge hub</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden gap-2 md:flex" onClick={() => setIsCommandOpen(true)}>
                <Command className="h-4 w-4" />
                Command
                <kbd className="rounded border bg-muted px-1.5 text-[10px] text-muted-foreground">Ctrl K</kbd>
              </Button>
              <Button variant="ghost" size="compactIcon" aria-label="Toggle theme" onClick={updateTheme}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="relative">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsProfileOpen((open) => !open)}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {user.email.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{user.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {isProfileOpen ? (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-card p-2 shadow-xl">
                    <div className="border-b p-3">
                      <p className="font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{roleLabel} at {user.tenant.name}</p>
                    </div>
                    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setIsSettingsOpen(true)}>
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10" onClick={onLogout}>
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
          {user.tenant.plan === 'free' ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <Zap className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Free plan usage: <strong>{notes.length}/3 notes</strong>. Upgrade for unlimited workspace notes.
                </span>
                {isAdmin ? (
                  <Button size="sm" variant="premium" onClick={handleUpgradeTenant} disabled={isUpgrading}>
                    {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Upgrade
                  </Button>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard overview">
            <DashboardWidget label="Total Notes" value={analytics?.stats.totalNotes ?? notes.length} icon={<FileText className="h-5 w-5" />} meta="Tenant scoped records" />
            <DashboardWidget label="Created Today" value={metrics.todayCount} icon={<Calendar className="h-5 w-5" />} meta="New workspace activity" />
            <DashboardWidget label="Team Members" value={analytics?.stats.teamMembers ?? (teamMembers.length || 1)} icon={<Users className="h-5 w-5" />} meta={user.tenant.name} />
            <DashboardWidget label="Activity Events" value={analytics?.stats.activityCount ?? activities.length} icon={<Bell className="h-5 w-5" />} meta="Audit trail enabled" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_420px]" aria-label="Enterprise workspace">
            <Card>
              <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                  <CardDescription>Notes created over time, tenant statistics, and usage signals.</CardDescription>
                </div>
                <Badge variant="outline">{analytics?.stats.plan || user.tenant.plan} plan</Badge>
              </CardHeader>
              <CardContent>
                {isEnterpriseLoading ? (
                  <div className="grid gap-3">
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : analytics?.notesCreatedOverTime.length ? (
                  <div className="flex h-56 items-end gap-2 rounded-lg border bg-muted/40 p-4" role="img" aria-label="Notes created over time chart">
                    {analytics.notesCreatedOverTime.map((item) => (
                      <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-40 w-full items-end rounded bg-background">
                          <div
                            className="w-full rounded bg-primary transition-all"
                            style={{ height: `${Math.max(8, (item.count / maxChartValue) * 100)}%` }}
                            title={`${item.count} notes on ${item.date}`}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{item.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<BarChart3 className="h-6 w-6" />}
                    title="No analytics yet"
                    description="Create notes to populate usage charts and tenant statistics."
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">Team Management</CardTitle>
                  <CardDescription>Invite users and manage Owner, Admin, and Member roles.</CardDescription>
                </div>
                {isAdmin ? (
                  <Button size="sm" onClick={() => setIsInviteOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  teamMembers.length ? (
                    <div className="space-y-3">
                      {teamMembers.slice(0, 5).map((member) => (
                        <div key={member.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                              {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" /> : member.email.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{member.name || member.email}</p>
                              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <select
                            aria-label={`Role for ${member.email}`}
                            className="h-9 rounded-md border bg-background px-2 text-xs"
                            value={member.role}
                            onChange={(event) => handleRoleChange(member.id, event.target.value as TeamMember['role'])}
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No team members loaded yet.</p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">Admin access is required to manage users.</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <Card>
                <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">Notes</CardTitle>
                    <CardDescription>Search, sort, filter, and manage tenant notes.</CardDescription>
                  </div>
                  <Button onClick={openCreateDialog} disabled={!canCreateMoreNotes}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Note
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        ref={searchRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search notes..."
                        className="pl-9"
                      />
                    </div>
                    <select className="h-10 rounded-md border bg-background px-3 text-sm shadow-sm" value={filterMode} onChange={(event) => setFilterMode(event.target.value as typeof filterMode)}>
                      <option value="all">All notes</option>
                      <option value="mine">My notes</option>
                      <option value="today">Created today</option>
                    </select>
                    <select className="h-10 rounded-md border bg-background px-3 text-sm shadow-sm" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                      <option value="updated">Last updated</option>
                      <option value="created">Newest created</option>
                      <option value="title">Title A-Z</option>
                    </select>
                    <div className="flex rounded-md border bg-background p-1 shadow-sm">
                      <Button variant={viewMode === 'grid' ? 'subtle' : 'ghost'} size="compactIcon" aria-label="Grid view" onClick={() => setViewMode('grid')}>
                        <Grid2X2 className="h-4 w-4" />
                      </Button>
                      <Button variant={viewMode === 'list' ? 'subtle' : 'ghost'} size="compactIcon" aria-label="List view" onClick={() => setViewMode('list')}>
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="rounded-lg border bg-card p-5">
                          <Skeleton className="h-5 w-2/3" />
                          <Skeleton className="mt-4 h-4 w-full" />
                          <Skeleton className="mt-2 h-4 w-4/5" />
                        </div>
                      ))}
                    </div>
                  ) : notes.length === 0 ? (
                    <EmptyState
                      icon={<FileText className="h-6 w-6" />}
                      title="Welcome to your workspace"
                      description="Create your first note to start building a tenant-scoped knowledge base. Use N for a new note, / to search, and Ctrl K for commands."
                      action={
                        <Button onClick={openCreateDialog}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create first note
                        </Button>
                      }
                    />
                  ) : filteredNotes.length === 0 ? (
                    <EmptyState
                      icon={<Search className="h-6 w-6" />}
                      title="No matching notes"
                      description="Try a different search term, filter, or sort order."
                      action={<Button variant="outline" onClick={() => { setQuery(''); setFilterMode('all'); }}>Clear filters</Button>}
                    />
                  ) : viewMode === 'grid' ? (
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                      {filteredNotes.map((note) => (
                        <Card key={note.id} className="group animate-in transition-all hover:border-muted-foreground/30 hover:shadow-md">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                              <CardTitle className="line-clamp-2 text-lg">{note.title}</CardTitle>
                              <div className="flex opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                                <Button variant="ghost" size="compactIcon" aria-label={`Edit ${note.title}`} onClick={() => openEditDialog(note)}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {note.users?.email || 'Unknown user'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
                              {note.content || 'No content yet.'}
                            </p>
                            <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                              <span>Updated {formatDate(note.updated_at)}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="compactIcon" aria-label={`Edit ${note.title}`} onClick={() => openEditDialog(note)}>
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="compactIcon" aria-label={`Delete ${note.title}`} onClick={() => setDeleteTarget(note)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <DataTable>
                      <thead>
                        <tr>
                          <DataTableHead>Title</DataTableHead>
                          <DataTableHead>Owner</DataTableHead>
                          <DataTableHead>Updated</DataTableHead>
                          <DataTableHead className="text-right">Actions</DataTableHead>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNotes.map((note) => (
                          <tr key={note.id}>
                            <DataTableCell>
                              <p className="font-medium">{note.title}</p>
                              <p className="line-clamp-1 text-xs text-muted-foreground">{note.content || 'No content yet.'}</p>
                            </DataTableCell>
                            <DataTableCell>{note.users?.email || 'Unknown user'}</DataTableCell>
                            <DataTableCell>{formatDate(note.updated_at)}</DataTableCell>
                            <DataTableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(note)}>Edit</Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(note)}>Delete</Button>
                            </DataTableCell>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Workspace activity signals.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-md bg-muted p-3">
                    <span>Last Updated</span>
                    <strong>{metrics.lastUpdated}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-muted p-3">
                    <span>Personal Activity</span>
                    <strong>{metrics.mineCount}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-muted p-3">
                    <span>Team Activity</span>
                    <strong>{analytics?.stats.activityCount ?? metrics.teamCount}</strong>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest note updates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activityFeed.length ? activityFeed.slice(0, 6).map((activity) => (
                    <button key={activity.id} className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-muted" onClick={() => setIsCommandOpen(true)}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>
                        <span className="line-clamp-1 text-sm font-medium">{describeActivity(activity)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</span>
                      </span>
                    </button>
                  )) : (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                  <CardDescription>Make the workspace useful fast.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {['Create a team note', 'Use search to find context', 'Open command palette with Ctrl K'].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </section>
        </div>
      </section>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit note' : 'Create note'}</DialogTitle>
            <DialogDescription>Notes are saved inside the active tenant workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              aria-label="Note title"
              placeholder="Note title"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            />
            <Textarea
              aria-label="Note content"
              placeholder="Write the note..."
              rows={10}
              value={formData.content}
              onChange={(event) => setFormData({ ...formData, content: event.target.value })}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveNote} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingNote ? 'Save changes' : 'Create note'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note?</DialogTitle>
            <DialogDescription>This action removes the note from the tenant workspace.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteNote}>Delete note</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Profile, workspace, and security settings preview.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Visible account information and avatar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                    {profileData.avatarUrl ? <img src={profileData.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.email.slice(0, 1).toUpperCase()}
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-muted">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload avatar
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <Input value={profileData.name} onChange={(event) => setProfileData({ ...profileData, name: event.target.value })} aria-label="Name" placeholder="Name" />
                <Input value={profile?.email || user.email} readOnly aria-label="Email" />
                <Button onClick={handleProfileSave}>Save profile</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>Tenant and plan information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><strong>Tenant:</strong> {user.tenant.name}</p>
                <p><strong>Slug:</strong> {user.tenant.slug}</p>
                <p><strong>Plan:</strong> {user.tenant.plan}</p>
                <p><strong>Role:</strong> {roleLabel}</p>
              </CardContent>
            </Card>
            {isAdmin ? (
              <Card className="md:col-span-2">
                <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Workspace members with enterprise roles.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsInviteOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite user
                  </Button>
                </CardHeader>
                <CardContent>
                  <DataTable>
                    <thead>
                      <tr>
                        <DataTableHead>User</DataTableHead>
                        <DataTableHead>Status</DataTableHead>
                        <DataTableHead>Role</DataTableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id}>
                          <DataTableCell>
                            <p className="font-medium">{member.name || member.email}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </DataTableCell>
                          <DataTableCell>{member.status}</DataTableCell>
                          <DataTableCell>
                            <select
                              aria-label={`Role for ${member.email}`}
                              className="h-9 rounded-md border bg-background px-2 text-xs"
                              value={member.role}
                              onChange={(event) => handleRoleChange(member.id, event.target.value as TeamMember['role'])}
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                            </select>
                          </DataTableCell>
                        </tr>
                      ))}
                    </tbody>
                  </DataTable>
                </CardContent>
              </Card>
            ) : null}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Password changes need a backend endpoint before activation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input type="password" placeholder="New password" disabled aria-label="New password" />
                <Button disabled>
                  <Shield className="mr-2 h-4 w-4" />
                  Change password
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>Add a user to this tenant with an enterprise role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={inviteData.name} onChange={(event) => setInviteData({ ...inviteData, name: event.target.value })} />
            <Input type="email" placeholder="name@company.com" value={inviteData.email} onChange={(event) => setInviteData({ ...inviteData, email: event.target.value })} />
            <select className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-sm" value={inviteData.role} onChange={(event) => setInviteData({ ...inviteData, role: event.target.value as TeamMember['role'] })}>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInviteMember}>
                <UserPlus className="mr-2 h-4 w-4" />
                Send invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              Command palette
            </DialogTitle>
            <DialogDescription>Run common workspace actions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes, people, and actions..."
              aria-label="Global command search"
            />
            {globalSearchResults.length ? (
              <div className="space-y-2">
                {globalSearchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      item.action();
                      setIsCommandOpen(false);
                    }}
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <span className="block font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            {commandActions.map((item) => (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  item.action();
                  setIsCommandOpen(false);
                }}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </button>
            ))}
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <Keyboard className="mr-2 inline h-3 w-3" />
              Shortcuts: Ctrl K command palette, N new note, / search.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
