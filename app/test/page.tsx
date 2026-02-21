// app/page.tsx or any page
import { TestNotificationSystem } from '@/components/notTest';

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Notification System Test</h1>
      <TestNotificationSystem />
    </div>
  );
}