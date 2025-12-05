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

// POST - Create new barangay
export async function POST(request) {
  try {
    const supabase = createSupabaseAdminClient()
    const body = await request.json()
    const { name, municipality, population } = body

    // Validate required fields
    if (!name || !municipality) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: name and municipality are required" 
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("barangays")
      .insert([{
        name: name.trim(),
        municipality: municipality.trim(),
        population: population || 0
      }])
      .select()
      .single()

    if (error) {
      console.error("Error creating barangay:", error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || "Failed to create barangay" 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error creating barangay:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create barangay",
        message: error.message
      },
      { status: 500 }
    )
  }
}

// PUT - Update barangay
export async function PUT(request) {
  try {
    const supabase = createSupabaseAdminClient()
    const body = await request.json()
    const { id, name, municipality, population } = body

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Barangay ID is required" 
        },
        { status: 400 }
      )
    }

    const updateData = {}
    if (name) updateData.name = name.trim()
    if (municipality) updateData.municipality = municipality.trim()
    if (population !== undefined) updateData.population = population

    const { data, error } = await supabase
      .from("barangays")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating barangay:", error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || "Failed to update barangay" 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error updating barangay:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update barangay",
        message: error.message
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete barangay
export async function DELETE(request) {
  try {
    const supabase = createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Barangay ID is required" 
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("barangays")
      .delete()
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error deleting barangay:", error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || "Failed to delete barangay" 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error deleting barangay:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete barangay",
        message: error.message
      },
      { status: 500 }
    )
  }
}