import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  mensaje?: string;
}

interface Estado {
  fallo: boolean;
}

/** Captura errores de carga del mapa (tiles, Leaflet) sin tumbar la app. */
export class MapErrorBoundary extends Component<Props, Estado> {
  state: Estado = { fallo: false };

  static getDerivedStateFromError(): Estado {
    return { fallo: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Mapa no disponible:', error, info.componentStack);
  }

  render() {
    if (this.state.fallo) {
      return (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-xl bg-primary-50 p-4 text-center ring-1 ring-primary-100">
          <p className="text-sm font-semibold text-primary-700">
            {this.props.mensaje ?? 'No se pudo cargar el mapa'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ fallo: false })}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
