import { NextResponse } from 'next/server'

export async function GET(request) {
  return NextResponse.next()
}

export const dynamic = 'force-dynamic'
