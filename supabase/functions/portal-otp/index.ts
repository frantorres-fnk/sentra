import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { email, otp } = await req.json()
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // ── PASO 1: Verificar OTP ─────────────────────────────────────────
    if (otp) {
      const { data: otpData } = await supabase
        .from("portal_otp")
        .select("*")
        .eq("email", email)
        .eq("codigo", otp)
        .eq("usado", false)
        .gte("expira_at", new Date().toISOString())
        .single()

      if (!otpData) {
        return new Response(
          JSON.stringify({ success: false, message: "Código inválido o expirado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        )
      }

      // Marcar OTP como usado
      await supabase
        .from("portal_otp")
        .update({ usado: true })
        .eq("id", otpData.id)

      // Buscar cliente
      const { data: cliente } = await supabase
        .from("clientes")
        .select("id, razon_social, portal_activo, portal_user_id")
        .eq("email", email)
        .eq("portal_activo", true)
        .single()

      if (!cliente) {
        return new Response(
          JSON.stringify({ success: false, message: "Cliente no encontrado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        )
      }

      return new Response(
        JSON.stringify({ success: true, cliente_id: cliente.id, razon_social: cliente.razon_social }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // ── PASO 2: Generar y enviar OTP ──────────────────────────────────
    // Verificar que el cliente existe y tiene portal activo
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, razon_social, email, portal_activo")
      .eq("email", email)
      .single()

    if (!cliente || !cliente.portal_activo) {
      return new Response(
        JSON.stringify({ success: false, message: "No tenés acceso habilitado al portal. Contactá a tu vendedor." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      )
    }

    // Generar OTP de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expira_at = new Date(Date.now() + 60 * 1000).toISOString() // 60 segundos

    // Guardar OTP en tabla
    await supabase.from("portal_otp").insert([{
      email,
      codigo,
      expira_at,
      usado: false,
      cliente_id: cliente.id,
    }])

    // Limpiar OTPs viejos del mismo email
    await supabase
      .from("portal_otp")
      .delete()
      .eq("email", email)
      .eq("usado", true)

    // Enviar email con Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sentra Portal <portal@sentra.fenikso.io>",
        to: email,
        subject: "Tu código de acceso — Sentra Portal",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <img src="https://sentra.fenikso.io/sentra-logo.png" style="height: 48px; margin-bottom: 24px;" />
            <h2 style="color: #0F1F3D; margin-bottom: 8px;">Hola, ${cliente.razon_social} 👋</h2>
            <p style="color: #555; margin-bottom: 24px;">Tu código de acceso al portal es:</p>
            <div style="background: #0F1F3D; color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 24px; border-radius: 12px; margin-bottom: 16px;">
              ${codigo}
            </div>
            <p style="color: #e53e3e; font-size: 13px; text-align: center;">⏱ Este código expira en <strong>60 segundos</strong></p>
            <p style="color: #999; font-size: 12px; margin-top: 32px;">Si no solicitaste este código, ignorá este email.</p>
          </div>
        `,
      }),
    })

    if (!resendRes.ok) {
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
    return new Response(
      JSON.stringify({ success: false, message: "Error interno" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})