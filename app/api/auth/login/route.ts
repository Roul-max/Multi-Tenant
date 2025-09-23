import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateToken, comparePasswords } from '@/lib/auth';

export const dynamic = 'force-dynamic'; // prevent static generation

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Log incoming request
    console.log('Request body:', { email, password });

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // Debug logs for user fetch
    console.log('Fetched user:', user);
    console.log('User error:', userError);

    if (userError || !user) {
      console.log('User not found or error occurred');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 2️⃣ Fetch tenant by user.tenant_id
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', user.tenant_id)
      .single();

    // Debug logs for tenant fetch
    console.log('Tenant:', tenant);
    console.log('Tenant error:', tenantError);

    if (tenantError || !tenant) {
      console.log('Tenant not found or error occurred');
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 500 }
      );
    }

    // 3️⃣ Verify password
    const isValidPassword = comparePasswords(password, user.password_hash);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 4️⃣ Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'admin' | 'member',
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    });

    // Log success
    console.log('Login successful, token generated');

    // 5️⃣ Return response
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          plan: tenant.plan,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
