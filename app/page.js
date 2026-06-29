import { redirect } from 'next/navigation';
import { getSession } from '@/lib/GetTokenServer';
import { getLandingRoute } from '@/lib/permissions';

export default async function DashboardPage() {
    const session = await getSession();
    if (!session?.user?.accessToken) redirect('/login');
    redirect(getLandingRoute(session.user.role));
}
