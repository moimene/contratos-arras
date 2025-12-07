import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';

export const Step3Partes: React.FC = () => {
    const { compradores, vendedores, addComprador, addVendedor, removeComprador, removeVendedor, setCurrentStep } = useContract();

    const [showCompradorForm, setShowCompradorForm] = useState(false);
    const [showVendedorForm, setShowVendedorForm] = useState(false);

    const [compradorForm, setCompradorForm] = useState({
        nombre: '',
        apellidos: '',
        tipo_documento: 'DNI',
        numero_documento: '',
        estado_civil: '',
        email: '',
        telefono: '',
        domicilio: '',
    });

    const [vendedorForm, setVendedorForm] = useState({
        nombre: '',
        apellidos: '',
        tipo_documento: 'DNI',
        numero_documento: '',
        estado_civil: '',
        email: '',
        telefono: '',
        domicilio: '',
    });

    const handleCompradorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCompradorForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleVendedorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setVendedorForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddComprador = (e: React.FormEvent) => {
        e.preventDefault();
        addComprador(compradorForm);
        setCompradorForm({ nombre: '', apellidos: '', tipo_documento: 'DNI', numero_documento: '', estado_civil: '', email: '', telefono: '', domicilio: '' });
        setShowCompradorForm(false);
    };

    const handleAddVendedor = (e: React.FormEvent) => {
        e.preventDefault();
        addVendedor(vendedorForm);
        setVendedorForm({ nombre: '', apellidos: '', tipo_documento: 'DNI', numero_documento: '', estado_civil: '', email: '', telefono: '', domicilio: '' });
        setShowVendedorForm(false);
    };

    const handleContinue = () => {
        if (compradores.length === 0 || vendedores.length === 0) {
            alert('Debes añadir al menos un comprador y un vendedor');
            return;
        }
        setCurrentStep(4);
    };

    return (
        <div className="step-container">
            <h2 className="step-title">👥 Paso 3: Partes Contratantes</h2>
            <p className="step-description">
                Añade los datos del comprador y vendedor que firmarán el contrato.
            </p>

            {/* Compradores */}
            <div className="partes-section">
                <div className="partes-header">
                    <h3>🏠 Compradores</h3>
                    <button
                        type="button"
                        onClick={() => setShowCompradorForm(!showCompradorForm)}
                        className="btn btn-secondary"
                    >
                        {showCompradorForm ? 'Cancelar' : '+ Añadir Comprador'}
                    </button>
                </div>

                {compradores.map((comprador, index) => (
                    <div key={index} className="parte-card">
                        <div className="parte-info">
                            <h4>{comprador.nombre} {comprador.apellidos}</h4>
                            <p>{comprador.tipo_documento}: {comprador.numero_documento}</p>
                            {comprador.email && <p>✉️ {comprador.email}</p>}
                            {comprador.telefono && <p>📞 {comprador.telefono}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={() => removeComprador(index)}
                            className="btn-remove"
                        >
                            🗑️
                        </button>
                    </div>
                ))}

                {showCompradorForm && (
                    <form onSubmit={handleAddComprador} className="parte-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nombre <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={compradorForm.nombre}
                                    onChange={handleCompradorChange}
                                    required
                                    placeholder="Juan Carlos"
                                />
                            </div>
                            <div className="form-group">
                                <label>Apellidos <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="apellidos"
                                    value={compradorForm.apellidos}
                                    onChange={handleCompradorChange}
                                    required
                                    placeholder="García Fernández"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tipo Documento <span className="required">*</span></label>
                                <select name="tipo_documento" value={compradorForm.tipo_documento} onChange={handleCompradorChange}>
                                    <option value="DNI">DNI</option>
                                    <option value="NIE">NIE</option>
                                    <option value="PASAPORTE">Pasaporte</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Número Documento <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="numero_documento"
                                    value={compradorForm.numero_documento}
                                    onChange={handleCompradorChange}
                                    required
                                    placeholder="12345678A"
                                />
                            </div>
                            <div className="form-group">
                                <label>Estado Civil</label>
                                <input
                                    type="text"
                                    name="estado_civil"
                                    value={compradorForm.estado_civil}
                                    onChange={handleCompradorChange}
                                    placeholder="Soltero/a"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={compradorForm.email}
                                    onChange={handleCompradorChange}
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={compradorForm.telefono}
                                    onChange={handleCompradorChange}
                                    placeholder="+34 600 123 456"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Domicilio</label>
                            <input
                                type="text"
                                name="domicilio"
                                value={compradorForm.domicilio}
                                onChange={handleCompradorChange}
                                placeholder="Calle Ejemplo, 123, Madrid"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary">Guardar Comprador</button>
                    </form>
                )}
            </div>

            {/* Vendedores */}
            <div className="partes-section">
                <div className="partes-header">
                    <h3>🏷️ Vendedores</h3>
                    <button
                        type="button"
                        onClick={() => setShowVendedorForm(!showVendedorForm)}
                        className="btn btn-secondary"
                    >
                        {showVendedorForm ? 'Cancelar' : '+ Añadir Vendedor'}
                    </button>
                </div>

                {vendedores.map((vendedor, index) => (
                    <div key={index} className="parte-card">
                        <div className="parte-info">
                            <h4>{vendedor.nombre} {vendedor.apellidos}</h4>
                            <p>{vendedor.tipo_documento}: {vendedor.numero_documento}</p>
                            {vendedor.email && <p>✉️ {vendedor.email}</p>}
                            {vendedor.telefono && <p>📞 {vendedor.telefono}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={() => removeVendedor(index)}
                            className="btn-remove"
                        >
                            🗑️
                        </button>
                    </div>
                ))}

                {showVendedorForm && (
                    <form onSubmit={handleAddVendedor} className="parte-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nombre <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={vendedorForm.nombre}
                                    onChange={handleVendedorChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Apellidos <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="apellidos"
                                    value={vendedorForm.apellidos}
                                    onChange={handleVendedorChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tipo Documento <span className="required">*</span></label>
                                <select name="tipo_documento" value={vendedorForm.tipo_documento} onChange={handleVendedorChange}>
                                    <option value="DNI">DNI</option>
                                    <option value="NIE">NIE</option>
                                    <option value="PASAPORTE">Pasaporte</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Número Documento <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="numero_documento"
                                    value={vendedorForm.numero_documento}
                                    onChange={handleVendedorChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Estado Civil</label>
                                <input
                                    type="text"
                                    name="estado_civil"
                                    value={vendedorForm.estado_civil}
                                    onChange={handleVendedorChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={vendedorForm.email}
                                    onChange={handleVendedorChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={vendedorForm.telefono}
                                    onChange={handleVendedorChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Domicilio</label>
                            <input
                                type="text"
                                name="domicilio"
                                value={vendedorForm.domicilio}
                                onChange={handleVendedorChange}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary">Guardar Vendedor</button>
                    </form>
                )}
            </div>

            <div className="form-actions">
                <button type="button" onClick={() => setCurrentStep(2)} className="btn btn-secondary">
                    ← Atrás
                </button>
                <button type="button" onClick={handleContinue} className="btn btn-primary">
                    Continuar →
                </button>
            </div>
        </div>
    );
};
