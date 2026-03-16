import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users } from 'lucide-react';

interface KanbanTest {
  id: string;
  title: string;
  class_name: string;
  subject: string;
  scheduled_date: string;
  status: 'gepland' | 'klaar_voor_nakijken' | 'nagekeken' | 'afgerond';
  graded_count: number;
  total_students: number;
  student_count: number;
}

interface KanbanViewProps {
  onTestClick: (testId: string) => void;
}

export function KanbanView({ onTestClick }: KanbanViewProps) {
  const { user } = useAuth();
  const [tests, setTests] = useState<KanbanTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTest, setDraggedTest] = useState<string | null>(null);

  const columns = [
    { id: 'gepland', label: 'Gepland', color: 'bg-gray-100' },
    { id: 'klaar_voor_nakijken', label: 'Klaar voor Nakijken', color: 'bg-yellow-100' },
    { id: 'nagekeken', label: 'Nagekeken', color: 'bg-blue-100' },
    { id: 'afgerond', label: 'Afgerond', color: 'bg-green-100' },
  ];

  useEffect(() => {
    if (user) {
      loadTests();
    }
  }, [user]);

  const loadTests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: testsData } = await supabase
        .from('tests')
        .select('*, classes(name)')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('scheduled_date', { ascending: true });

      const testsWithProgress = await Promise.all(
        (testsData || []).map(async (test) => {
          const { data: students } = await supabase
            .from('students')
            .select('id')
            .eq('class_id', test.class_id);

          const { count: gradedCount } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('test_id', test.id)
            .eq('is_graded', true);

          return {
            id: test.id,
            title: test.title,
            class_name: (test.classes as any)?.name || '',
            subject: test.subject,
            scheduled_date: test.scheduled_date,
            status: test.status,
            graded_count: gradedCount || 0,
            total_students: students?.length || 0,
            student_count: test.student_count || 0,
          };
        })
      );

      setTests(testsWithProgress);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (testId: string) => {
    setDraggedTest(testId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedTest) return;

    try {
      await supabase
        .from('tests')
        .update({ status: newStatus })
        .eq('id', draggedTest);

      setTests(
        tests.map((test) =>
          test.id === draggedTest ? { ...test, status: newStatus as any } : test
        )
      );
    } catch (error) {
      console.error('Error updating test status:', error);
    } finally {
      setDraggedTest(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTestsForColumn = (status: string) => {
    return tests.filter((test) => test.status === status);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kanban</h2>
          <p className="text-sm text-gray-600 mt-1">
            {tests.length} toetsen getoond
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTests = getTestsForColumn(column.id);
          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column.label}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                  {columnTests.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTests.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Geen toetsen
                  </div>
                ) : (
                  columnTests.map((test) => (
                    <div
                      key={test.id}
                      draggable
                      onDragStart={() => handleDragStart(test.id)}
                      onClick={() => onTestClick(test.id)}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">{test.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {test.class_name} - {test.subject}
                      </p>
                      <div className="flex items-center gap-3 mb-3">
                        <p className="text-xs text-gray-500">{formatDate(test.scheduled_date)}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{test.student_count > 0 ? test.student_count : '—'}</span>
                        </div>
                      </div>

                      {test.total_students > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-sky-600 h-full transition-all"
                              style={{
                                width: `${(test.graded_count / test.total_students) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                            {test.graded_count}/{test.total_students}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
