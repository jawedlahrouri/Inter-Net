import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createAdminUser,
  updateAdminUser,
  type AdminUserSummary,
  type AdminUserDetail,
} from '@/services/api';
import { User, Mail, Lock, Shield, AlertCircle } from 'lucide-react';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: AdminUserSummary | AdminUserDetail | null;
  onSuccess: () => void;
}

/**
 * @brief Renders the admin dialog for creating a new user or editing an existing one.
 * @param open Whether the dialog is currently visible.
 * @param onOpenChange Callback invoked with the new open state, e.g. false after a successful save.
 * @param userToEdit Existing user to edit; when absent or null the dialog creates a new user.
 * @param onSuccess Callback invoked after the user has been created or updated successfully.
 * @return A Dialog containing a form with username, email, role and password fields plus error display and action buttons.
 */
export function UserDialog({
  open,
  onOpenChange,
  userToEdit,
  onSuccess,
}: UserDialogProps) {
  const isEditing = Boolean(userToEdit);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username || '');
      setEmail(userToEdit.email || '');
      setRole(userToEdit.role || 'user');
      setPassword('');
    } else {
      setUsername('');
      setEmail('');
      setRole('user');
      setPassword('');
    }
    setError(null);
  }, [userToEdit, open]);

  /**
   * @brief Validates the user form, then creates or updates the user through the admin API and closes the dialog on success.
   * @param e Form submit event whose default behavior is prevented.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !email.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!isEditing && !password) {
      setError('Le mot de passe est obligatoire pour la création.');
      return;
    }

    try {
      setLoading(true);
      if (isEditing && userToEdit) {
        await updateAdminUser(userToEdit.id, {
          username: username.trim(),
          email: email.trim(),
          role,
          ...(password ? { password } : {}),
        });
      } else {
        await createAdminUser({
          username: username.trim(),
          email: email.trim(),
          role,
          password,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-background shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <Shield className="size-4 text-primary" />
            {isEditing ? `Modifier l'utilisateur #${userToEdit?.id}` : 'Créer un nouvel utilisateur'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? 'Mettez à jour les informations du compte ou modifiez son rôle administratif.'
              : 'Remplissez les informations pour provisionner un nouveau compte utilisateur.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-muted-foreground" />
              Nom d'utilisateur
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex. alexandre"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" />
              Adresse Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex. alex@epitech.eu"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Shield className="size-3.5 text-muted-foreground" />
              Rôle du compte
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  role === 'user'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <span>Utilisateur Standard</span>
                <span className="text-[10px] opacity-70">Accès normal</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  role === 'admin'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-400 font-medium'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <span>Administrateur</span>
                <span className="text-[10px] opacity-70">Accès complet</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" />
              {isEditing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? 'Laisser vide pour ne pas modifier' : 'Mot de passe sécurisé'}
              className="h-9 text-xs"
              minLength={isEditing && !password ? undefined : 6}
              required={!isEditing}
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs"
            >
              {loading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le compte'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
