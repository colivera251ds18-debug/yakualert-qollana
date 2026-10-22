import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const ESTILOS: Record<Variante, string> = {
  primario: 'bg-primary text-white hover:bg-primary-600 disabled:bg-primary-100',
  secundario: 'bg-white text-primary ring-1 ring-primary hover:bg-primary-50',
  peligro: 'bg-danger text-white hover:bg-red-700'
};

export function Button({ variante = 'primario', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${ESTILOS[variante]} ${className}`}
    />
  );
}
