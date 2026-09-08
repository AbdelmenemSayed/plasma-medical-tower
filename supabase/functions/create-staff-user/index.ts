// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '*';
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: caller } = await admin.auth.getUser(token);
    if (!caller.user) return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers });
    const { data: callerProfile } = await admin.from('pmt_profiles').select('role').eq('id', caller.user.id).maybeSingle();
    if (callerProfile?.role !== 'admin') return new Response(JSON.stringify({ error: 'إنشاء الحسابات متاح لمدير النظام فقط' }), { status: 403, headers });
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.full_name || '').trim();
    const role = String(body.role || 'reception');
    const phone = String(body.phone || '').trim();
    const branchId = body.branch_id ? String(body.branch_id) : null;
    if (!email || password.length < 8 || !fullName || !['doctor','branch_manager','reception','laboratory','radiology','call_center','accounting','admin'].includes(role)) return new Response(JSON.stringify({ error: 'راجع البيانات المطلوبة وكلمة المرور (٨ أحرف على الأقل)' }), { status: 400, headers });
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName, role } });
    if (error || !data.user) return new Response(JSON.stringify({ error: error?.message || 'تعذر إنشاء الحساب' }), { status: 400, headers });
    await admin.from('pmt_profiles').upsert({ id: data.user.id, full_name: fullName, role, phone, branch_id: branchId });
    return new Response(JSON.stringify({ id: data.user.id, email, role }), { status: 200, headers });
  } catch (error) { return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' }), { status: 500, headers }); }
});
