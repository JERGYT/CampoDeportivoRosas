import { useState } from 'react';
import { View, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Brand } from '../components/Brand';
import { Button, T, Divider, Row } from '../components/ui';
import { reservasService } from '../../shared/services/reservas';
import { authService } from '../../shared/services/auth';
import { routes } from '../navigation';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('admin@losrosas.com');
  const [password, setPassword] = useState('admin123');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onIngresar = () => {
    if (cargando) return;
    if (!correo.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu correo institucional y contraseña.');
      return;
    }

    setCargando(true);
    setErrorMsg(null);

    reservasService
      .login({ correo: correo.trim(), password: password.trim() })
      .then((res: any) => {
        if (res?.status === 'success' && res.usuario) {
          authService.setSesion(res.usuario);
          router.replace(routes.reservas as any);
        } else {
          setErrorMsg(res?.mensaje || 'Credenciales inválidas.');
        }
      })
      .catch((err: any) => {
        setErrorMsg(err.message || 'No se pudo conectar con el servidor de autenticación.');
      })
      .finally(() => setCargando(false));
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 32,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        {/* Cabecera institucional */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Brand dark centered />
          <T size={20} weight="bold" style={{ marginTop: 14, color: '#0F172A', textAlign: 'center' }}>
            Acceso al Sistema de Gestión
          </T>
          <T size={13} color="#64748B" style={{ marginTop: 4, textAlign: 'center' }}>
            Ingresa con tu cuenta de Administrador u Operario
          </T>
        </View>

        {errorMsg ? (
          <View
            style={{
              padding: 12,
              backgroundColor: '#FEF2F2',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#EF4444',
              marginBottom: 16,
            }}
          >
            <T size={13} weight="semibold" style={{ color: '#991B1B' }}>
              ✕ {errorMsg}
            </T>
          </View>
        ) : null}

        {/* Campo Correo */}
        <View style={{ marginBottom: 14 }}>
          <T size={13} weight="semibold" style={{ color: '#334155', marginBottom: 6 }}>
            Correo electrónico
          </T>
          <TextInput
            value={correo}
            onChangeText={setCorreo}
            placeholder="usuario@losrosas.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              borderWidth: 1,
              borderColor: '#CBD5E1',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: '#0F172A',
              backgroundColor: '#F8FAFC',
            }}
          />
        </View>

        {/* Campo Contraseña enmascarado */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <T size={13} weight="semibold" style={{ color: '#334155' }}>
              Contraseña
            </T>
            <Pressable onPress={() => setMostrarClave(!mostrarClave)}>
              <T size={12} weight="semibold" style={{ color: '#2563EB' }}>
                {mostrarClave ? 'Ocultar' : 'Mostrar'}
              </T>
            </Pressable>
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!mostrarClave}
            onSubmitEditing={onIngresar}
            style={{
              borderWidth: 1,
              borderColor: '#CBD5E1',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: '#0F172A',
              backgroundColor: '#F8FAFC',
            }}
          />
        </View>

        <Button
          label={cargando ? 'Validando credenciales...' : 'Iniciar sesión'}
          loading={cargando}
          onPress={onIngresar}
          style={{ alignSelf: 'stretch', justifyContent: 'center' }}
        />

        <View style={{ marginVertical: 18 }}>
          <Divider />
        </View>

        {/* Selector rápido de perfil para pruebas */}
        <T size={12} color="#64748B" style={{ textAlign: 'center', marginBottom: 10 }}>
          Perfiles de acceso rápido:
        </T>
        <Row gap={10} wrap={false}>
          <View style={{ flex: 1 }}>
            <Button
              label="Administrador"
              variant={correo === 'admin@losrosas.com' ? 'primary' : 'secondary'}
              style={{ alignSelf: 'stretch', justifyContent: 'center' }}
              onPress={() => {
                setCorreo('admin@losrosas.com');
                setPassword('admin123');
                setErrorMsg(null);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Operario"
              variant={correo === 'operario@losrosas.com' ? 'primary' : 'secondary'}
              style={{ alignSelf: 'stretch', justifyContent: 'center' }}
              onPress={() => {
                setCorreo('operario@losrosas.com');
                setPassword('operario123');
                setErrorMsg(null);
              }}
            />
          </View>
        </Row>
      </View>
    </ScrollView>
  );
}