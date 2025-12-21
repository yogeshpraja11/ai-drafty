import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useConnectionTest } from '@/hooks/useDrafts';
import { ToneType } from '@/types/draft';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  Palette,
  Bell,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
  Bot
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { settings, updateSettings, isConnected } = useSettings();
  const connectionTest = useConnectionTest();
  const { toast } = useToast();
  const [tempUrl, setTempUrl] = useState(settings.baseUrl);

  const handleTestConnection = async () => {
    const result = await connectionTest.mutateAsync();
    if (result) {
      toast({ title: 'Connection successful', description: 'Backend is reachable.' });
    } else {
      toast({ title: 'Connection failed', description: 'Unable to reach the backend.', variant: 'destructive' });
    }
  };

  const handleSaveUrl = () => {
    updateSettings({ baseUrl: tempUrl });
    toast({ title: 'Settings saved', description: 'API URL has been updated.' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-[hsl(var(--draftly-ai))]" />
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* API Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Backend Connection
            </CardTitle>
            <CardDescription>
              Configure the connection to your Draftly backend server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-url">API URL</Label>
              <div className="flex gap-2">
                <Input
                  id="api-url"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                />
                <Button variant="outline" onClick={handleSaveUrl}>
                  Save
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                {connectionTest.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : isConnected ? (
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--status-sent))]" />
                ) : (
                  <XCircle className="h-5 w-5 text-[hsl(var(--status-rejected))]" />
                )}
                <span className="text-sm">
                  {connectionTest.isPending
                    ? 'Testing connection...'
                    : isConnected
                      ? 'Connected to backend'
                      : 'Not connected'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={connectionTest.isPending}
              >
                Test Connection
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-interval">Poll Interval (ms)</Label>
              <Select
                value={String(settings.pollInterval)}
                onValueChange={(v) => updateSettings({ pollInterval: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="3000">3 seconds</SelectItem>
                  <SelectItem value="5000">5 seconds</SelectItem>
                  <SelectItem value="10000">10 seconds</SelectItem>
                  <SelectItem value="30000">30 seconds</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often to check for new drafts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--draftly-ai))]" />
              AI Preferences
            </CardTitle>
            <CardDescription>
              Configure default settings for AI-generated replies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-tone">Default Tone</Label>
              <Select
                value={settings.defaultTone}
                onValueChange={(v) => updateSettings({ defaultTone: v as ToneType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The default tone used when generating new reply drafts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of Draftly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(v) => updateSettings({ theme: v as 'light' | 'dark' | 'system' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Show toast notifications for new drafts and actions.
                </p>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => updateSettings({ notificationsEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Email Signature
            </CardTitle>
            <CardDescription>
              Customize the signature appended to AI-generated replies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signature">Signature</Label>
              <textarea
                id="signature"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={settings.signature || ''}
                onChange={(e) => updateSettings({ signature: e.target.value })}
                placeholder="Sent from my AI Assistant"
              />
              <p className="text-xs text-muted-foreground">
                This will be automatically added to the end of generated drafts.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}