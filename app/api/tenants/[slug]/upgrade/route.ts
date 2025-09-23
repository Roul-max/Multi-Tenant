import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);

    // Only admins can upgrade tenants
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can upgrade tenant plans' },
        { status: 403 }
      );
    }

    // Verify the tenant slug matches the user's tenant
    if (payload.tenantSlug !== params.slug) {
      return NextResponse.json(
        { error: 'Cannot upgrade a different tenant' },
        { status: 403 }
      );
    }

    // Update tenant plan to 'pro'
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .update({ plan: 'pro' })
      .eq('slug', params.slug)
      .eq('id', payload.tenantId) // Double-check tenant isolation
      .select()
      .single();

    if (error || !tenant) {
      console.error('Error upgrading tenant:', error);
      return NextResponse.json(
        { error: 'Failed to upgrade tenant plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        plan: tenant.plan,
      },
      message: 'Successfully upgraded to Pro plan!',
    });
  } catch (error) {
    console.error('Error in POST /tenants/[slug]/upgrade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}