import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { email, otp } = await req.json()

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    // Helper para llamar a Supabase REST API directamente
    const sbFetch = (path: string, options: RequestInit = {}) =>
      fetch(`${SUPABASE_URL}/rest/v1${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_ROLE_KEY!,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Prefer": "return=representation",
          ...(options.headers || {}),
        },
      })

    // ── VERIFICAR OTP ─────────────────────────────────────────────────
    if (otp) {
      const now = new Date().toISOString()
      const res = await sbFetch(
        `/portal_otp?email=eq.${encodeURIComponent(email)}&codigo=eq.${otp}&usado=eq.false&expira_at=gte.${now}&limit=1`
      )
      const rows = await res.json()

      if (!rows || rows.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: "Código inválido o expirado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        )
      }

      // Marcar como usado
      await sbFetch(`/portal_otp?id=eq.${rows[0].id}`, {
        method: "PATCH",
        body: JSON.stringify({ usado: true }),
      })

      // Buscar cliente
      const clienteRes = await sbFetch(
        `/clientes?email=eq.${encodeURIComponent(email)}&portal_activo=eq.true&limit=1`
      )
      const clientes = await clienteRes.json()

      if (!clientes || clientes.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: "Cliente no encontrado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        )
      }

      return new Response(
        JSON.stringify({ success: true, cliente_id: clientes[0].id, razon_social: clientes[0].razon_social, saldo_cc: clientes[0].saldo_cc ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // ── GENERAR Y ENVIAR OTP ──────────────────────────────────────────
    // Verificar cliente
    const clienteRes = await sbFetch(
      `/clientes?email=eq.${encodeURIComponent(email)}&portal_activo=eq.true&limit=1`
    )
    const clientes = await clienteRes.json()

    if (!clientes || clientes.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No tenés acceso habilitado. Contactá a tu vendedor." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      )
    }

    const cliente = clientes[0]

    // Generar OTP
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expira_at = new Date(Date.now() + 60 * 1000).toISOString()

    // Guardar OTP
    await sbFetch("/portal_otp", {
      method: "POST",
      body: JSON.stringify({
        email,
        codigo,
        expira_at,
        usado: false,
        cliente_id: cliente.id,
      }),
    })

    // Limpiar OTPs viejos
    await sbFetch(`/portal_otp?email=eq.${encodeURIComponent(email)}&usado=eq.true`, {
      method: "DELETE",
    })

    // Enviar email con Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sentra Portal <portal@fenikso.io>",
        to: email,
        subject: "Tu código de acceso — Sentra Portal",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #0F1F3D;">Hola, ${cliente.razon_social} 👋</h2>
            <p style="color: #555;">Tu código de acceso al portal es:</p>
            <div style="background: #0F1F3D; color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 24px; border-radius: 12px; margin: 24px 0;">
              ${codigo}
            </div>
            <p style="color: #e53e3e; font-size: 13px; text-align: center;">⏱ Este código expira en <strong>60 segundos</strong></p>
            <p style="color: #999; font-size: 12px; margin-top: 32px;">Si no solicitaste este código, ignorá este email.</p>
          </div>
        `,
      }),
    })

    if (!resendRes.ok) {
      const resendError = await resendRes.json()
      console.error("RESEND ERROR:", JSON.stringify(resendError))
      return new Response(
        JSON.stringify({ success: false, message: "Error al enviar el email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: "Código enviado a tu email" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error("ERROR:", err.message)
    return new Response(
      JSON.stringify({ success: false, message: err.message || "Error interno" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})