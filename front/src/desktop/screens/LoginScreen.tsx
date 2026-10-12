import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ClipboardCheck, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, radius } from '@/shared/theme/tokens';

import { Brand } from '../components/Brand';
import { Button, Card, Field, Notice, Row, Small, T } from '../components/ui';
import { routes } from '../navigation';

/** Acceso · Autenticación y roles. El back aún no tiene endpoint de login: ingresa al panel directamente. */
export default function LoginScreen() {
  const [correo, setCorreo] = useState('ana@losrosas.example');
  const [clave, setClave] = useState('••••••••••••');

  return (
    <View style={styles.root}>
      <ScrollView style={styles.welcome} contentContainerStyle={{ padding: 64, gap: 32 }}>
        <Brand />
        <View style={{ paddingTop: 32, gap: 18 }}>
          <T size={48} weight="bold" color={colors.white} lh={1.12}>
            Cada encuentro, bien organizado.
          </T>
          <T size={18} color={colors.navMuted} lh={1.5}>
            Un lugar para cuidar las reservas, los espacios y las personas que hacen parte de los Rosas.
          </T>
        </View>
        <Image
          source={require('@/assets/figma/campo-deportivo.png')}
          contentFit="cover"
          style={{ height: 340, borderRadius: 24 }}
        />
        <T color={colors.navMuted} lh={1.8}>
          {'Fútbol  ·  Tejo  ·  Salón de Eventos  ·  Zona BBQ'}
        </T>
        <T size={12} color={colors.navMuted} lh={1.5}>
          Acceso exclusivo del equipo de administración y operación.
        </T>
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 96, paddingVertical: 80, gap: 30 }}>
        <View style={{ paddingTop: 56, gap: 10 }}>
          <T size={32} weight="semibold" lh={1.45}>
            Bienvenido de nuevo
          </T>
          <T color={colors.textMuted} lh={1.45}>
            Ingresa con la cuenta asignada por la administración.
          </T>
        </View>

        <Card title="Iniciar sesión">
          <Field label="Correo de trabajo" value={correo} onChangeText={setCorreo} keyboardType="email-address" />
          <Field label="Contraseña" value={clave} onChangeText={setClave} />
          <Row gap={16}>
            <T size={13} color={colors.textMuted} lh={1.45} style={{ flex: 1 }}>
              Usa tus credenciales personales.
            </T>
            <T size={13} weight="semibold" color={colors.primary}>
              ¿Olvidaste tu contraseña?
            </T>
          </Row>
          <Button label="Ingresar al panel" onPress={() => router.replace(routes.reservas)} />
          <Notice title="Tu rol ya está asignado">
            El acceso muestra las funciones de tu cuenta. No puedes elegir ni cambiar tus privilegios al iniciar sesión.
          </Notice>
        </Card>

        <T weight="semibold" lh={1.45}>
          Un mismo equipo, responsabilidades distintas
        </T>
        <Row gap={16}>
          <View style={styles.roleCard}>
            <ShieldCheck size={18} color={colors.primary} strokeWidth={1.6} />
            <T weight="semibold" lh={1.45}>
              Administrador
            </T>
            <T size={13} color={colors.textMuted} lh={1.45}>
              Entrega y recepción; además, daños, liquidación y cancelaciones.
            </T>
          </View>
          <View style={styles.roleCard}>
            <ClipboardCheck size={18} color={colors.primary} strokeWidth={1.6} />
            <T weight="semibold" lh={1.45}>
              Operario
            </T>
            <T size={13} color={colors.textMuted} lh={1.45}>
              Valida la reserva, entrega el espacio y verifica la recepción.
            </T>
          </View>
        </Row>
        <Small>Estos bloques son informativos, no un selector de rol. Si necesitas acceso, contacta a la administración.</Small>
        <Small>Mockup estático · Datos de ejemplo · Sin autenticación real</Small>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  welcome: { width: 720, flexGrow: 0, backgroundColor: colors.navy },
  roleCard: { flex: 1, gap: 10, padding: 18, borderRadius: radius.card, backgroundColor: colors.surface },
});
