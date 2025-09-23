import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized3' }, { status: 401 });
    }

    const payload = verifyToken(token);

    // Get all notes for the user's tenant
    const { data: notes, error } = await supabaseAdmin
      .from('notes')
      .select(`
        id,
        title,
        content,
        created_at,
        updated_at,
        users!inner (
          id,
          email
        )
      `)
      .eq('tenant_id', payload.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error) {
    console.error('Error in GET /notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    console.log('Incoming token:', token); // <-- Add this

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized4' }, { status: 401 });
    }

    const payload = verifyToken(token);
    console.log('Decoded JWT payload:', payload); // <-- Add this
    const { title, content } = await request.json();

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Check tenant's subscription plan and note limit
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('plan')
      .eq('id', payload.tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // If tenant is on free plan, check note limit
    if (tenant.plan === 'free') {
      const { count: noteCount, error: countError } = await supabaseAdmin
        .from('notes')
        .select('id', { count: 'exact' })
        .eq('tenant_id', payload.tenantId);

      if (countError) {
        console.error('Error counting notes:', countError);
        return NextResponse.json(
          { error: 'Failed to check note limit' },
          { status: 500 }
        );
      }

      if (noteCount !== null && noteCount >= 3) {
        return NextResponse.json(
          { error: 'Free plan allows maximum 3 notes. Upgrade to Pro for unlimited notes.' },
          { status: 403 }
        );
      }
    }

    // Create the note
    const { data: note, error } = await supabaseAdmin
      .from('notes')
      .insert({
        title: title.trim(),
        content: content?.trim() || '',
        user_id: payload.userId,
        tenant_id: payload.tenantId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}