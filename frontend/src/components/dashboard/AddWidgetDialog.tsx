import * as React from 'react'
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/input-field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export interface AddWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWidget: (title: string, url?: string) => void
}

export function AddWidgetDialog({
  open,
  onOpenChange,
  onAddWidget,
}: AddWidgetDialogProps) {
  const [title, setTitle] = React.useState('')
  const [url, setUrl] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!url.trim()) return

    onAddWidget(title.trim(), url.trim())
    setTitle('')
    setUrl('')
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTitle('')
    setUrl('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un widget</DialogTitle>
          <DialogDescription>
            Renseignez les détails de votre nouveau widget.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <InputField
            label="Nom du widget"
            placeholder="Entrez le nom du widget"
            type="text"
            value={title}
            required
            onChange={(e) => setTitle(e.target.value)}
          />
          <InputField
            label= "Lien du widget"
            placeholder= "Entrez le lien du widget"
            type= "text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
            required
          />
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!title.trim() || !url.trim()}>
              Créer le widget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddWidgetDialog

