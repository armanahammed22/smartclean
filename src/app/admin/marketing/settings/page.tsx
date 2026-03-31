import { redirect } from 'next/navigation';

export default function LegacyTrackingSettingsPage() {
  redirect('/admin/seo/tracking-hub');
}
