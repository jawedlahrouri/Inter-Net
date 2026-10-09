import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export interface WidgetErrorBoundaryProps {
  children: ReactNode
  widgetTitle?: string
  widgetId?: string
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[WidgetErrorBoundary] Erreur d'affichage sur le widget "${this.props.widgetTitle || this.props.widgetId}":`,
      error,
      errorInfo
    )
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <Card className="min-h-[280px] h-full bg-card/60 border-destructive/40 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <CardTitle className="text-sm font-semibold truncate">
                {this.props.widgetTitle || 'Erreur du widget'}
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Ce widget n'a pas pu être affiché correctement.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
            <p className="text-xs text-muted-foreground/80 font-mono bg-muted/40 p-2 rounded max-w-full overflow-hidden text-ellipsis line-clamp-3">
              {this.state.error?.message || 'Erreur inattendue'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-1.5 text-xs h-7 border-border hover:border-primary/50 cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>Réessayer</span>
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

export default WidgetErrorBoundary
