import { useState, type FormEvent } from 'react';
import { MapPicker, POSICION_INICIAL } from '../components/MapPicker';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { crearReporte } from '../lib/reportes';
import { SECTORES, type SectorQollana } from '../lib/types';

interface Props {
  onEnviado: () => void;
}

const inputCls =
  'w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100';

export function ReportarFuga({ onEnviado }: Props) {
  const { mostrar } = useToast();
  const [nombre, setNombre] = useState('');
  const [sector, setSector] = useState<SectorQollana>('Centro');
  const [descripcion, setDescripcion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [pos, setPos] = useState(POSICION_INICIAL);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const resultado = await crearReporte({
        nombre_vecino: nombre.trim(),
        sector,
        lat: pos.lat,
        lng: pos.lng,
        descripcion: descripcion.trim(),
        referencia: referencia.trim()
      });
      if (resultado.offline) {
        mostrar(
          'Sin conexión: tu reporte quedó guardado y se enviará automáticamente.',
          'offline'
        );
      } else {
        mostrar(`Reporte registrado con el código ${resultado.codigo}.`, 'exito');
      }
      setNombre('');
      setDescripcion('');
      setReferencia('');
      onEnviado();
    } catch {
      mostrar('No se pudo registrar el reporte. Intenta de nuevo.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">Reportar fuga</h1>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-gray-700">Tu nombre (vecino/a)</span>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Rosa Mamani"
          className={inputCls}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-gray-700">Sector</span>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value as SectorQollana)}
          className={inputCls}
        >
          {SECTORES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="mb-1 block text-sm font-semibold text-gray-700">
          Ubicación en el mapa
        </span>
        <p className="mb-2 text-xs text-gray-500">
          Toca el mapa o arrastra el pin para señalar exactamente dónde está la fuga.
        </p>
        <MapPicker
          lat={pos.lat}
          lng={pos.lng}
          onUbicacion={(lat, lng) => setPos({ lat, lng })}
        />
        <p className="mt-1 text-xs text-gray-500">
          Coordenadas: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-gray-700">Descripción de la fuga</span>
        <textarea
          required
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe qué está pasando…"
          className={inputCls}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-gray-700">Punto de referencia</span>
        <input
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          placeholder="Ej: frente a la capilla, poste 5"
          className={inputCls}
        />
      </label>

      <Button type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Enviando…' : 'Enviar reporte'}
      </Button>

      <p className="text-center text-xs text-gray-500">
        Al enviar recibirás un código de seguimiento (YAK-###) y un PIN de verificación.
      </p>
    </form>
  );
}
