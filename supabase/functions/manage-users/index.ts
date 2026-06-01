import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Identifica quem está chamando
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) throw new Error('Não autorizado: token inválido')

    const { data: caller, error: callerError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (callerError) throw new Error(`Falha ao verificar permissão: ${callerError.message}`)

    const isSuperAdmin = caller.role === 'super_admin'
    const isTrainer = caller.role === 'trainer'

    if (!isSuperAdmin && !isTrainer) throw new Error('Sem permissão para esta ação')

    const body = await req.json()
    const { action } = body

    // ── CRIAR TRAINER (apenas super_admin) ─────────────────────────
    if (action === 'create-trainer') {
      if (!isSuperAdmin) throw new Error('Apenas super_admin pode criar trainers')

      const { email, fullName } = body
      if (!email || !fullName) throw new Error('email e fullName são obrigatórios')

      const userId = await createAuthUser(supabaseAdmin, email, fullName)

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'trainer', full_name: fullName, is_active: true, must_change_password: true })
        .eq('id', userId)

      if (updateError) throw new Error(`Falha ao atualizar perfil: ${updateError.message}`)

      return ok({ userId })
    }

    // ── CRIAR ALUNO (super_admin ou trainer) ────────────────────────
    if (action === 'create-student') {
      const { email, fullName, trainerId } = body
      if (!email || !fullName) throw new Error('email e fullName são obrigatórios')

      // Trainer só pode criar alunos para si mesmo
      const assignedTrainerId = isTrainer ? caller.id : (trainerId || null)

      const userId = await createAuthUser(supabaseAdmin, email, fullName)

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'user', full_name: fullName, is_active: true, trainer_id: assignedTrainerId, must_change_password: true })
        .eq('id', userId)

      if (updateError) throw new Error(`Falha ao atualizar perfil: ${updateError.message}`)

      return ok({ userId })
    }

    // ── EXCLUIR usuário ─────────────────────────────────────────────
    if (action === 'delete') {
      const { userId } = body
      if (!userId) throw new Error('userId é obrigatório')

      // Trainer só pode excluir seus próprios alunos
      if (isTrainer) {
        const { data: target } = await supabaseAdmin
          .from('profiles')
          .select('trainer_id, role')
          .eq('id', userId)
          .single()

        if (!target || target.trainer_id !== caller.id || target.role !== 'user') {
          throw new Error('Sem permissão para excluir este usuário')
        }
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) throw new Error(`Falha ao excluir: ${deleteError.message}`)

      return ok({})
    }

    // ── RESETAR SENHA do aluno (super_admin ou trainer dono) ────────
    if (action === 'reset-password') {
      const { userId } = body
      if (!userId) throw new Error('userId é obrigatório')

      // Trainer só pode resetar a senha de seus próprios alunos
      if (isTrainer) {
        const { data: target } = await supabaseAdmin
          .from('profiles')
          .select('trainer_id, role')
          .eq('id', userId)
          .single()

        if (!target || target.trainer_id !== caller.id || target.role !== 'user') {
          throw new Error('Sem permissão para resetar a senha deste usuário')
        }
      }

      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: '123456' })
      if (pwError) throw new Error(`Falha ao resetar senha: ${pwError.message}`)

      const { error: flagError } = await supabaseAdmin
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', userId)
      if (flagError) throw new Error(`Falha ao marcar troca de senha: ${flagError.message}`)

      return ok({})
    }

    throw new Error(`Ação desconhecida: ${action}`)
  } catch (err) {
    const message = err instanceof Error ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
      ? String((err as Record<string, unknown>).message)
      : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

async function createAuthUser(
  admin: ReturnType<typeof createClient>,
  email: string,
  fullName: string,
): Promise<string> {
  const { data: existing } = await admin.auth.admin.listUsers()
  const found = existing?.users?.find((u) => u.email === email)
  if (found) return found.id

  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password: '123456',
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw new Error(`Falha ao criar usuário: ${error.message}`)
  if (!newUser.user) throw new Error('Usuário não criado')
  return newUser.user.id
}

function ok(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  })
}
