import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const html = readFileSync(
      join(process.cwd(), 'public', 'index.html'),
      'utf-8'
    )
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch {
    return NextResponse.redirect('/login')
  }
}
