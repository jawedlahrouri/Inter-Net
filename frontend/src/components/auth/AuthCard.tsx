import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

export function AuthCard() {
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

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
    <Card className="w-full max-w-md mx-auto border border-border/80 bg-card rounded-lg shadow-xs">
      <CardHeader className="text-center pb-4 pt-6">
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
          {activeTab === 'login' ? 'Connexion' : 'Créer un compte'}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {activeTab === 'login'
            ? 'Entrez vos identifiants pour accéder à votre espace.'
            : 'Remplissez les informations ci-dessous pour vous inscrire.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as 'login' | 'register');
            setLoginError(null);
            setRegError(null);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-5 h-9 bg-muted/50 p-1 rounded-md border border-border/60">
            <TabsTrigger value="login" className="text-xs font-medium cursor-pointer">
              Se connecter
            </TabsTrigger>
            <TabsTrigger value="register" className="text-xs font-medium cursor-pointer">
              S'inscrire
            </TabsTrigger>
          </TabsList>

          {/* Onglet Connexion */}
          <TabsContent value="login" className="space-y-4 focus-visible:outline-none">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {loginError && (
                <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/80 block">
                  Email ou nom d'utilisateur
                </label>
                <Input
                  type="text"
                  placeholder="nom@domaine.com ou pseudo"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  disabled={loginLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/80 block">
                  Mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loginLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full h-9 mt-3 text-xs font-medium cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-2" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Onglet Inscription */}
          <TabsContent value="register" className="space-y-4 focus-visible:outline-none">
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regError && (
                <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/80 block">
                  Adresse email
                </label>
                <Input
                  type="email"
                  placeholder="exemple@domaine.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={regLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/80 block">
                  Nom d'utilisateur
                </label>
                <Input
                  type="text"
                  placeholder="pseudo"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={regLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/80 block">
                  Mot de passe (min 6 caractères)
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={regLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/80 block">
                  Confirmer le mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  disabled={regLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={regLoading}
                className="w-full h-9 mt-3 text-xs font-medium cursor-pointer"
              >
                {regLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-2" />
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AuthCard;
