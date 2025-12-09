import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpedientesList.css';

interface Expediente {
    id: string;
    numero_expediente: string;
    estado: string;
    tipo_arras: string;
    precio_total: number;
    importe_arras: number;
    created_at: string;
    num_firmas: number;
    inmueble: {
        direccion_completa: string;
        ciudad: string;
    };
}

export default function ExpedientesList() {
    const navigate = useNavigate();
    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('');

    useEffect(() => {
        cargarExpedientes();
    }, [filtroEstado]);

    const cargarExpedientes = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            let url = `${apiUrl}/api/contracts`;

            if (filtroEstado) {
                url += `?estado=${filtroEstado}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setExpedientes(data.data);
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            console.error('Error cargando expedientes:', err);
            setError(err.message || 'Error al cargar expedientes');
        } finally {
            setLoading(false);
        }
    };

    const getEstadoBadgeClass = (estado: string) => {
        const clases: Record<string, string> = {
            'INICIADO': 'badge-draft',
            'BORRADOR': 'badge-generated',
            'FIRMADO': 'badge-signed',
            'NOTARIA': 'badge-notary',
            'TERMINADO': 'badge-complete',
            'LITIGIO': 'badge-resolved'
        };
        return clases[estado] || 'badge-default';
    };

    const getEstadoTexto = (estado: string) => {
        const textos: Record<string, string> = {
            'INICIADO': 'Iniciado',
            'BORRADOR': 'Borrador',
            'FIRMADO': 'Firmado',
            'NOTARIA': 'Notaría',
            'TERMINADO': 'Terminado',
            'LITIGIO': 'Litigio'
        };
        return textos[estado] || estado;
    };

    if (loading) {
        return (
            <div className="expedientes-loading">
                <div className="loading-spinner-large"></div>
                <p>Cargando expedientes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="expedientes-error">
                <div className="error-icon">⚠️</div>
                <h2>Error al cargar expedientes</h2>
                <p>{error}</p>
                <button onClick={cargarExpedientes} className="btn-primary">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="expedientes-container">
            {/* Header */}
            <header className="expedientes-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>📋 Mis Expedientes de Arras</h1>
                        <p className="subtitle">{expedientes.length} expediente{expedientes.length !== 1 ? 's' : ''} en total</p>
                    </div>
                    <div className="header-right">
                        <button
                            onClick={() => navigate('/wizard/nuevo')}
                            className="btn-primary btn-new-expediente"
                        >
                            <span className="btn-icon">➕</span>
                            Nuevo Expediente
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="expedientes-filtros">
                    <button
                        className={`filtro-btn ${!filtroEstado ? 'active' : ''}`}
                        onClick={() => setFiltroEstado('')}
                    >
                        Todos
                    </button>
                    <button
                        className={`filtro-btn ${filtroEstado === 'BORRADOR' ? 'active' : ''}`}
                        onClick={() => setFiltroEstado('BORRADOR')}
                    >
                        Pendientes Firma
                    </button>
                    <button
                        className={`filtro-btn ${filtroEstado === 'FIRMADO' ? 'active' : ''}`}
                        onClick={() => setFiltroEstado('FIRMADO')}
                    >
                        Firmados
                    </button>
                    <button
                        className={`filtro-btn ${filtroEstado === 'NOTARIA' ? 'active' : ''}`}
                        onClick={() => setFiltroEstado('NOTARIA')}
                    >
                        En Notaría
                    </button>
                    <button
                        className={`filtro-btn ${filtroEstado === 'LITIGIO' ? 'active' : ''}`}
                        onClick={() => setFiltroEstado('LITIGIO')}
                    >
                        En Litigio
                    </button>
                </div>
            </header>

            {/* Lista de expedientes */}
            {expedientes.length === 0 ? (
                <div className="expedientes-empty">
                    <div className="empty-icon">📁</div>
                    <h3>No hay expedientes</h3>
                    <p>Crea tu primer expediente de arras haciendo clic en "Nuevo Expediente"</p>
                    <button
                        onClick={() => navigate('/wizard/nuevo')}
                        className="btn-primary"
                    >
                        Crear Primer Expediente
                    </button>
                </div>
            ) : (
                <div className="expedientes-table-wrapper">
                    <table className="expedientes-table">
                        <thead>
                            <tr>
                                <th>Expediente</th>
                                <th>Inmueble</th>
                                <th>Estado</th>
                                <th>Tipo Arras</th>
                                <th>Precio</th>
                                <th>Arras</th>
                                <th>Firmas</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expedientes.map((exp) => (
                                <tr key={exp.id} className="expediente-row">
                                    <td className="col-expediente">
                                        <strong>{exp.numero_expediente}</strong>
                                    </td>
                                    <td className="col-inmueble">
                                        <div className="inmueble-info">
                                            <div className="inmueble-direccion">{exp.inmueble?.direccion_completa || 'N/A'}</div>
                                            <div className="inmueble-ciudad">{exp.inmueble?.ciudad || ''}</div>
                                        </div>
                                    </td>
                                    <td className="col-estado">
                                        <span className={`estado-badge ${getEstadoBadgeClass(exp.estado)}`}>
                                            {getEstadoTexto(exp.estado)}
                                        </span>
                                    </td>
                                    <td className="col-tipo">{exp.tipo_arras}</td>
                                    <td className="col-precio">{exp.precio_total.toLocaleString('es-ES')} €</td>
                                    <td className="col-arras">{exp.importe_arras.toLocaleString('es-ES')} €</td>
                                    <td className="col-firmas">
                                        <span className="firmas-badge">{exp.num_firmas} ✍️</span>
                                    </td>
                                    <td className="col-fecha">
                                        {new Date(exp.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="col-acciones">
                                        <button
                                            onClick={() => navigate(`/dashboard/contrato/${exp.id}`)}
                                            className="btn-action btn-view"
                                            title="Ver Dashboard"
                                        >
                                            👁️ Ver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
