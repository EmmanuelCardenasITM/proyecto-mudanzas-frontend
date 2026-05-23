import api from './api';

export const vehiculoService = {
  // Obtener todos los vehículos
  getAll: async () => {
    const response = await api.get('/vehiculos');
    return response.data.data || response.data;
  },

  // Obtener vehículos disponibles
  getDisponibles: async () => {
    const response = await api.get('/vehiculos/disponibles');
    return response.data.data || response.data;
  },

  // Obtener vehículo por ID
  getById: async (id) => {
    const response = await api.get(`/vehiculos/${id}`);
    return response.data.data || response.data;
  },

  // Crear vehículo
  create: async (vehiculoData) => {
    const response = await api.post('/vehiculos', vehiculoData);
    return response.data.data || response.data;
  },

  // Actualizar vehículo
  update: async (id, vehiculoData) => {
    const response = await api.put(`/vehiculos/${id}`, vehiculoData);
    return response.data.data || response.data;
  },

  // Eliminar vehículo
  delete: async (id) => {
    const response = await api.delete(`/vehiculos/${id}`);
    return response.data.data || response.data;
  },
};
