import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfile, uploadAvatar } from '../services/profile.service'
import { supabase } from '../lib/supabase'
import { Topbar } from '../components/layout/Topbar'
import { Icon } from '../components/ui/Icon'
import { AvatarCropModal } from '../components/ui/AvatarCropModal'

// ─── Schema ───────────────────────────────────────────────────────────────────

const toOptionalNumber = (val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined
  const n = Number(val)
  return isNaN(n) ? undefined : n
}

const passwordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(80, 'Nome muito longo'),

  height: z.preprocess(toOptionalNumber, z.number().positive('Altura inválida').optional()),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  goal: z.string().max(300, 'Máximo de 300 caracteres').optional(),
  target_weight: z.preprocess(toOptionalNumber, z.number().positive('Peso alvo inválido').optional()),
})

type ProfileFormData = z.infer<typeof profileSchema>

// ─── Página ──────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Avatar / foto de perfil
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Cria uma URL temporária da foto para o recortador (não sai do dispositivo ainda)
    setCropSrc(URL.createObjectURL(file))
    // Limpa o valor para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  async function handleCropConfirm(blob: Blob) {
    if (!user) return
    setIsUploadingAvatar(true)
    setAvatarError('')
    try {
      await uploadAvatar(user.id, blob)
      await refreshProfile()
      setCropSrc(null)
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Erro ao salvar foto')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  function handleCropClose() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const [pwStatus, setPwStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [pwError, setPwError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    formState: { errors: pwErrors, isSubmitting: isPwSubmitting },
    reset: resetPw,
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  async function onPasswordSubmit(data: PasswordFormData) {
    setPwStatus('idle')
    setPwError('')
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      await supabase.from('profiles').update({ must_change_password: false }).eq('id', user!.id)
      setPwStatus('success')
      resetPw()
      setTimeout(() => setPwStatus('idle'), 3000)
    } catch (err) {
      setPwStatus('error')
      setPwError(err instanceof Error ? err.message : 'Erro ao atualizar senha')
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',

      height: profile?.height ?? ('' as unknown as number),
      birth_date: profile?.birth_date ?? '',
      gender: (profile?.gender as ProfileFormData['gender']) ?? '',
      goal: profile?.goal ?? '',
      target_weight: profile?.target_weight ?? ('' as unknown as number),
    },
  })

  async function onSubmit(data: ProfileFormData) {
    if (!user) return
    setSaveStatus('idle')
    setErrorMsg('')
    try {
      const cleaned = {
        full_name: data.full_name,
        height: data.height,
        birth_date: data.birth_date || undefined,
        gender: data.gender === '' ? undefined : data.gender,
        goal: data.goal || undefined,
        target_weight: data.target_weight,
      }
      await updateProfile(user.id, cleaned)
      setSaveStatus('success')
      reset(data, { keepValues: true })
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const initial = (profile?.full_name ?? 'A').charAt(0).toUpperCase()
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()
    : '—'

  // Idade calculada
  let ageLabel = ''
  if (profile?.birth_date) {
    const d = new Date(profile.birth_date)
    const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
    ageLabel = ` · ${age} anos`
  }

  return (
    <>
      <Topbar
        eyebrow={`MEMBRO DESDE ${memberSince}`}
        title="PERFIL"
        actions={
          <>
            <Link to="/dashboard" className="btn ghost">
              <Icon name="arrowL" size={14} /> Voltar
            </Link>
            <button onClick={() => void signOut()} className="btn ghost">
              <Icon name="logout" size={14} /> Sair
            </button>
          </>
        }
      />

      {/* Modal de recorte — aparece quando o usuário escolhe uma foto */}
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirm={(blob) => void handleCropConfirm(blob)}
          onClose={handleCropClose}
          isLoading={isUploadingAvatar}
        />
      )}

      <div className="content">
        {/* HEADER do perfil */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card"
          style={{ padding: 0 }}
        >
          <div className="forja-profile-header">
            {/* Input de arquivo oculto — abre a galeria/câmera do dispositivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-hidden="true"
            />

            <div
              className="forja-profile-avatar avatar-btn"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Alterar foto de perfil"
              title="Clique para alterar foto de perfil"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name ?? 'Avatar'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
                />
              ) : (
                <span className="avatar-initial">{initial}</span>
              )}
              {/* Overlay de câmera exibido no hover */}
              <span className="avatar-cam-overlay" aria-hidden="true">
                <CameraIcon />
                <span style={{ fontSize: 10, fontFamily: 'var(--f-mono)', letterSpacing: '0.1em', marginTop: 4, textTransform: 'uppercase' }}>
                  Alterar
                </span>
              </span>
            </div>
            <div style={{ flex: 1, paddingBottom: 10, minWidth: 0 }}>
              <h1
                className="f-display"
                style={{ fontSize: 48, margin: 0, color: 'var(--text)', lineHeight: 1 }}
              >
                {(profile?.full_name ?? 'ATLETA').toUpperCase()}
              </h1>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {isAdmin && <span className="chip solid">Personal Trainer</span>}
                {!isAdmin && <span className="chip">Aluno</span>}
                {profile?.goal && <span className="chip">{profile.goal.split(' ')[0]}</span>}
                {profile?.email && (
                  <span className="chip muscle" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Erro de upload de avatar */}
        {avatarError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '10px 14px',
              background: 'rgba(255,61,85,0.08)',
              border: '1px solid rgba(255,61,85,0.25)',
              borderRadius: 'var(--r-2)',
              color: 'var(--danger)',
              fontSize: 12,
              marginTop: 8,
            }}
          >
            ⚠ {avatarError}
          </motion.div>
        )}

        {/* DADOS PESSOAIS — formulário */}
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          onSubmit={handleSubmit(onSubmit)}
          className="card"
          noValidate
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <h2 className="card-title">DADOS PESSOAIS</h2>
            <button
              type="submit"
              className="btn primary"
              disabled={!isDirty || isSubmitting}
            >
              <Icon name="check" size={14} stroke={2.5} />
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          {/* Status */}
          {saveStatus === 'success' && (
            <div
              className="chip success"
              style={{ marginBottom: 16, padding: '6px 12px' }}
            >
              ✓ Perfil atualizado com sucesso
            </div>
          )}
          {saveStatus === 'error' && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: 'rgba(255,61,85,0.08)',
                border: '1px solid rgba(255,61,85,0.25)',
                borderRadius: 'var(--r-2)',
                color: 'var(--danger)',
                fontSize: 12,
              }}
            >
              ⚠ {errorMsg || 'Erro ao salvar'}
            </div>
          )}

          <div className="forja-profile-grid">
            <Field label="Nome completo" error={errors.full_name?.message}>
              <input className="input" {...register('full_name')} placeholder="Seu nome" />
            </Field>

            <Field label={`Nascimento${ageLabel}`} error={errors.birth_date?.message}>
              <input className="input" type="date" {...register('birth_date')} />
            </Field>

            <div>
              <div className="label-sm" style={{ marginBottom: 6 }}>Peso atual (kg)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 20, color: 'var(--text)', fontWeight: 700 }}>
                  {profile?.weight ? `${profile.weight} kg` : '—'}
                </span>
                <Link
                  to="/medidas"
                  style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: 10,
                    color: 'var(--text-faint)',
                    textDecoration: 'none',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-1)',
                    padding: '3px 8px',
                  }}
                >
                  Registrar em Medidas →
                </Link>
              </div>
            </div>

            <Field label="Altura (cm)" error={errors.height?.message}>
              <input
                className="input"
                type="number"
                placeholder="Ex: 178"
                {...register('height')}
              />
            </Field>

            <Field label="Peso alvo (kg)" error={errors.target_weight?.message}>
              <input
                className="input"
                type="number"
                step={0.1}
                placeholder="Ex: 85"
                {...register('target_weight')}
              />
            </Field>

            <Field label="Gênero" error={errors.gender?.message}>
              <select className="input" {...register('gender')}>
                <option value="">— Não informar —</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </Field>

            <Field
              label="Objetivo"
              error={errors.goal?.message}
              style={{ gridColumn: '1 / -1' }}
            >
              <textarea
                className="input"
                placeholder="Ex: Hipertrofia · Bulking — ganhar 5kg de massa magra em 6 meses"
                rows={3}
                {...register('goal')}
              />
            </Field>
          </div>
        </motion.form>

        {/* SEGURANÇA — redefinir senha */}
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          onSubmit={handleSubmitPw(onPasswordSubmit)}
          className="card"
          noValidate
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <h2 className="card-title">SEGURANÇA</h2>
            <button type="submit" className="btn primary" disabled={isPwSubmitting}>
              <Icon name="check" size={14} stroke={2.5} />
              {isPwSubmitting ? 'Salvando...' : 'Atualizar Senha'}
            </button>
          </div>

          {pwStatus === 'success' && (
            <div className="chip success" style={{ marginBottom: 16, padding: '6px 12px' }}>
              ✓ Senha atualizada com sucesso
            </div>
          )}
          {pwStatus === 'error' && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,61,85,0.08)', border: '1px solid rgba(255,61,85,0.25)', borderRadius: 'var(--r-2)', color: 'var(--danger)', fontSize: 12 }}>
              ⚠ {pwError || 'Erro ao atualizar senha'}
            </div>
          )}

          <div className="forja-profile-grid">
            <Field label="Nova senha" error={pwErrors.password?.message}>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" style={{ paddingRight: 40 }} {...registerPw('password')} />
                <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4, display: 'flex', alignItems: 'center' }}>
                  <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </Field>
            <Field label="Confirmar nova senha" error={pwErrors.confirmPassword?.message}>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showConfirmPw ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" style={{ paddingRight: 40 }} {...registerPw('confirmPassword')} />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirmPw((v) => !v)} aria-label={showConfirmPw ? 'Ocultar senha' : 'Mostrar senha'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4, display: 'flex', alignItems: 'center' }}>
                  <Icon name={showConfirmPw ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </Field>
          </div>
        </motion.form>

      </div>

      <style>{`
        .forja-profile-header {
          padding: 24px 28px 28px;
          display: flex;
          gap: 24px;
          align-items: center;
          position: relative;
          flex-wrap: wrap;
        }

        /* Avatar — base */
        .forja-profile-avatar {
          width: 140px;
          height: 140px;
          border-radius: 16px;
          background: linear-gradient(135deg, #1a1b1c, #050506);
          border: 4px solid var(--bg-0);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--f-display);
          font-size: 72px;
          color: var(--accent);
          flex-shrink: 0;
          overflow: hidden;
          position: relative;
        }

        /* Avatar clicável */
        .avatar-btn {
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .avatar-btn:hover {
          box-shadow: 0 0 0 3px var(--accent);
        }
        .avatar-btn:focus-visible {
          box-shadow: 0 0 0 3px var(--accent);
          outline: none;
        }

        .avatar-initial {
          font-family: var(--f-display);
          font-size: 72px;
          color: var(--accent);
          line-height: 1;
          user-select: none;
        }

        /* Overlay de câmera — aparece no hover */
        .avatar-cam-overlay {
          position: absolute;
          inset: 0;
          background: rgba(6,7,26,0.72);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text);
          opacity: 0;
          transition: opacity 0.2s;
          border-radius: 12px;
          gap: 4px;
        }
        .avatar-btn:hover .avatar-cam-overlay,
        .avatar-btn:focus-visible .avatar-cam-overlay {
          opacity: 1;
        }

        .forja-profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 768px) {
          .forja-profile-grid { grid-template-columns: 1fr; }
          .forja-profile-avatar { width: 100px; height: 100px; }
          .avatar-initial { font-size: 48px; }
        }
      `}</style>
    </>
  )
}

// ─── Ícone de câmera ──────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

// ─── Componente auxiliar: campo de formulário ──────────────────────────────

function Field({
  label,
  error,
  children,
  style,
}: {
  label: string
  error?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <div className="label-sm" style={{ marginBottom: 6 }}>
        {label}
      </div>
      {children}
      {error && (
        <div
          style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, letterSpacing: '0.04em' }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  )
}
