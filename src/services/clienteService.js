import api from './api';

export const clienteService = {
  // Obtener todos los clientes
  getAll: async () => {
    const response = await api.get('/clientes');
    return response.data.data || response.data;
  },

  // Obtener cliente por ID
  getById: async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data.data || response.data;
  },

  // Obtener historial de servicios de un cliente
  getHistorial: async (id) => {
    const response = await api.get(`/clientes/${id}/historial`);
    return response.data.data || response.data;
  },

  // Crear cliente
  create: async (clienteData) => {
    const response = await api.post('/clientes', clienteData);
    return response.data.data || response.data;
  },

  // Actualizar cliente
  update: async (id, clienteData) => {
    const response = await api.put(`/clientes/${id}`, clienteData);
    return response.data.data || response.data;
  },

  // Eliminar cliente
  delete: async (id) => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data.data || response.data;
  },
};
