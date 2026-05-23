import { useState, useEffect } from 'react';
import { vehiculoService } from '../services/vehiculoService';
import './GestionVehiculos.css';

const GestionVehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [formData, setFormData] = useState({
    placa: '',
    tipo: '',
    capacidad_kg: '',
    capacidad_m3: '',
    disponible: true,
  });

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const cargarVehiculos = async () => {
    try {
      setLoading(true);
      const data = await vehiculoService.getAll();
      console.log('Vehículos cargados:', data);
      setVehiculos(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
      setError('Error al cargar vehículos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vehiculo = null) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo);
      setFormData({
        placa: vehiculo.placa || '',
        tipo: vehiculo.tipo || '',
        capacidad_kg: vehiculo.capacidad_kg || '',
        capacidad_m3: vehiculo.capacidad_m3 || '',
        disponible: vehiculo.disponible !== undefined ? vehiculo.disponible : true,
      });
    } else {
      setEditingVehiculo(null);
      setFormData({
        placa: '',
        tipo: '',
        capacidad_kg: '',
        capacidad_m3: '',
        disponible: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehiculo(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        placa: formData.placa.trim(),
        tipo: formData.tipo,
        capacidad_kg: parseFloat(formData.capacidad_kg),
        disponible: formData.disponible,
      };

      if (editingVehiculo) {
        await vehiculoService.update(editingVehiculo.id, dataToSend);
        alert('Vehículo actualizado exitosamente');
      } else {
        await vehiculoService.create(dataToSend);
        alert('Vehículo creado exitosamente');
      }
      handleCloseModal();
      cargarVehiculos();
    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      try {
        await vehiculoService.delete(id);
        alert('Vehículo eliminado exitosamente');
        cargarVehiculos();
      } catch (err) {
        alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const getEstadoBadgeClass = (estado) => {
    const estados = {
      DISPONIBLE: 'badge-disponible',
      EN_USO: 'badge-en-uso',
      MANTENIMIENTO: 'badge-mantenimiento',
    };
    return estados[estado] || 'badge-default';
  };

  if (loading) {
    return <div className="loading">Cargando vehículos...</div>;
  }

  return (
    <div className="gestion-vehiculos">
      <div className="header">
        <h2>Gestión de Vehículos</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Nuevo Vehículo
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="vehiculos-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Placa</th>
              <th>Tipo</th>
              <th>Capacidad (kg)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map((vehiculo) => (
              <tr key={vehiculo.id}>
                <td>{vehiculo.id}</td>
                <td>{vehiculo.placa}</td>
                <td>{vehiculo.tipo?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</td>
                <td>{vehiculo.capacidad_kg || '-'}</td>
                <td>
                  <span className={`badge ${vehiculo.disponible ? 'badge-disponible' : 'badge-en-uso'}`}>
                    {vehiculo.disponible ? 'Disponible' : 'No Disponible'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => handleOpenModal(vehiculo)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(vehiculo.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Placa *</label>
                <input
                  type="text"
                  name="placa"
                  value={formData.placa}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo de Vehículo *</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un tipo</option>
                  <option value="camioneta">Camioneta</option>
                  <option value="camion_pequeno">Camión Pequeño</option>
                  <option value="camion_mediano">Camión Mediano</option>
                  <option value="camion_grande">Camión Grande</option>
                </select>
              </div>

              <div className="form-group">
                <label>Capacidad (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="capacidad_kg"
                  value={formData.capacidad_kg}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  name="disponible"
                  value={formData.disponible}
                  onChange={(e) => setFormData({...formData, disponible: e.target.value === 'true'})}
                >
                  <option value="true">Disponible</option>
                  <option value="false">No Disponible</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {editingVehiculo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionVehiculos;
