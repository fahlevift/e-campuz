import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  GraduationCap,
  IdCard,
  Lock,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  ArrowRight,
  AlertCircle,
} from 'lucide-react-native';
import { colors, typography, radius, space, elevation } from '@/theme';
import { Button } from '@/components/ui';
import { useAuthActions } from '@/features/useCampusData';
import { Role } from '@/types';

const loginSchema = z.object({
  nimNip: z.string().min(4, 'Masukkan NIM atau NIP yang valid'),
  password: z.string().min(4, 'Masukkan kata sandi akun Anda'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Login
export default function LoginScreen() {
  const router = useRouter();
  const { loginMutation } = useAuthActions();

  const [selectedRole, setSelectedRole] = useState<Role>('mahasiswa');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nimNip: '22053181',
      password: 'ecampuz123',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      const result = await loginMutation.mutateAsync({
        nimNip: values.nimNip,
        password: values.password,
        role: selectedRole,
      });
      if (!result.seenPerm) {
        router.replace('/(auth)/notification-permission' as never);
      } else {
        router.replace('/(tabs)/home' as never);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'NIM atau password salah';
      setAuthError(message);
    }
  };

  const fillDemoAccount = (role: Role, nimNip: string) => {
    setSelectedRole(role);
    setValue('nimNip', nimNip);
    setValue('password', 'ecampuz123');
    setAuthError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandSection}>
            <View style={styles.logoBox}>
              <GraduationCap size={36} color={colors.white} />
            </View>
            <Text style={[typography.headlineLg, { color: colors.primary, marginTop: space.md }]}>
              E-Campuz
            </Text>
            <Text style={[typography.bodyMd, { color: colors.textSecondary, marginTop: 2 }]}>
              Portal Akademik Mahasiswa & Dosen
            </Text>
          </View>

          <View style={styles.welcomeHeader}>
            <Text style={[typography.headlineLg, { color: colors.textPrimary }]}>
              Selamat Datang
            </Text>
            <Text
              style={[
                typography.bodyMd,
                { color: colors.textSecondary, marginTop: space.xs },
              ]}
            >
              Silakan masuk dengan akun kampus Anda untuk mengakses jadwal, materi, dan perkuliahan.
            </Text>
          </View>

          <View style={styles.formCard}>
            {/* Segmented Control Mahasiswa | Dosen */}
            <View style={styles.segmentedTrack}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: selectedRole === 'mahasiswa' }}
                onPress={() => {
                  setSelectedRole('mahasiswa');
                  setAuthError(null);
                }}
                style={[
                  styles.segmentBtn,
                  selectedRole === 'mahasiswa' && styles.segmentBtnActive,
                ]}
              >
                <GraduationCap
                  size={18}
                  color={selectedRole === 'mahasiswa' ? colors.primary : colors.iconMuted}
                />
                <Text
                  style={[
                    typography.labelMd,
                    {
                      color:
                        selectedRole === 'mahasiswa' ? colors.primary : colors.textSecondary,
                      marginLeft: space.xs,
                    },
                  ]}
                >
                  Mahasiswa
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: selectedRole === 'dosen' }}
                onPress={() => {
                  setSelectedRole('dosen');
                  setAuthError(null);
                }}
                style={[
                  styles.segmentBtn,
                  selectedRole === 'dosen' && styles.segmentBtnActive,
                ]}
              >
                <IdCard
                  size={18}
                  color={selectedRole === 'dosen' ? colors.primary : colors.iconMuted}
                />
                <Text
                  style={[
                    typography.labelMd,
                    {
                      color: selectedRole === 'dosen' ? colors.primary : colors.textSecondary,
                      marginLeft: space.xs,
                    },
                  ]}
                >
                  Dosen
                </Text>
              </Pressable>
            </View>

            {/* Input NIM / NIP */}
            <View style={styles.fieldGroup}>
              <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                {selectedRole === 'mahasiswa'
                  ? 'Nomor Induk Mahasiswa (NIM)'
                  : 'Nomor Induk Pegawai (NIP)'}
              </Text>
              <Controller
                control={control}
                name="nimNip"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputBox}>
                    <IdCard size={20} color={colors.iconMuted} />
                    <TextInput
                      accessibilityLabel={
                        selectedRole === 'mahasiswa' ? 'Input NIM' : 'Input NIP'
                      }
                      value={value}
                      onChangeText={onChange}
                      placeholder={
                        selectedRole === 'mahasiswa'
                          ? 'Contoh: 22053181'
                          : 'Contoh: 198204152010121001'
                      }
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      style={[typography.bodyMd, styles.textInput]}
                    />
                  </View>
                )}
              />
              {errors.nimNip ? (
                <Text style={[typography.bodySm, styles.errorText]}>
                  {errors.nimNip.message}
                </Text>
              ) : null}
            </View>

            {/* Input Kata Sandi + Lupa Kata Sandi */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={[typography.titleSm, { color: colors.textPrimary }]}>
                  Kata Sandi
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Lupa Kata Sandi"
                  onPress={() =>
                    router.push({
                      pathname: '/support/new',
                      params: { category: 'Akun & IT', kind: 'bantuan' },
                    } as never)
                  }
                >
                  <Text style={[typography.labelMd, { color: colors.primary }]}>
                    Lupa Kata Sandi?
                  </Text>
                </Pressable>
              </View>

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputBox}>
                    <Lock size={20} color={colors.iconMuted} />
                    <TextInput
                      accessibilityLabel="Input Kata Sandi"
                      value={value}
                      onChangeText={onChange}
                      placeholder="Masukkan kata sandi portal"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={[typography.bodyMd, styles.textInput]}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'
                      }
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.eyeHit}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={colors.iconMuted} />
                      ) : (
                        <Eye size={20} color={colors.iconMuted} />
                      )}
                    </Pressable>
                  </View>
                )}
              />
              {errors.password ? (
                <Text style={[typography.bodySm, styles.errorText]}>
                  {errors.password.message}
                </Text>
              ) : null}
            </View>

            {/* Pesan error login jelas sesuai AC */}
            {authError ? (
              <View style={styles.authErrorBanner}>
                <AlertCircle size={18} color={colors.urgent} />
                <Text
                  style={[
                    typography.bodySm,
                    { color: colors.urgentText, marginLeft: space.sm, flex: 1 },
                  ]}
                >
                  {authError}
                </Text>
              </View>
            ) : null}

            {/* Ingat saya */}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
              onPress={() => setRememberMe((prev) => !prev)}
              style={styles.rememberRow}
            >
              {rememberMe ? (
                <CheckSquare size={20} color={colors.secondary} />
              ) : (
                <Square size={20} color={colors.iconMuted} />
              )}
              <Text
                style={[
                  typography.bodyMd,
                  { color: colors.textSecondary, marginLeft: space.sm },
                ]}
              >
                Ingat saya di perangkat ini
              </Text>
            </Pressable>

            <Button
              title="Masuk Sekarang"
              onPress={handleSubmit(onSubmit)}
              loading={loginMutation.isPending}
              rightIcon={<ArrowRight size={18} color={colors.white} />}
              style={{ marginTop: space.md }}
            />

            {/* Pilihan Cepat Akun Demo Seed */}
            <View style={styles.demoBox}>
              <Text style={[typography.labelSm, { color: colors.textSecondary }]}>
                AKUN DEMO CEPAT (SESUAI SEED.SQL):
              </Text>
              <View style={styles.demoChips}>
                <Pressable
                  onPress={() => fillDemoAccount('mahasiswa', '22053181')}
                  style={styles.demoChip}
                >
                  <Text style={[typography.bodySm, { color: colors.primary }]}>
                    Mhs (Rina · 22053181)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => fillDemoAccount('mahasiswa', '22053182')}
                  style={styles.demoChip}
                >
                  <Text style={[typography.bodySm, { color: colors.primary }]}>
                    Ketua Kelas (22053182)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => fillDemoAccount('dosen', '198204152010121001')}
                  style={styles.demoChip}
                >
                  <Text style={[typography.bodySm, { color: colors.primary }]}>
                    Dosen (Dr. Ahmad Fauzi)
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.footerHelp}>
            <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
              Kendala saat login?{' '}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/support/new',
                  params: { category: 'Akun & IT', kind: 'bantuan' },
                } as never)
              }
            >
              <Text style={[typography.labelMd, { color: colors.primary }]}>
                Hubungi Helpdesk IT Kampus
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: space.screenMargin,
    paddingVertical: space.xl,
  },
  brandSection: {
    alignItems: 'center',
  },
  logoBox: {
    width: 68,
    height: 68,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level2,
  },
  welcomeHeader: {
    marginTop: space.xl,
    marginBottom: space.lg,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    ...elevation.level1,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    padding: 4,
    marginBottom: space.lg,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: radius.md,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    ...elevation.level1,
  },
  fieldGroup: {
    marginBottom: space.md,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: space.controlHeight,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    marginTop: space.xs,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    marginLeft: space.sm,
    paddingVertical: space.sm,
  },
  eyeHit: {
    padding: space.xs,
  },
  errorText: {
    color: colors.urgentText,
    marginTop: 4,
  },
  authErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.urgentSoft,
    borderWidth: 1,
    borderColor: colors.urgentBorder,
    borderRadius: radius.input,
    padding: space.md,
    marginBottom: space.md,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.xs,
  },
  demoBox: {
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  demoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.xs,
  },
  demoChip: {
    backgroundColor: colors.tintSoft,
    borderWidth: 1,
    borderColor: colors.tintStrong,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  footerHelp: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: space.xl,
  },
});
