# برج بلازما الطبي | Plasma Medical Tower

منصة رعاية صحية عربية متكاملة تشمل الموقع العام، رحلة حجز من خمس خطوات، بوابة دخول فريق العمل، ولوحة قيادة ERP للعمليات الطبية.

## الروابط

- Vercel: https://plasma-medical-tower.vercel.app
- GitHub: https://github.com/AbdelmenemSayed/plasma-medical-tower

## التشغيل المحلي

```bash
npm install
npm run dev
```

## البناء

```bash
npm run build
```

ينتج البناء نسخة ثابتة داخل `out/` جاهزة للنشر على Vercel. يحتوي `supabase_schema.sql` على مخطط قاعدة البيانات المقترح، ولا تُخزَّن مفاتيح Supabase داخل المستودع.

## التقنيات

- Next.js 16 وReact 19
- TypeScript وTailwind CSS
- واجهة عربية RTL متجاوبة
- مخطط PostgreSQL/Supabase للمرضى، الأطباء، المواعيد، الانتظار، السجلات الطبية، المعمل، الأشعة والفواتير
