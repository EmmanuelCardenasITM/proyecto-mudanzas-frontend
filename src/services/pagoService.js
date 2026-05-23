import api from './api';

export const pagoService = {
  // Obtener todos los pagos
  getAll: async () => {
    const response = await api.get('/pagos');
    return response.data.data || response.data;
  },

  // Obtener pago por ID
  getById: async (id) => {
    const response = await api.get(`/pagos/${id}`);
    return response.data.data || response.data;
  },

  // Obtener pagos de un servicio
  getByServicio: async (servicioId) => {
    const response = await api.get(`/pagos/servicio/${servicioId}`);
    return response.data.data || response.data;
  },

  // Registrar nuevo pago
  create: async (pagoData) => {
    const response = await api.post('/pagos', pagoData);
    return response.data.data || response.data;
  },

  // Actualizar pago
  update: async (id, pagoData) => {
    const response = await api.put(`/pagos/${id}`, pagoData);
    return response.data.data || response.data;
  },

  // Eliminar pago
  delete: async (id) => {
    const response = await api.delete(`/pagos/${id}`);
    return response.data.data || response.data;
  },
};
