import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { empresa_id, lista_precio } = await req.json()

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

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

    if (!empresa_id) {
      return new Response(
        JSON.stringify({ error: "empresa_id es requerido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    const campos = [
      "id", "codigo", "nombre",
      "precio_venta", "precio_lista_2", "alicuota_iva",
      "cantidad_caja_chica", "precio_caja_chica",
      "cantidad_caja_master", "precio_caja_master",
    ].join(",")

    const res = await sbFetch(
      `/productos?activo=eq.true&empresa_id=eq.${empresa_id}&select=${campos}&order=nombre.asc`
    )

    const productos = await res.json()

    return new Response(
      JSON.stringify(Array.isArray(productos) ? productos : []),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error("ERROR:", err.message)
    return new Response(
      JSON.stringify({ error: err.message || "Error interno" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
