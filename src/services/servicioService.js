import api from './api';

export const servicioService = {
  // Obtener todos los servicios
  getAll: async () => {
    const response = await api.get('/servicios');
    return response.data.data || response.data;
  },

  // Obtener servicio por ID
  getById: async (id) => {
    const response = await api.get(`/servicios/${id}`);
    return response.data.data || response.data;
  },

  // Obtener servicios de un cliente específico
  getByCliente: async (clienteId) => {
    const response = await api.get(`/servicios/cliente/${clienteId}`);
    return response.data.data || response.data;
  },

  // Obtener historial de cambios de estado de un servicio
  getHistorial: async (id) => {
    const response = await api.get(`/servicios/${id}/historial`);
    return response.data.data || response.data;
  },

  // Calcular cotización estimada
  calcularCotizacion: async (datos) => {
    const response = await api.get('/servicios/cotizar', { params: datos });
    return response.data.data || response.data;
  },

  // Crear nuevo servicio
  create: async (servicioData) => {
    const response = await api.post('/servicios', servicioData);
    return response.data.data || response.data;
  },

  // Actualizar servicio
  update: async (id, servicioData) => {
    const response = await api.put(`/servicios/${id}`, servicioData);
    return response.data.data || response.data;
  },

  // Cambiar estado de un servicio
  cambiarEstado: async (id, nuevoEstado) => {
    console.log('Enviando PATCH a:', `/servicios/${id}/estado`);
    console.log('Con body estado:', nuevoEstado);
    // El backend espera el estado en el body, no como parámetro
    const response = await api.patch(`/servicios/${id}/estado`, {
      estado: nuevoEstado
    });
    return response.data.data || response.data;
  },

  // Eliminar servicio
  delete: async (id) => {
    const response = await api.delete(`/servicios/${id}`);
    return response.data.data || response.data;
  },
};
