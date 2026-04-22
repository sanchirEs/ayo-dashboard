import { redirect } from 'next/navigation';
import getToken from '@/lib/GetTokenServer';

export default async function DashboardPage() {
    const token = await getToken();
    if (!token) redirect('/login');
    redirect('/order-list');
}
