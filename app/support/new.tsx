import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  HelpCircle,
  Info,
  Lightbulb,
  Lock,
  Send,
  Trash2,
  Upload,
} from 'lucide-react-native';
import { colors, radius, space, typography } from '@/theme';
import { useCoursesData, useSupportData } from '@/features/useCampusData';
import { useAppStore } from '@/store';
import { Button, Card } from '@/components/ui';
import { Ticket, TicketCategory } from '@/types';

const TICKET_CATEGORIES: TicketCategory[] = [
  'Akademik & KRS',
  'Nilai',
  'Keuangan/UKT',
  'Akun & IT',
  'Fasilitas',
  'Lainnya',
];

export default function CreateTicketScreen() {
  const params = useLocalSearchParams<{
    category?: string;
    kind?: 'bantuan' | 'pengaduan';
    title?: string;
    description?: string;
    courseId?: string;
  }>();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const { faqsQuery, createTicketMutation } = useSupportData();
  const coursesQuery = useCoursesData();

  const [kind, setKind] = useState<'bantuan' | 'pengaduan'>(
    params.kind === 'pengaduan' ? 'pengaduan' : 'bantuan',
  );
  const [category, setCategory] = useState<string>(
    params.category && TICKET_CATEGORIES.includes(params.category as TicketCategory)
      ? params.category
      : 'Keuangan/UKT',
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(params.courseId || '');
  const [title, setTitle] = useState<string>(params.title || '');
  const [description, setDescription] = useState<string>(params.description || '');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [guestNimNip, setGuestNimNip] = useState<string>('');

  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  const canBeAnonymous = useMemo(
    () =>
      kind === 'pengaduan' &&
      (category === 'Fasilitas' || category === 'Lainnya'),
    [kind, category],
  );

  useEffect(() => {
    if (!canBeAnonymous && anonymous) {
      setAnonymous(false);
    }
  }, [canBeAnonymous, anonymous]);

  const courses = coursesQuery.data ?? [];
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  const suggestedFaq = useMemo(() => {
    const faqs = faqsQuery.data ?? [];
    const q = title.trim().toLowerCase();
    return (
      faqs.find(
        (f) =>
          f.category === category ||
          (q.length > 3 && f.question.toLowerCase().includes(q)),
      ) ?? faqs[0]
    );
  }, [faqsQuery.data, category, title]);

  const isDirty = Boolean(
    title.trim().length > 0 ||
      description.trim().length > 0 ||
      attachments.length > 0,
  );

  const handleBack = () => {
    if (isDirty && !createdTicket) {
      setDiscardModalOpen(true);
      return;
    }
    router.back();
  };

  const handleAddAttachment = async () => {
    if (attachments.length >= 3) {
      showToast('Maksimal 3 berkas lampiran per tiket');
      return;
    }
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        setAttachments((prev) => [...prev, res.assets[0].name]);
      }
    } catch {
      const fallbackName =
        attachments.length === 0
          ? 'Surat_Keterangan_Pendukung.pdf'
          : 'Bukti_Tangkapan_Layar.png';
      setAttachments((prev) => [...prev, fallbackName]);
    }
  };

  const handleSubmit = () => {
    if (!user && !guestNimNip.trim()) {
      showToast('Masukkan NIM atau NIP Anda terlebih dahulu');
      return;
    }
    if (title.trim().length < 5) {
      showToast('Judul tiket minimal 5 karakter');
      return;
    }
    if (description.trim().length < 20) {
      showToast('Deskripsi detail masalah minimal 20 karakter');
      return;
    }

    createTicketMutation.mutate(
      {
        kind,
        category,
        courseId: selectedCourse?.id,
        courseName: selectedCourse?.name,
        title: title.trim(),
        description: description.trim(),
        attachments,
        anonymous: canBeAnonymous ? anonymous : false,
        guestNimNip: !user ? guestNimNip.trim() : undefined,
      },
      {
        onSuccess: (created) => {
          setCreatedTicket(created);
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Buat Tiket Baru</Text>
          <Text style={styles.headerSubtitle}>
            {user
              ? `${user.name} • ${user.nimNip}`
              : 'Mode Pemulihan Akun / Tamu SIAKAD'}
          </Text>
        </View>
        <Pressable
          onPress={() =>
            suggestedFaq && router.push(`/support/faq/${suggestedFaq.id}`)
          }
          style={styles.guideBtn}
        >
          <HelpCircle size={15} color={colors.primary} />
          <Text style={styles.guideBtnText}>Panduan</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Estimasi Respons */}
        <View style={styles.estimateBanner}>
          <Clock size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.estimateTitle}>Estimasi Respons Petugas</Text>
            <Text style={styles.estimateSubtitle}>
              ≤ 1×24 Jam Kerja (Senin–Jumat, 08.00–16.00 WIB)
            </Text>
          </View>
        </View>

        {/* Segmented Control Bantuan | Pengaduan */}
        <View style={styles.segmentedWrap}>
          <Pressable
            onPress={() => setKind('bantuan')}
            style={[styles.segmentBtn, kind === 'bantuan' && styles.segmentBtnActive]}
          >
            <HelpCircle
              size={16}
              color={kind === 'bantuan' ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                kind === 'bantuan' && styles.segmentTextActive,
              ]}
            >
              Bantuan
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setKind('pengaduan')}
            style={[
              styles.segmentBtn,
              kind === 'pengaduan' && styles.segmentBtnActive,
            ]}
          >
            <AlertTriangle
              size={16}
              color={kind === 'pengaduan' ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                kind === 'pengaduan' && styles.segmentTextActive,
              ]}
            >
              Pengaduan
            </Text>
          </Pressable>
        </View>

        <Text style={styles.modeHelperText}>
          {kind === 'bantuan'
            ? 'Mode aktif: Pertanyaan seputar kendala akademik, perkuliahan, UKT, atau akun.'
            : 'Mode aktif: Pelaporan kendala layanan, fasilitas laboratorium, atau aspirasi kampus.'}
        </Text>

        {/* Jika belum login */}
        {!user ? (
          <Card style={styles.fieldCard}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>
                NIM / NIP Pemohon <Text style={{ color: colors.urgent }}>*</Text>
              </Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredBadgeText}>Wajib</Text>
              </View>
            </View>
            <TextInput
              value={guestNimNip}
              onChangeText={setGuestNimNip}
              placeholder="Masukkan NIM atau NIP Anda (misal: 22051204001)"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
            />
          </Card>
        ) : null}

        {/* Kategori Layanan */}
        <Card style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>
              Kategori Layanan <Text style={{ color: colors.urgent }}>*</Text>
            </Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>Wajib</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setCategoryPickerOpen(true)}
            style={styles.selectorBtn}
          >
            <Text style={styles.selectorText}>{category}</Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.fieldHint}>
            Diteruskan langsung ke unit layanan terkait di BAAK / Helpdesk IT Kampus.
          </Text>
        </Card>

        {/* Mata Kuliah Terkait (Opsional) */}
        <Card style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Mata Kuliah Terkait</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>Opsional</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setCoursePickerOpen(true)}
            style={styles.selectorBtn}
          >
            <Text
              style={[
                styles.selectorText,
                !selectedCourse && { color: colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {selectedCourse
                ? `${selectedCourse.name} (${selectedCourse.code})`
                : 'Pilih mata kuliah jika relevan'}
            </Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </Pressable>
        </Card>

        {/* Judul Tiket */}
        <Card style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>
              Judul Tiket <Text style={{ color: colors.urgent }}>*</Text>
            </Text>
            <Text style={styles.charCountText}>{title.length}/100</Text>
          </View>

          <TextInput
            value={title}
            onChangeText={(t) => setTitle(t.slice(0, 100))}
            placeholder="Contoh: Permohonan Pengajuan Keringanan Cicilan UKT"
            placeholderTextColor={colors.textMuted}
            style={styles.textInput}
          />
        </Card>

        {/* Saran FAQ Terkait */}
        {suggestedFaq ? (
          <View style={styles.faqSuggestBox}>
            <View style={styles.faqSuggestIcon}>
              <Lightbulb size={18} color={colors.warningText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.faqSuggestTitle}>
                Pertanyaan Anda mungkin sudah terjawab di FAQ
              </Text>
              <Text style={styles.faqSuggestBody}>
                "{suggestedFaq.question}". Klik untuk membaca sebelum mengirim tiket resmi.
              </Text>
              <Pressable
                onPress={() => router.push(`/support/faq/${suggestedFaq.id}`)}
                style={{ marginTop: 6 }}
              >
                <Text style={styles.faqSuggestLink}>Buka Panduan FAQ Terkait →</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Deskripsi Detail Masalah */}
        <Card style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>
              Deskripsi Detail Masalah <Text style={{ color: colors.urgent }}>*</Text>
            </Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>Min 20 Karakter</Text>
            </View>
          </View>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Jelaskan kronologi kendala, detail nominal/periode, atau lokasi fasilitas secara jelas..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[styles.textInput, styles.textArea]}
          />

          <Text style={styles.fieldHint}>
            Sertakan informasi pendukung agar petugas tidak perlu meminta klarifikasi berulang.
          </Text>
        </Card>

        {/* Lampiran Dokumen */}
        <Card style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Lampiran Dokumen</Text>
            <Text style={styles.charCountText}>
              {attachments.length} dari 3 Berkas
            </Text>
          </View>

          <Pressable onPress={handleAddAttachment} style={styles.uploadDropzone}>
            <View style={styles.uploadIconCircle}>
              <Upload size={20} color={colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>+ Unggah Lampiran Baru</Text>
            <Text style={styles.uploadSub}>
              Maks 3 file (PDF, JPG, PNG) • Maks 10MB per berkas
            </Text>
          </Pressable>

          {attachments.map((file, idx) => (
            <View key={`${file}-${idx}`} style={styles.attachedItemRow}>
              <View style={styles.attachedFileIcon}>
                <FileText size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachedFileName} numberOfLines={1}>
                  {file}
                </Text>
                <Text style={styles.attachedFileMeta}>
                  1,2 MB • Dokumen Lampiran
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                hitSlop={8}
              >
                <Trash2 size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </Card>

        {/* Toggle Kirim sebagai Anonim (Hanya aktif untuk Pengaduan + Fasilitas/Lainnya) */}
        <Card style={styles.fieldCard}>
          <View style={styles.anonHeaderRow}>
            <View style={styles.rowCenter}>
              <Text style={styles.fieldLabel}>Kirim sebagai Anonim</Text>
              {!canBeAnonymous ? (
                <View style={styles.lockedPill}>
                  <Lock size={11} color={colors.textSecondary} />
                  <Text style={styles.lockedPillText}>Terkunci</Text>
                </View>
              ) : null}
            </View>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              disabled={!canBeAnonymous}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.anonInfoBox}>
            <Info size={15} color={colors.textSecondary} />
            <Text style={styles.anonInfoText}>
              {canBeAnonymous
                ? 'Mode anonim tersedia. Jika diaktifkan, nama dan NIM Anda akan disembunyikan dari unit penerima laporan.'
                : 'Opsi anonim khusus aktif untuk mode Pengaduan pada kategori Fasilitas atau Lainnya. Pada kategori akademik/keuangan, identitas wajib diverifikasi BAAK.'}
            </Text>
          </View>
        </Card>

        {/* Identitas Pelapor */}
        {user ? (
          <Card style={styles.identityCard}>
            <View style={styles.identityAvatar}>
              <Text style={styles.identityAvatarText}>
                {anonymous ? 'AN' : 'RS'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.identityName}>
                {anonymous ? 'Pelapor Anonim (Disamarkan)' : user.name}
              </Text>
              <Text style={styles.identitySub}>
                {anonymous
                  ? 'Identitas tidak ditampilkan ke petugas teknis'
                  : `NIM/NIP: ${user.nimNip} • ${user.prodi}`}
              </Text>
            </View>
            <BadgeCheck size={18} color={colors.success} />
          </Card>
        ) : null}
      </ScrollView>

      {/* Bottom Sticky CTA */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleSubmit}
          disabled={createTicketMutation.isPending}
          style={[
            styles.submitBtn,
            createTicketMutation.isPending && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.submitBtnText}>
            {createTicketMutation.isPending
              ? 'Mengirim Tiket...'
              : 'Kirim Tiket Sekarang'}
          </Text>
          <Send size={16} color={colors.white} />
        </Pressable>
      </View>

      {/* Modal Pilih Kategori */}
      <Modal
        visible={categoryPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pilih Kategori Layanan</Text>
            {TICKET_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setCategoryPickerOpen(false);
                }}
                style={[
                  styles.modalOption,
                  category === cat && styles.modalOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    category === cat && {
                      color: colors.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
            <Button
              title="Tutup"
              variant="ghost"
              onPress={() => setCategoryPickerOpen(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Pilih Mata Kuliah */}
      <Modal
        visible={coursePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCoursePickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pilih Mata Kuliah Terkait</Text>
            <Pressable
              onPress={() => {
                setSelectedCourseId('');
                setCoursePickerOpen(false);
              }}
              style={[
                styles.modalOption,
                !selectedCourseId && styles.modalOptionActive,
              ]}
            >
              <Text style={styles.modalOptionText}>Tidak terkait mata kuliah tertentu</Text>
            </Pressable>
            {courses.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSelectedCourseId(c.id);
                  setCoursePickerOpen(false);
                }}
                style={[
                  styles.modalOption,
                  selectedCourseId === c.id && styles.modalOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedCourseId === c.id && {
                      color: colors.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {c.name} ({c.code})
                </Text>
              </Pressable>
            ))}
            <Button
              title="Tutup"
              variant="ghost"
              onPress={() => setCoursePickerOpen(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Konfirmasi Buang Perubahan */}
      <Modal
        visible={discardModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDiscardModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Buang perubahan tiket?</Text>
            <Text style={styles.modalSubtitle}>
              Data formulir tiket yang sudah Anda ketik belum dikirim dan akan hilang.
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button
                title="Lanjut Mengisi"
                variant="ghost"
                onPress={() => setDiscardModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Buang"
                variant="danger"
                onPress={() => {
                  setDiscardModalOpen(false);
                  router.back();
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Konfirmasi Tiket Terkirim (#TKT-2026-xxxxx) */}
      <Modal
        visible={Boolean(createdTicket)}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={32} color={colors.success} />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
              Tiket Berhasil Dikirim!
            </Text>
            <View style={styles.ticketCodeBox}>
              <Text style={styles.ticketCodeLabel}>NOMOR TIKET RESMI</Text>
              <Text style={styles.ticketCodeValue}>#{createdTicket?.code}</Text>
            </View>
            <Text style={[styles.modalSubtitle, { textAlign: 'center' }]}>
              Estimasi respons petugas adalah ≤ 1×24 jam kerja. Anda akan menerima
              notifikasi otomatis setiap kali status tiket diperbarui.
            </Text>
            <Button
              title={user ? 'Lihat Detail Tiket' : 'Kembali ke Halaman Login'}
              variant="primary"
              onPress={() => {
                const targetId = createdTicket?.id;
                setCreatedTicket(null);
                if (user && targetId) {
                  router.replace(`/support/ticket/${targetId}`);
                } else {
                  router.replace('/(auth)/login');
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.titleMd,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  guideBtnText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: space.huge,
    gap: space.md,
  },
  estimateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.tintSoft,
    borderRadius: radius.card,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.tintStrong,
  },
  estimateTitle: {
    ...typography.labelMd,
    color: colors.primary,
  },
  estimateSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  segmentedWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.sm + 2,
    borderRadius: radius.md,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  modeHelperText: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: -6,
  },
  fieldCard: {
    padding: space.md,
    gap: space.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  requiredBadge: {
    backgroundColor: colors.tintSoft,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  requiredBadgeText: {
    ...typography.labelBadge,
    color: colors.primary,
  },
  optionalBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  optionalBadgeText: {
    ...typography.labelBadge,
    color: colors.textSecondary,
  },
  charCountText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    height: 46,
  },
  selectorText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    flex: 1,
  },
  textInput: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
  },
  textArea: {
    minHeight: 110,
  },
  fieldHint: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  faqSuggestBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.card,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  faqSuggestIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqSuggestTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  faqSuggestBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  faqSuggestLink: {
    ...typography.labelSm,
    color: colors.primary,
  },
  uploadDropzone: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.tintStrong,
    borderRadius: radius.card,
    paddingVertical: space.lg,
  },
  uploadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  uploadSub: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  attachedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.sm,
  },
  attachedFileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedFileName: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  attachedFileMeta: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  anonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  lockedPillText: {
    ...typography.labelBadge,
    color: colors.textSecondary,
  },
  anonInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: colors.bg,
    padding: space.sm,
    borderRadius: radius.md,
  },
  anonInfoText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
  },
  identityAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityAvatarText: {
    ...typography.labelMd,
    color: colors.white,
  },
  identityName: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  identitySub: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.input,
    height: 48,
  },
  submitBtnText: {
    ...typography.labelMd,
    color: colors.white,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  modalTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  modalOption: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  modalOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.tintSoft,
  },
  modalOptionText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  ticketCodeBox: {
    backgroundColor: colors.tintSoft,
    borderRadius: radius.md,
    padding: space.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.tintStrong,
  },
  ticketCodeLabel: {
    ...typography.labelBadge,
    color: colors.textSecondary,
  },
  ticketCodeValue: {
    ...typography.headlineSm,
    color: colors.primary,
    marginTop: 2,
  },
});
