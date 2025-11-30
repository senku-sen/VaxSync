import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const BARANGAY_NAMES = [
  "BARANGAY II",
  "CALASGASAN",
  "CAMAMBUGAN",
  "ALAWIHAO",
  "DOGONGAN",
  "BIBIRAO",
  "PAMORANGON",
  "MAGANG",
  "MANCRUZ"
]

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured")
  }

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured. Check your environment variables.")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from("barangays")
      .select("id, name")
      .order("name", { ascending: true })

    if (error) {
      throw error
    }

    const normalizedMap = new Map()
    ;(data || []).forEach((barangay) => {
      if (!barangay?.name || !barangay?.id) return
      normalizedMap.set(String(barangay.name).trim().toUpperCase(), {
        id: barangay.id,
        name: barangay.name
      })
    })

    const missingNames = BARANGAY_NAMES.filter(
      (name) => !normalizedMap.has(name.trim().toUpperCase())
    )

    if (missingNames.length > 0) {
      const { data: insertedBarangays, error: insertError } = await supabase
        .from("barangays")
        .insert(
          missingNames.map((name) => ({
            name,
            municipality: "DAET"
          }))
        )
        .select("id, name")

      if (insertError) {
        console.error("Failed to insert missing barangays:", insertError)
      } else {
        ;(insertedBarangays || []).forEach((barangay) => {
          normalizedMap.set(String(barangay.name).trim().toUpperCase(), {
            id: barangay.id,
            name: barangay.name
          })
        })
      }
    }

    const orderedOptions = BARANGAY_NAMES.map((name) => {
      const entry = normalizedMap.get(name.trim().toUpperCase())
      return entry
        ? {
            value: entry.id,
            label: name
          }
        : null
    }).filter(Boolean)

    return NextResponse.json({ barangays: orderedOptions })
  } catch (error) {
    console.error("Error fetching barangays:", error)
    return NextResponse.json(
      {
        error: "Failed to load barangays",
        message: error.message
      },
      { status: 500 }
    )
  }
}

