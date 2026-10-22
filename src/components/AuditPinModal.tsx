import { useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ROLES_AUTORIZADOS, type ReporteFuga, type RolSistema } from '../lib/types';

interface Props {
  reporte: ReporteFuga | null;
  onCerrar: () => void;
  onConfirmar: (datos: {
    usuario: string;
    rol: RolSistema;
    codigo: string;
    estadoNuevo: 'En proceso' | 'Atendido';
  }) => Promise<void>;
}

const siguienteEstado: Record<'Pendiente' | 'En proceso' | 'Atendido', 'En proceso' | 'Atendido'> = {
  Pendiente: 'En proceso',
  'En proceso': 'Atendido',
  Atendido: 'Atendido'
};

/**
 * Modal de auditoría: cambia de estado SOLO con rol autorizado + PIN del
 * sistema. La validación real del PIN ocurre en el servidor (RPC).
 */
export function AuditPinModal({ reporte, onCerrar, onConfirmar }: Props) {
  const [usuario, setUsuario] = useState('');
  const [rol, setRol] = useState<RolSistema>('Gasfitero Comunal');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!reporte) return null;

  const estadoNuevo = siguienteEstado[reporte.estado];
  const yaAtendido = reporte.estado === 'Atendido';

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || codigo.length < 4 || yaAtendido) return;
    setEnviando(true);
    try {
      await onConfirmar({ usuario: usuario.trim(), rol, codigo, estadoNuevo });
      setCodigo('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto={Boolean(reporte)} titulo={`Marcar estado · ${reporte.codigo}`} onCerrar={onCerrar}>
      {yaAtendido ? (
        <p className="text-sm text-gray-600">
          Este reporte ya está <strong>Atendido</strong>. No se permiten más cambios de estado.
        </p>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <div className="rounded-xl bg-primary-50 p-3 text-sm text-primary-700">
            Estado actual: <strong>{reporte.estado}</strong> → próximo:{' '}
            <strong>{estadoNuevo}</strong>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-gray-700">Nombre del responsable</span>
            <input
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej: Carlos Flores"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-gray-700">Rol autorizado</span>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolSistema)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {ROLES_AUTORIZADOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-gray-700">PIN de verificación del sistema</span>
            <input
              required
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              placeholder="4 dígitos"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-center text-lg tracking-[0.5em] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Se valida en el servidor contra el PIN entregado al reportar.
            </span>
          </label>

          <Button
            type="submit"
            disabled={enviando || usuario.trim().length < 3 || codigo.length !== 4}
            className="flex w-full items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            {enviando ? 'Aplicando…' : `Confirmar: ${reporte.estado} → ${estadoNuevo}`}
          </Button>
        </form>
      )}
    </Modal>
  );
}
