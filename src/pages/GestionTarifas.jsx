import { useState, useEffect } from 'react';
import { tarifaService } from '../services/tarifaService';
import './GestionTarifas.css';

const GestionTarifas = () => {
  const [tarifas, setTarifas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    tarifa_por_km: '',
    tarifa_por_unidad_carga: '',
  });

  useEffect(() => {
    cargarTarifas();
  }, []);

  const cargarTarifas = async () => {
    try {
      setLoading(true);
      const data = await tarifaService.getAll();
      console.log('Tarifas cargadas:', data);
      setTarifas(data);
      setFormData({
        tarifa_por_km: data.tarifa_por_km || '',
        tarifa_por_unidad_carga: data.tarifa_por_unidad_carga || '',
      });
      setError('');
    } catch (err) {
      console.error('Error al cargar tarifas:', err);
      setError('Error al cargar tarifas: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    // Restaurar valores originales
    setFormData({
      tarifa_por_km: tarifas.tarifa_por_km || '',
      tarifa_por_unidad_carga: tarifas.tarifa_por_unidad_carga || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar que todos los campos tengan valores válidos
      const tarifaPorKm = parseFloat(formData.tarifa_por_km);
      const tarifaPorUnidadCarga = parseFloat(formData.tarifa_por_unidad_carga);

      if (isNaN(tarifaPorKm) || isNaN(tarifaPorUnidadCarga)) {
        alert('Todos los campos deben tener valores numéricos válidos');
        return;
      }

      const dataToSend = {
        tarifa_por_km: tarifaPorKm,
        tarifa_por_unidad_carga: tarifaPorUnidadCarga,
      };

      console.log('Datos a enviar:', JSON.stringify(dataToSend, null, 2));
      
      const result = await tarifaService.update(dataToSend);
      console.log('Respuesta del servidor:', result);
      
      alert('Tarifas actualizadas exitosamente');
      setEditing(false);
      cargarTarifas();
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Error response:', err.response);
      
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
      alert('Error al actualizar tarifas: ' + errorMsg);
    }
  };

  if (loading) {
    return <div className="loading">Cargando tarifas...</div>;
  }

  return (
    <div className="gestion-tarifas">
      <div className="header">
        <h2>Gestión de Tarifas</h2>
        {!editing && (
          <button className="btn-primary" onClick={handleEdit}>
            Editar Tarifas
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tarifas-container">
        <form onSubmit={handleSubmit}>
          <div className="tarifas-grid">
            <div className="tarifa-card">
              <div className="tarifa-icon">📏</div>
              <label>Tarifa por Kilómetro</label>
              <div className="tarifa-value">
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="tarifa_por_km"
                    value={formData.tarifa_por_km}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <span>{new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                  }).format(formData.tarifa_por_km)}</span>
                )}
              </div>
              <p className="tarifa-description">Costo por cada kilómetro recorrido</p>
            </div>

            <div className="tarifa-card">
              <div className="tarifa-icon">⚖️</div>
              <label>Tarifa por Unidad de Carga</label>
              <div className="tarifa-value">
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="tarifa_por_unidad_carga"
                    value={formData.tarifa_por_unidad_carga}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <span>{new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                  }).format(formData.tarifa_por_unidad_carga)}</span>
                )}
              </div>
              <p className="tarifa-description">Costo por unidad de carga transportada</p>
            </div>
          </div>

          {editing && (
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit">
                Guardar Cambios
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default GestionTarifas;
