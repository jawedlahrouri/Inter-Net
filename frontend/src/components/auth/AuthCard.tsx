import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

export function AuthCard() {
  const { login, register } = useAuth();

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Veuillez remplir tous les champs.');
      return;
    }

    setLoginLoading(true);
    try {
      await login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Échec de la connexion.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regEmail.trim() || !regUsername.trim() || !regPassword) {
      setRegError('Veuillez remplir tous les champs.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Les mots de passe ne correspondent pas.');
      return;
    }

    setRegLoading(true);
    try {
      await register({
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
      });
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Échec de l'inscription.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-border/60 shadow-2xl bg-card/90 backdrop-blur-xl">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto size-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 mb-2 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
          <div className="size-full bg-background rounded-[14px] flex items-center justify-center">
            <Lock className="size-5 text-indigo-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Espace Authentification</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Connectez-vous pour accéder et personnaliser votre Dashboard.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <LogIn className="size-3.5" />
              Connexion
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="size-3.5" />
              Inscription
            </TabsTrigger>
          </TabsList>

          {/* Onglet Connexion */}
          <TabsContent value="login">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-indigo-400" />
                  Email ou Nom d'utilisateur
                </label>
                <Input
                  type="text"
                  placeholder="nom@domaine.com ou pseudo"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  disabled={loginLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Lock className="size-3.5 text-indigo-400" />
                  Mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loginLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium shadow-md shadow-indigo-500/20"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="size-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Onglet Inscription */}
          <TabsContent value="register">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-indigo-400" />
                  Adresse Email
                </label>
                <Input
                  type="email"
                  placeholder="exemple@domaine.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={regLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="size-3.5 text-indigo-400" />
                  Nom d'utilisateur
                </label>
                <Input
                  type="text"
                  placeholder="mon_pseudo"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={regLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Lock className="size-3.5 text-indigo-400" />
                  Mot de passe (min 6 car.)
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={regLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Lock className="size-3.5 text-indigo-400" />
                  Confirmer le mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  disabled={regLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={regLoading}
                className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white font-medium shadow-md shadow-cyan-500/20"
              >
                {regLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Création du compte...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4 mr-2" />
                    Créer mon compte
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
