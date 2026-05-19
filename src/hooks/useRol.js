import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useRol = () => {
  const [rol, setRol] = useState(null)
  const [permisos, setPermisos] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRol = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('usuarios')
        .select(`
          *,
          roles (*)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (data) {
        setRol(data.roles?.nombre)
        setPermisos(data.roles)
      }

      setLoading(false)
    }

    fetchRol()
  }, [])

  const puedeVer = (permiso) => {
    if (!permisos) return false
    if (rol === 'Dueño') return true
    return permisos[permiso] === true
  }

  return { rol, permisos, loading, puedeVer }
}