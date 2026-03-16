import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Archive as ArchiveIcon, Trash2, RotateCcw } from 'lucide-react';

interface ArchivedClass {
  id: string;
  name: string;
  subject: string;
  school_year: string;
}

interface DeletedTest {
  id: string;
  title: string;
  class_name: string;
  subject: string;
  scheduled_date: string;
}

export function ArchiveView() {
  const { user } = useAuth();
  const [archivedClasses, setArchivedClasses] = useState<ArchivedClass[]>([]);
  const [deletedTests, setDeletedTests] = useState<DeletedTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadArchiveData();
    }
  }, [user]);

  const loadArchiveData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', true)
        .order('updated_at', { ascending: false });

      setArchivedClasses(classesData || []);

      const { data: testsData } = await supabase
        .from('tests')
        .select('*, classes(name)')
        .eq('user_id', user.id)
        .eq('is_deleted', true)
        .order('updated_at', { ascending: false });

      const deletedTestsList = (testsData || []).map((test) => ({
        id: test.id,
        title: test.title,
        class_name: (test.classes as any)?.name || '',
        subject: test.subject,
        scheduled_date: test.scheduled_date,
      }));

      setDeletedTests(deletedTestsList);
    } catch (error) {
      console.error('Error loading archive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreClass = async (classId: string) => {
    try {
      await supabase
        .from('classes')
        .update({ is_archived: false })
        .eq('id', classId);

      setArchivedClasses(archivedClasses.filter((cls) => cls.id !== classId));
    } catch (error) {
      console.error('Error restoring class:', error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Weet je zeker dat je deze klas permanent wilt verwijderen?')) {
      return;
    }

    try {
      await supabase.from('classes').delete().eq('id', classId);
      setArchivedClasses(archivedClasses.filter((cls) => cls.id !== classId));
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const handleRestoreTest = async (testId: string) => {
    try {
      await supabase
        .from('tests')
        .update({ is_deleted: false })
        .eq('id', testId);

      setDeletedTests(deletedTests.filter((test) => test.id !== testId));
    } catch (error) {
      console.error('Error restoring test:', error);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Weet je zeker dat je deze toets permanent wilt verwijderen?')) {
      return;
    }

    try {
      await supabase.from('tests').delete().eq('id', testId);
      setDeletedTests(deletedTests.filter((test) => test.id !== testId));
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ArchiveIcon className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Gearchiveerde Klassen</h2>
        </div>

        {archivedClasses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Geen gearchiveerde klassen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {archivedClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {cls.name} (Archief)
                  </h3>
                  <p className="text-sm text-gray-600">{cls.school_year}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestoreClass(cls.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Terugzetten"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(cls.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="Permanent verwijderen"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Prullenbak</h2>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">Toetsen</h3>
          {deletedTests.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Geen verwijderde toetsen</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deletedTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{test.title}</h4>
                    <p className="text-sm text-gray-600">
                      {test.class_name} - {test.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreTest(test.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Terugzetten"
                    >
                      <RotateCcw className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Permanent verwijderen"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
