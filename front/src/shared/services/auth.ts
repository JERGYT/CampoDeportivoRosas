export interface UsuarioSesion {
  id: number;
  nombre: string;
  correo: string;
  rol: 'ADMINISTRADOR' | 'OPERARIO';
}

const STORAGE_KEY = 'los_rosas_sesion';

let sesionActual: UsuarioSesion = {
  id: 1,
  nombre: 'Ana Martínez',
  correo: 'admin@losrosas.com',
  rol: 'ADMINISTRADOR',
};

export const authService = {
  getSesion(): UsuarioSesion {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          sesionActual = JSON.parse(raw);
        } catch {}
      }
    }
    return sesionActual;
  },

  setSesion(usuario: UsuarioSesion) {
    sesionActual = usuario;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    }
  },

  cerrarSesion() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },

  esAdministrador(): boolean {
    return this.getSesion().rol === 'ADMINISTRADOR';
  },
};