// app/page.tsx (server component)
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

type Todo = { id: string; title: string; done: boolean };

export default async function Page() {
  const supabase = createClient(cookies());
  const { data: todos, error } = await supabase.from('todos').select('*');

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <ul className="space-y-2">
      {todos?.map((t: Todo) => (
        <li key={t.id}>{t.title}</li>
      ))}
    </ul>
  );
}
