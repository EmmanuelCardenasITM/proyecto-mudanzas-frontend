import { useState, useEffect } from 'react';
import { servicioService } from '../services/servicioService';
import { clienteService } from '../services/clienteService';
import { tarifaService } from '../services/tarifaService';
import { vehiculoService } from '../services/vehiculoService';
import './GestionServicios.css';

const GestionServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tarifas, setTarifas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingServicio, setEditingServicio] = useState(null);
  const [costoCalculado, setCostoCalculado] = useState(0);
  const [formData, setFormData] = useState({
    cliente_id: '',
    vehiculo_id: '',
    empleado_id: '',
    fecha_servicio: '',
    hora_servicio: '',
    direccion_origen: '',
    ciudad_origen: '',
    direccion_destino: '',
    ciudad_destino: '',
    distancia_km: '',
    peso_carga_kg: '',
    descripcion_carga: '',
    notas: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar clientes primero
      try {
        const clientesData = await clienteService.getAll();
        console.log('Clientes cargados:', clientesData);
        setClientes(Array.isArray(clientesData) ? clientesData : []);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        setClientes([]);
      }
      
      // Cargar tarifas
      try {
        const tarifasData = await tarifaService.getAll();
        console.log('Tarifas cargadas:', tarifasData);
        setTarifas(tarifasData);
      } catch (err) {
        console.error('Error al cargar tarifas:', err);
        setTarifas(null);
      }

      // Cargar vehículos
      try {
        const vehiculosData = await vehiculoService.getAll();
        console.log('Vehículos cargados:', vehiculosData);
        setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
      } catch (err) {
        console.error('Error al cargar vehículos:', err);
        setVehiculos([]);
      }
      
      // Luego cargar servicios
      try {
        const serviciosData = await servicioService.getAll();
        console.log('Servicios cargados:', serviciosData);
        setServicios(Array.isArray(serviciosData) ? serviciosData : []);
      } catch (err) {
        console.error('Error al cargar servicios:', err);
        setServicios([]);
      }
      
      setError('');
    } catch (err) {
      console.error('Error general:', err);
      setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (servicio = null) => {
    if (servicio) {
      setEditingServicio(servicio);
      const newFormData = {
        cliente_id: servicio.cliente_id || servicio.cliente?.id || '',
        vehiculo_id: servicio.vehiculo_id || '',
        empleado_id: servicio.empleado_id || '',
        fecha_servicio: servicio.fecha_servicio || '',
        hora_servicio: servicio.hora_servicio || '',
        direccion_origen: servicio.direccion_origen || '',
        ciudad_origen: servicio.ciudad_origen || '',
        direccion_destino: servicio.direccion_destino || '',
        ciudad_destino: servicio.ciudad_destino || '',
        distancia_km: servicio.distancia_km || '',
        peso_carga_kg: servicio.peso_carga_kg || '',
        descripcion_carga: servicio.descripcion_carga || '',
        notas: servicio.notas || '',
      };
      if (newFormData.vehiculo_id) {
        const vehiculo = vehiculos.find(
          (v) => String(v.id) === String(newFormData.vehiculo_id)
        );
        const peso = parseFloat(newFormData.peso_carga_kg) || 0;
        if (vehiculo && peso > 0 && peso > (parseFloat(vehiculo.capacidad_kg) || 0)) {
          newFormData.vehiculo_id = '';
        }
      }
      setFormData(newFormData);
      calcularCostoDesdeBackend(newFormData);
    } else {
      setEditingServicio(null);
      setFormData({
        cliente_id: '',
        vehiculo_id: '',
        empleado_id: '',
        fecha_servicio: '',
        hora_servicio: '',
        direccion_origen: '',
        ciudad_origen: '',
        direccion_destino: '',
        ciudad_destino: '',
        distancia_km: '',
        peso_carga_kg: '',
        descripcion_carga: '',
        notas: '',
      });
      setCostoCalculado(0);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingServicio(null);
  };

  const handleChange = (e) => {
    let newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };

    if (e.target.name === 'peso_carga_kg' && newFormData.vehiculo_id) {
      const vehiculo = vehiculos.find(
        (v) => String(v.id) === String(newFormData.vehiculo_id)
      );
      const peso = parseFloat(newFormData.peso_carga_kg) || 0;
      if (vehiculo && peso > 0 && !vehiculoSoportaCarga(vehiculo, peso)) {
        newFormData.vehiculo_id = '';
      }
    }

    if (e.target.name === 'vehiculo_id' && newFormData.vehiculo_id) {
      const vehiculo = vehiculos.find(
        (v) => String(v.id) === String(newFormData.vehiculo_id)
      );
      const peso = parseFloat(newFormData.peso_carga_kg) || 0;
      if (vehiculo && peso > 0 && !vehiculoSoportaCarga(vehiculo, peso)) {
        alert(
          `El vehículo ${vehiculo.placa} soporta máximo ${getCapacidadVehiculo(vehiculo).toLocaleString('es-CO')} kg.`
        );
        newFormData.vehiculo_id = '';
      }
    }

    setFormData(newFormData);
    
    // Calcular costo automáticamente cuando cambien distancia o peso
    if ((e.target.name === 'distancia_km' || e.target.name === 'peso_carga_kg')) {
      calcularCostoDesdeBackend(newFormData);
    }
  };

  const calcularCostoDesdeBackend = async (data) => {
    if (!data.distancia_km || !data.peso_carga_kg) {
      setCostoCalculado(0);
      return;
    }

    try {
      const distancia = parseFloat(data.distancia_km);
      const peso = parseFloat(data.peso_carga_kg);

      if (distancia > 0 && peso > 0) {
        const cotizacion = await servicioService.calcularCotizacion({
          distancia_km: distancia,
          peso_carga_kg: peso,
        });
        
        console.log('Cotización del backend:', cotizacion);
        
        // El backend puede devolver costo_base o costo_total
        const costo = cotizacion.costo_total || cotizacion.costo_base || cotizacion.costo || 0;
        setCostoCalculado(costo);
      }
    } catch (err) {
      console.error('Error al calcular cotización:', err);
      // Si falla, usar cálculo local como fallback
      calcularCostoLocal(data);
    }
  };

  const calcularCostoLocal = (data) => {
    if (!tarifas || !data.distancia_km || !data.peso_carga_kg) {
      setCostoCalculado(0);
      return;
    }

    const distancia = parseFloat(data.distancia_km) || 0;
    const peso = parseFloat(data.peso_carga_kg) || 0;
    const tarifaKm = parseFloat(tarifas.tarifa_por_km) || 0;
    const tarifaCarga = parseFloat(tarifas.tarifa_por_unidad_carga) || 0;

    const costo = (distancia * tarifaKm) + (peso * tarifaCarga);
    setCostoCalculado(costo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar campos requeridos
      if (!formData.cliente_id) {
        alert('Debe seleccionar un cliente');
        return;
      }
      if (!formData.direccion_origen || !formData.direccion_destino) {
        alert('Las direcciones de origen y destino son obligatorias');
        return;
      }
      if (!formData.fecha_servicio) {
        alert('La fecha del servicio es obligatoria');
        return;
      }
      
      const distancia = parseFloat(formData.distancia_km);
      if (!formData.distancia_km || distancia <= 0) {
        alert('La distancia debe ser mayor a 0');
        return;
      }
      if (distancia > 10000) {
        alert('La distancia no puede ser mayor a 10,000 km');
        return;
      }
      
      const peso = parseFloat(formData.peso_carga_kg);
      if (!formData.peso_carga_kg || peso <= 0) {
        alert('El peso de la carga debe ser mayor a 0');
        return;
      }
      if (peso > 50000) {
        alert('El peso de la carga no puede ser mayor a 50,000 kg');
        return;
      }

      const errorCapacidad = validarCapacidadVehiculo(formData);
      if (errorCapacidad) {
        alert(errorCapacidad);
        return;
      }

      // Convertir strings a números para los campos numéricos
      const dataToSend = {
        cliente_id: parseInt(formData.cliente_id),
        direccion_origen: formData.direccion_origen.trim(),
        direccion_destino: formData.direccion_destino.trim(),
        fecha_servicio: formData.fecha_servicio,
        distancia_km: parseFloat(formData.distancia_km),
        peso_carga_kg: parseFloat(formData.peso_carga_kg),
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.vehiculo_id) {
        dataToSend.vehiculo_id = parseInt(formData.vehiculo_id);
      }
      if (formData.empleado_id) {
        dataToSend.empleado_id = parseInt(formData.empleado_id);
      }
      if (formData.hora_servicio) {
        // Convertir hora al formato HH:mm:ss
        dataToSend.hora_servicio = formData.hora_servicio.length === 5 
          ? formData.hora_servicio + ':00' 
          : formData.hora_servicio;
      }
      if (formData.ciudad_origen && formData.ciudad_origen.trim()) {
        dataToSend.ciudad_origen = formData.ciudad_origen.trim();
      }
      if (formData.ciudad_destino && formData.ciudad_destino.trim()) {
        dataToSend.ciudad_destino = formData.ciudad_destino.trim();
      }
      if (formData.descripcion_carga && formData.descripcion_carga.trim()) {
        dataToSend.descripcion_carga = formData.descripcion_carga.trim();
      }
      if (formData.notas && formData.notas.trim()) {
        dataToSend.notas = formData.notas.trim();
      }

      console.log('Datos a enviar:', JSON.stringify(dataToSend, null, 2)); // Para debug

      if (editingServicio) {
        const result = await servicioService.update(editingServicio.id, dataToSend);
        console.log('Respuesta del servidor (update):', result);
        alert('Servicio actualizado exitosamente');
      } else {
        const result = await servicioService.create(dataToSend);
        console.log('Respuesta del servidor (create):', result);
        alert('Servicio creado exitosamente');
      }
      handleCloseModal();
      cargarDatos();
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      alert('Error al guardar servicio: ' + errorMsg);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      // Convertir el estado a minúsculas para el backend
      const estadoMinusculas = nuevoEstado.toLowerCase();
      console.log('Cambiando estado del servicio', id, 'a', estadoMinusculas);
      await servicioService.cambiarEstado(id, estadoMinusculas);
      alert('Estado actualizado exitosamente');
      cargarDatos();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      console.error('Error response:', err.response);
      
      let errorMsg = 'Error desconocido';
      
      if (err.message === 'Network Error') {
        errorMsg = 'Error de conexión. Verifica que el backend esté corriendo.';
      } else if (err.response?.data) {
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
      
      alert('Error al cambiar estado: ' + errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este servicio?')) {
      try {
        await servicioService.delete(id);
        alert('Servicio eliminado exitosamente');
        cargarDatos();
      } catch (err) {
        alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const getPesoCarga = (data = formData) => parseFloat(data.peso_carga_kg) || 0;

  const getCapacidadVehiculo = (vehiculo) =>
    parseFloat(vehiculo?.capacidad_kg) || 0;

  const vehiculoSoportaCarga = (vehiculo, peso) => {
    if (!vehiculo || peso <= 0) return true;
    return peso <= getCapacidadVehiculo(vehiculo);
  };

  const getVehiculoSeleccionado = (data = formData) =>
    vehiculos.find((v) => String(v.id) === String(data.vehiculo_id));

  const validarCapacidadVehiculo = (data = formData) => {
    const peso = getPesoCarga(data);
    const vehiculo = getVehiculoSeleccionado(data);
    if (!vehiculo || peso <= 0) return null;

    const capacidad = getCapacidadVehiculo(vehiculo);
    if (peso > capacidad) {
      return `La carga (${peso.toLocaleString('es-CO')} kg) supera la capacidad del vehículo ${vehiculo.placa} (${capacidad.toLocaleString('es-CO')} kg). Elija un vehículo con mayor capacidad o reduzca el peso.`;
    }
    return null;
  };

  const getMaxCapacidadDisponible = () => {
    const disponibles = vehiculos.filter((v) => v.disponible !== false);
    if (disponibles.length === 0) return 0;
    return Math.max(...disponibles.map(getCapacidadVehiculo));
  };

  const formatTipoVehiculo = (tipo) => {
    if (!tipo) return 'Sin tipo';
    return tipo.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getEtiquetaVehiculo = (vehiculo) => {
    if (!vehiculo) return 'N/A';
    const capacidad = vehiculo.capacidad_kg
      ? ` · ${vehiculo.capacidad_kg} kg`
      : '';
    return `${vehiculo.placa} — ${formatTipoVehiculo(vehiculo.tipo)}${capacidad}`;
  };

  const getVehiculosParaSelect = (data = formData) => {
    const peso = getPesoCarga(data);
    let lista = vehiculos.filter((v) => v.disponible !== false);

    if (peso > 0) {
      lista = lista.filter((v) => vehiculoSoportaCarga(v, peso));
    }

    const idAsignado = data.vehiculo_id || editingServicio?.vehiculo_id;
    if (idAsignado) {
      const asignado = vehiculos.find((v) => String(v.id) === String(idAsignado));
      if (asignado && !lista.some((v) => v.id === asignado.id)) {
        const incluirPorEdicion =
          asignado.disponible === false &&
          (peso <= 0 || vehiculoSoportaCarga(asignado, peso));
        if (incluirPorEdicion) {
          lista = [...lista, asignado];
        }
      }
    }

    return lista;
  };

  const getNombreVehiculoServicio = (servicio) => {
    if (servicio.vehiculo_placa) {
      return servicio.vehiculo_tipo
        ? `${servicio.vehiculo_placa} (${formatTipoVehiculo(servicio.vehiculo_tipo)})`
        : servicio.vehiculo_placa;
    }

    const vehiculo = vehiculos.find((v) => v.id === servicio.vehiculo_id);
    return vehiculo ? getEtiquetaVehiculo(vehiculo) : 'Sin asignar';
  };

  const getEstadoBadgeClass = (estado) => {
    const estadoLower = estado?.toLowerCase() || 'pendiente';
    const estados = {
      pendiente: 'badge-pendiente',
      confirmado: 'badge-confirmado',
      en_proceso: 'badge-proceso',
      finalizado: 'badge-completado',
      completado: 'badge-completado',
      cancelado: 'badge-cancelado',
    };
    return estados[estadoLower] || 'badge-default';
  };

  if (loading) {
    return <div className="loading">Cargando servicios...</div>;
  }

  const pesoCarga = getPesoCarga();
  const vehiculoSeleccionado = getVehiculoSeleccionado();
  const capacidadVehiculoSeleccionado = getCapacidadVehiculo(vehiculoSeleccionado);
  const vehiculosCompatibles = getVehiculosParaSelect();
  const errorCapacidad = validarCapacidadVehiculo();
  const maxCapacidadDisponible = getMaxCapacidadDisponible();

  return (
    <div className="gestion-servicios">
      <div className="header">
        <h2>Gestión de Servicios de Mudanza</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Nuevo Servicio
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="servicios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Vehículo</th>
              <th>Costo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center' }}>No hay servicios registrados</td>
              </tr>
            ) : (
              servicios.map((servicio) => {
                // Buscar el cliente en el array de clientes usando cliente_id
                const cliente = clientes.find(c => c.id === servicio.cliente_id);
                const nombreCliente = cliente 
                  ? `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim()
                  : (servicio.cliente 
                      ? `${servicio.cliente.nombre || ''} ${servicio.cliente.apellido || ''}`.trim()
                      : 'N/A');
                
                // Calcular costo del servicio
                const costoServicio = servicio.costo_total || servicio.costo_base || 0;
                
                return (
                  <tr key={servicio.id}>
                    <td>{servicio.id}</td>
                    <td>{nombreCliente}</td>
                    <td>
                      {servicio.direccion_origen || servicio.origen || 'N/A'}
                      {servicio.ciudad_origen && ` - ${servicio.ciudad_origen}`}
                    </td>
                    <td>
                      {servicio.direccion_destino || servicio.destino || 'N/A'}
                      {servicio.ciudad_destino && ` - ${servicio.ciudad_destino}`}
                    </td>
                    <td>{servicio.fecha_servicio || servicio.fechaServicio || 'N/A'}</td>
                    <td>{servicio.hora_servicio || '-'}</td>
                    <td className="vehiculo-cell">{getNombreVehiculoServicio(servicio)}</td>
                    <td className="costo-cell">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                      }).format(costoServicio)}
                    </td>
                    <td>
                      <select
                        className={`badge ${getEstadoBadgeClass(servicio.estado?.toUpperCase() || 'PENDIENTE')}`}
                        value={servicio.estado?.toLowerCase() || 'pendiente'}
                        onChange={(e) => handleCambiarEstado(servicio.id, e.target.value)}
                      >
                        {servicio.estado?.toLowerCase() === 'pendiente' && (
                          <>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="cancelado">Cancelado</option>
                          </>
                        )}
                        {servicio.estado?.toLowerCase() === 'confirmado' && (
                          <>
                            <option value="confirmado">Confirmado</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="cancelado">Cancelado</option>
                          </>
                        )}
                        {servicio.estado?.toLowerCase() === 'en_proceso' && (
                          <>
                            <option value="en_proceso">En Proceso</option>
                            <option value="finalizado">Finalizado</option>
                            <option value="cancelado">Cancelado</option>
                          </>
                        )}
                        {(servicio.estado?.toLowerCase() === 'finalizado' || 
                          servicio.estado?.toLowerCase() === 'completado') && (
                          <>
                            <option value="finalizado">Finalizado</option>
                          </>
                        )}
                        {servicio.estado?.toLowerCase() === 'cancelado' && (
                          <>
                            <option value="cancelado">Cancelado</option>
                          </>
                        )}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleOpenModal(servicio)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(servicio.id)}
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
            <h3>{editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Cliente *</label>
                <select
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dirección Origen *</label>
                  <input
                    type="text"
                    name="direccion_origen"
                    value={formData.direccion_origen}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ciudad Origen</label>
                  <input
                    type="text"
                    name="ciudad_origen"
                    value={formData.ciudad_origen}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dirección Destino *</label>
                  <input
                    type="text"
                    name="direccion_destino"
                    value={formData.direccion_destino}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ciudad Destino</label>
                  <input
                    type="text"
                    name="ciudad_destino"
                    value={formData.ciudad_destino}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha del Servicio *</label>
                  <input
                    type="date"
                    name="fecha_servicio"
                    value={formData.fecha_servicio}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Hora del Servicio</label>
                  <input
                    type="time"
                    name="hora_servicio"
                    value={formData.hora_servicio}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Distancia (km) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10000"
                    name="distancia_km"
                    value={formData.distancia_km}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Peso Carga (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={vehiculoSeleccionado ? capacidadVehiculoSeleccionado : 50000}
                    name="peso_carga_kg"
                    value={formData.peso_carga_kg}
                    onChange={handleChange}
                    required
                    className={errorCapacidad ? 'input-error' : ''}
                  />
                  {vehiculoSeleccionado && (
                    <small className="form-hint">
                      Máximo para {vehiculoSeleccionado.placa}: {capacidadVehiculoSeleccionado.toLocaleString('es-CO')} kg
                    </small>
                  )}
                  {pesoCarga > 0 && !vehiculoSeleccionado && vehiculosCompatibles.length === 0 && maxCapacidadDisponible > 0 && (
                    <small className="capacidad-alerta">
                      Ningún vehículo disponible soporta {pesoCarga.toLocaleString('es-CO')} kg. Capacidad máxima en flota: {maxCapacidadDisponible.toLocaleString('es-CO')} kg.
                    </small>
                  )}
                </div>
              </div>

              <div className="form-group vehiculo-asignacion">
                <label>Vehículo asignado</label>
                <select
                  name="vehiculo_id"
                  value={formData.vehiculo_id}
                  onChange={handleChange}
                  className={errorCapacidad ? 'input-error' : ''}
                  disabled={pesoCarga > 0 && vehiculosCompatibles.length === 0}
                >
                  <option value="">
                    {pesoCarga > 0 && vehiculosCompatibles.length === 0
                      ? 'Sin vehículos compatibles para esta carga'
                      : 'Sin asignar (se puede asignar después)'}
                  </option>
                  {vehiculosCompatibles.map((vehiculo) => (
                    <option key={vehiculo.id} value={vehiculo.id}>
                      {getEtiquetaVehiculo(vehiculo)}
                      {vehiculo.disponible === false ? ' — No disponible' : ''}
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  {pesoCarga > 0
                    ? `Solo se listan vehículos con capacidad ≥ ${pesoCarga.toLocaleString('es-CO')} kg.`
                    : 'Indique el peso de la carga para filtrar vehículos compatibles.'}
                </small>
                {errorCapacidad && (
                  <small className="capacidad-alerta">{errorCapacidad}</small>
                )}
              </div>

              <div className="form-group">
                <label>Descripción de la Carga</label>
                <textarea
                  name="descripcion_carga"
                  value={formData.descripcion_carga}
                  onChange={handleChange}
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Notas Adicionales</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows="2"
                />
              </div>

              {costoCalculado > 0 && (
                <div className="costo-calculado">
                  <div className="costo-label">💰 Costo del Servicio:</div>
                  <div className="costo-valor">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                    }).format(costoCalculado)}
                  </div>
                  <div className="costo-detalle">
                    <small>
                      Calculado por el sistema según distancia ({formData.distancia_km} km) y peso ({formData.peso_carga_kg} kg)
                    </small>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  {editingServicio ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionServicios;
