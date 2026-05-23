import { useState, useEffect } from 'react';
import { pagoService } from '../services/pagoService';
import { servicioService } from '../services/servicioService';
import './GestionPagos.css';

const GestionPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [diferenciaPago, setDiferenciaPago] = useState(0);
  const [formData, setFormData] = useState({
    servicio_id: '',
    monto: '',
    metodo_pago: '',
    fecha_pago: '',
    referencia: '',
    notas: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar servicios primero
      try {
        const serviciosData = await servicioService.getAll();
        console.log('Servicios cargados:', serviciosData);
        setServicios(Array.isArray(serviciosData) ? serviciosData : []);
      } catch (err) {
        console.error('Error al cargar servicios:', err);
        setServicios([]);
      }
      
      // Luego cargar pagos
      try {
        const pagosData = await pagoService.getAll();
        console.log('Pagos cargados:', pagosData);
        setPagos(Array.isArray(pagosData) ? pagosData : []);
      } catch (err) {
        console.error('Error al cargar pagos:', err);
        setPagos([]);
      }
      
      setError('');
    } catch (err) {
      console.error('Error general:', err);
      setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pago = null) => {
    if (pago) {
      setEditingPago(pago);
      const servicio = servicios.find(s => s.id === (pago.servicio_id || pago.servicio?.id));
      setServicioSeleccionado(servicio);
      
      const newFormData = {
        servicio_id: pago.servicio_id || pago.servicio?.id || '',
        monto: pago.monto || '',
        metodo_pago: pago.metodo_pago || '',
        fecha_pago: pago.fecha_pago || '',
        referencia: pago.referencia || '',
        notas: pago.notas || '',
      };
      setFormData(newFormData);
      calcularDiferencia(newFormData.monto, servicio);
    } else {
      setEditingPago(null);
      setServicioSeleccionado(null);
      setDiferenciaPago(0);
      setFormData({
        servicio_id: '',
        monto: '',
        metodo_pago: '',
        fecha_pago: '',
        referencia: '',
        notas: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPago(null);
    setServicioSeleccionado(null);
    setDiferenciaPago(0);
  };

  const handleChange = (e) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };
    setFormData(newFormData);
    
    // Si cambia el servicio, actualizar el servicio seleccionado
    if (e.target.name === 'servicio_id') {
      const servicio = servicios.find(s => s.id === parseInt(e.target.value));
      setServicioSeleccionado(servicio);
      calcularDiferencia(newFormData.monto, servicio);
    }
    
    // Si cambia el monto, calcular diferencia
    if (e.target.name === 'monto') {
      calcularDiferencia(e.target.value, servicioSeleccionado);
    }
  };

  const calcularDiferencia = (monto, servicio) => {
    if (!monto || !servicio) {
      setDiferenciaPago(0);
      return;
    }

    const montoPago = parseFloat(monto) || 0;
    const costoServicio = servicio.costo_total || servicio.costo_base || 0;
    const diferencia = montoPago - costoServicio;
    
    setDiferenciaPago(diferencia);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        servicio_id: parseInt(formData.servicio_id),
        monto: parseFloat(formData.monto),
        metodo_pago: formData.metodo_pago,
      };

      // Convertir fecha a formato ISO 8601 con hora
      if (formData.fecha_pago) {
        // Crear fecha en formato ISO sin zona horaria
        const fecha = formData.fecha_pago + 'T12:00:00';
        dataToSend.fecha_pago = fecha;
      }

      // Agregar campos opcionales
      if (formData.referencia && formData.referencia.trim()) {
        dataToSend.referencia = formData.referencia.trim();
      }
      if (formData.notas && formData.notas.trim()) {
        dataToSend.notas = formData.notas.trim();
      }

      console.log('Datos a enviar:', JSON.stringify(dataToSend, null, 2));

      if (editingPago) {
        const result = await pagoService.update(editingPago.id, dataToSend);
        console.log('Respuesta del servidor (update):', result);
        alert('Pago actualizado exitosamente');
      } else {
        const result = await pagoService.create(dataToSend);
        console.log('Respuesta del servidor (create):', result);
        alert('Pago registrado exitosamente');
      }
      handleCloseModal();
      cargarDatos();
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      let errorMsg = 'Error desconocido';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        } else {
          errorMsg = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      console.error('Mensaje de error:', errorMsg);
      alert('Error: ' + errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este pago?')) {
      try {
        await pagoService.delete(id);
        alert('Pago eliminado exitosamente');
        cargarDatos();
      } catch (err) {
        alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const getMetodoPagoBadgeClass = (metodo) => {
    const metodos = {
      EFECTIVO: 'badge-efectivo',
      TARJETA: 'badge-tarjeta',
      TRANSFERENCIA: 'badge-transferencia',
      CHEQUE: 'badge-cheque',
    };
    return metodos[metodo?.toUpperCase()] || 'badge-default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Cargando pagos...</div>;
  }

  return (
    <div className="gestion-pagos">
      <div className="header">
        <h2>Gestión de Pagos</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Registrar Pago
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="pagos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Servicio</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Fecha</th>
              <th>Referencia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No hay pagos registrados</td>
              </tr>
            ) : (
              pagos.map((pago) => {
                const servicio = servicios.find(s => s.id === pago.servicio_id);
                return (
                  <tr key={pago.id}>
                    <td>{pago.id}</td>
                    <td>
                      {servicio 
                        ? `Servicio #${servicio.id}` 
                        : `Servicio #${pago.servicio_id || 'N/A'}`}
                    </td>
                    <td className="monto">{formatCurrency(pago.monto)}</td>
                    <td>
                      <span className={`badge ${getMetodoPagoBadgeClass(pago.metodo_pago)}`}>
                        {pago.metodo_pago}
                      </span>
                    </td>
                    <td>{pago.fecha_pago}</td>
                    <td>{pago.referencia || '-'}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleOpenModal(pago)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(pago.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPago ? 'Editar Pago' : 'Registrar Pago'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Servicio *</label>
                <select
                  name="servicio_id"
                  value={formData.servicio_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un servicio</option>
                  {servicios.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      Servicio #{servicio.id} - {servicio.direccion_origen || 'N/A'} → {servicio.direccion_destino || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              {servicioSeleccionado && (
                <div className="info-servicio">
                  <div className="info-label">Costo del Servicio:</div>
                  <div className="info-valor">
                    {formatCurrency(servicioSeleccionado.costo_total || servicioSeleccionado.costo_base || 0)}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Monto *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Método de Pago *</label>
                  <select
                    name="metodo_pago"
                    value={formData.metodo_pago}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione método</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Fecha de Pago *</label>
                <input
                  type="date"
                  name="fecha_pago"
                  value={formData.fecha_pago}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Referencia</label>
                <input
                  type="text"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  placeholder="Número de transacción, cheque, etc."
                />
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Observaciones adicionales"
                />
              </div>

              {servicioSeleccionado && formData.monto && (
                <div className={`diferencia-pago ${diferenciaPago >= 0 ? 'cambio' : 'pendiente'}`}>
                  {diferenciaPago > 0 ? (
                    <>
                      <div className="diferencia-label">💵 Cambio a Devolver:</div>
                      <div className="diferencia-valor">
                        {formatCurrency(diferenciaPago)}
                      </div>
                    </>
                  ) : diferenciaPago < 0 ? (
                    <>
                      <div className="diferencia-label">⚠️ Saldo Pendiente:</div>
                      <div className="diferencia-valor">
                        {formatCurrency(Math.abs(diferenciaPago))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="diferencia-label">✅ Pago Exacto</div>
                      <div className="diferencia-valor">
                        Monto correcto
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {editingPago ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPagos;
