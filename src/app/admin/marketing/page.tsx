import { redirect } from 'next/navigation';

export default function LegacyMarketingPage() {
  redirect('/admin/marketing/overview');
}
