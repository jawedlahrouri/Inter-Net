import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { verifyEmailApi } from '@/services/api';
import { MailConfirmationCard, MailVerificationAlert, MailNotice } from '@/components/mail';
import { CguDialog } from '@/components/legal/CguDialog';

/**
 * @brief Renders the authentication card with login and registration tabs and their validation state.
 * @return A card with a tabbed login form and registration form, including error messages and loading states.
 */
export function AuthCard() {
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isUnverifiedError, setIsUnverifiedError] = useState(false);

  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [cguOpen, setCguOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('verify_token');
    const verifiedParam = params.get('verified');
    const errorParam = params.get('error');

    if (verifiedParam === 'true') {
      setVerificationStatus('success');
      setVerificationMessage('Votre compte a été activé avec succès ! Vous pouvez maintenant vous connecter.');
      setActiveTab('login');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (errorParam === 'invalid') {
      setVerificationStatus('error');
      setVerificationMessage('Le jeton de confirmation est invalide ou a expiré.');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (token) {
      setVerificationStatus('loading');
      verifyEmailApi(token)
        .then((res) => {
          setVerificationStatus('success');
          setVerificationMessage(res.message || 'Votre compte a été confirmé avec succès ! Vous pouvez maintenant vous connecter.');
          setActiveTab('login');
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch((err) => {
          setVerificationStatus('error');
          setVerificationMessage(err instanceof Error ? err.message : 'Échec de la validation de votre compte.');
          window.history.replaceState({}, '', window.location.pathname);
        });
    }
  }, []);

  /**
   * @brief Validates the login form and calls the auth context login, storing any error message.
   * @param e The form submit event, whose default behavior is prevented.
   */
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsUnverifiedError(false);

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
      const msg = err instanceof Error ? err.message : 'Échec de la connexion.';
      setLoginError(msg);
      if (msg.toLowerCase().includes('activé') || msg.toLowerCase().includes('vérifi') || msg.toLowerCase().includes('confirmer')) {
        setIsUnverifiedError(true);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  /**
   * @brief Validates the registration form (required fields, password length and confirmation) and calls the auth context register.
   * @param e The form submit event, whose default behavior is prevented.
   */
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
      const res = await register({
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
      });
      setRegisteredEmail(res.email || regEmail.trim());
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Échec de l'inscription.");
    } finally {
      setRegLoading(false);
    }
  };



  if (verificationStatus === 'loading') {
    return (
      <Card className="w-full max-w-md mx-auto border border-border/80 bg-card rounded-lg shadow-xs p-8 text-center space-y-4">
        <Loader2 className="size-10 animate-spin text-primary mx-auto" />
        <CardTitle className="text-lg font-medium text-foreground">Activation de votre compte...</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Veuillez patienter pendant la validation de votre adresse email.
        </CardDescription>
      </Card>
    );
  }

  if (registeredEmail) {
    return (
      <MailConfirmationCard
        email={registeredEmail}
        onBackToLogin={() => {
          setRegisteredEmail(null);
          setActiveTab('login');
        }}
      />
    );
  }

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
        {/* Bannière de notification après validation de compte */}
        {verificationStatus === 'success' && verificationMessage && (
          <div className="mb-4 p-3 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            <span>{verificationMessage}</span>
          </div>
        )}

        {verificationStatus === 'error' && verificationMessage && (
          <div className="mb-4 p-3 rounded-md bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{verificationMessage}</span>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as 'login' | 'register');
            setLoginError(null);
            setIsUnverifiedError(false);
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

          <TabsContent value="login" className="space-y-4 focus-visible:outline-none">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {loginError && (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                  {isUnverifiedError && loginIdentifier.includes('@') && (
                    <MailVerificationAlert
                      email={loginIdentifier.trim()}
                      message="Votre compte est en attente de validation."
                      variant="destructive"
                    />
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="login-identifier" className="text-xs font-medium text-foreground/80 block">
                  Email ou nom d'utilisateur
                </label>
                <Input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="nom@domaine.com ou pseudo"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  disabled={loginLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="login-password" className="text-xs font-medium text-foreground/80 block">
                  Mot de passe
                </label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
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

          <TabsContent value="register" className="space-y-4 focus-visible:outline-none">
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regError && (
                <div role="alert" aria-live="polite" className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="reg-email" className="text-xs font-medium text-foreground/80 block">
                  Adresse email
                </label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="exemple@domaine.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={regLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-username" className="text-xs font-medium text-foreground/80 block">
                  Nom d'utilisateur
                </label>
                <Input
                  id="reg-username"
                  type="text"
                  autoComplete="username"
                  placeholder="pseudo"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={regLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-password" className="text-xs font-medium text-foreground/80 block">
                  Mot de passe (min 6 caractères)
                </label>
                <Input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={regLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-confirm-password" className="text-xs font-medium text-foreground/80 block">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="reg-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  disabled={regLoading}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <MailNotice />

              <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 pt-1">
                <span>En créant un compte, vous acceptez les</span>
                <button
                  type="button"
                  onClick={() => setCguOpen(true)}
                  className="text-primary hover:underline font-medium cursor-pointer inline-flex items-center"
                >
                  CGU
                </button>
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

      <CguDialog open={cguOpen} onOpenChange={setCguOpen} />
    </Card>
  );
}

export default AuthCard;
