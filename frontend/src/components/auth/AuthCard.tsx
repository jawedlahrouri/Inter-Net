import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, MailCheck, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { verifyEmailApi, resendVerificationApi } from '@/services/api';

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
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

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

  const handleResendVerification = async (targetEmail: string) => {
    if (!targetEmail) return;
    setResendLoading(true);
    setResendFeedback(null);
    try {
      const res = await resendVerificationApi(targetEmail);
      setResendFeedback(res.message || 'Un nouvel e-mail de confirmation vous a été envoyé.');
    } catch (err) {
      setResendFeedback(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'email.");
    } finally {
      setResendLoading(false);
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
      <Card className="w-full max-w-md mx-auto border border-border/80 bg-card rounded-lg shadow-xs">
        <CardHeader className="text-center pb-3 pt-6 space-y-2">
          <div className="size-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <MailCheck className="size-6 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
            Vérifiez votre boîte mail
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
            Un e-mail de confirmation a été envoyé à <strong className="text-foreground">{registeredEmail}</strong>.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-2 space-y-4">
          <div className="p-3 rounded-md bg-muted/60 border border-border/80 text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Accès restreint temporairement</p>
            <p>
              Pour débloquer votre accès à l'application, vous devez cliquer sur le bouton de confirmation présent dans cet e-mail.
            </p>
          </div>

          {resendFeedback && (
            <div className="p-2.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs flex items-center gap-2">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>{resendFeedback}</span>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={resendLoading}
              onClick={() => handleResendVerification(registeredEmail)}
              className="w-full h-9 text-xs font-medium cursor-pointer"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="size-3.5 mr-2" />
                  Renvoyer l'e-mail de confirmation
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setRegisteredEmail(null);
                setActiveTab('login');
              }}
              className="w-full h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="size-3.5 mr-2" />
              Retour à la page de connexion
            </Button>
          </div>
        </CardContent>
      </Card>
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

          {/* Onglet Connexion */}
          <TabsContent value="login" className="space-y-4 focus-visible:outline-none">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {loginError && (
                <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                  {isUnverifiedError && loginIdentifier.includes('@') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={resendLoading}
                      onClick={() => handleResendVerification(loginIdentifier.trim())}
                      className="w-full h-8 text-[11px] mt-1 cursor-pointer bg-destructive/5 hover:bg-destructive/15 border-destructive/30 text-destructive"
                    >
                      {resendLoading ? 'Envoi...' : "Renvoyer l'email d'activation"}
                    </Button>
                  )}
                </div>
              )}

              {resendFeedback && (
                <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  <span>{resendFeedback}</span>
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

              <div className="p-2 rounded bg-muted/40 text-[11px] text-muted-foreground flex items-center gap-2">
                <MailCheck className="size-3.5 text-primary shrink-0" />
                <span>Un e-mail de confirmation avec lien d'activation vous sera envoyé.</span>
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
