import { Slot } from 'expo-router';

import { AdminShell } from '@/desktop/components/AdminShell';

/** Rutas del panel de administración: comparten el menú lateral fijo y el encabezado. */
export default function AdminLayout() {
  return (
    <AdminShell>
      <Slot />
    </AdminShell>
  );
}
