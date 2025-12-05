import { api } from './';

export const dashboardService = {
  getStats: async () => {
    try {
      const [accesosRes, turnosRes, usuariosRes] = await Promise.all([
        api.get('/accesos?limit=100'),
        api.get('/turnos/activos'),
        api.get('/usuarios')
      ]);

      const accesosHoy = accesosRes.data.filter((acc: any) => 
        new Date(acc.horaEntrada).toDateString() === new Date().toDateString()
      ).length;

      return {
        totalAccesos: accesosRes.data.length,
        turnosActivos: turnosRes.data.length,
        totalUsuarios: usuariosRes.data.length,
        accesosHoy: accesosHoy
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalAccesos: 0,
        turnosActivos: 0,
        totalUsuarios: 0,
        accesosHoy: 0
      };
    }
  },

  getAccesosRecientes: async () => {
    try {
      const response = await api.get('/accesos?limit=10&orderBy=horaEntrada&order=desc');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent accesses:', error);
      return [];
    }
  },

  getTurnosActivos: async () => {
    try {
      const response = await api.get('/turnos/activos');
      return response.data;
    } catch (error) {
      console.error('Error fetching active shifts:', error);
      return [];
    }
  },

  getUsuariosRecientes: async () => {
    try {
      const response = await api.get('/usuarios?limit=10');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
};