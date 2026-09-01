import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: 'Đăng xuất thành công',
  });

  // Clear HTTP cookie
  res.cookies.delete('nks_token');
  return res;
}

export async function GET() {
  const res = NextResponse.json({
    success: true,
    message: 'Đăng xuất thành công',
  });

  res.cookies.delete('nks_token');
  return res;
}
