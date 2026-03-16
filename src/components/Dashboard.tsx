import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Clock, ArrowRight, Trash2, Archive, CheckSquare, Square } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  subject: string;
  school_year: string;
  test_count: number;
  pending_actions: number;
}

interface UpcomingTest {
  id: string;
  title: string;
  class_name: string;
  subject: string;
  scheduled_date: string;
  is_made: boolean;
  is_submitted: boolean;
  is_collected: boolean;
  is_reviewed: boolean;
  is_discussed: boolean;
  grades_adjusted: boolean;
  accommodations_submitted: boolean;
  accommodations_collected: boolean;
}

interface DashboardProps {
  onTestClick: (testId: string) => void;
  onClassClick: (classId: string) => void;
}

export function Dashboard({ onTestClick, onClassClick }: DashboardProps) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      const classStats = await Promise.all(
        (classesData || []).map(async (cls) => {
          const { count: testCount } = await supabase
            .from('tests')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id)
            .eq('is_deleted', false);

          const { count: pendingCount } = await supabase
            .from('tests')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id)
            .eq('is_deleted', false)
            .in('status', ['klaar_voor_nakijken', 'nagekeken']);

          return {
            id: cls.id,
            name: cls.name,
            subject: cls.subject,
            school_year: cls.school_year,
            test_count: testCount || 0,
            pending_actions: pendingCount || 0,
          };
        })
      );

      setClasses(classStats);
      setSelectedIds(new Set());

      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data: testsData } = await supabase
        .from('tests')
        .select('*, classes(name)')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .gte('scheduled_date', today.toISOString())
        .lte('scheduled_date', nextWeek.toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(5);

      const testsWithProgress = (testsData || []).map((test) => ({
        id: test.id,
        title: test.title,
        class_name: (test.classes as any)?.name || '',
        subject: test.subject,
        scheduled_date: test.scheduled_date,
        is_made: test.is_made || false,
        is_submitted: test.is_submitted || false,
        is_collected: test.is_collected || false,
        is_reviewed: test.is_reviewed || false,
        is_discussed: test.is_discussed || false,
        grades_adjusted: test.grades_adjusted || false,
        accommodations_submitted: test.accommodations_submitted || false,
        accommodations_collected: test.accommodations_collected || false,
      }));

      setUpcomingTests(testsWithProgress);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === classes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(classes.map((c) => c.id)));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await supabase
        .from('classes')
        .update({ is_archived: true })
        .in('id', Array.from(selectedIds));
      await loadDashboardData();
    } catch (error) {
      console.error('Error archiving classes:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Weet je zeker dat je ${selectedIds.size} klas(sen) wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    setBulkLoading(true);
    try {
      await supabase
        .from('classes')
        .update({ is_archived: true })
        .in('id', Array.from(selectedIds));

      for (const classId of Array.from(selectedIds)) {
        await supabase
          .from('tests')
          .update({ is_deleted: true })
          .eq('class_id', classId);
      }

      await supabase
        .from('classes')
        .delete()
        .in('id', Array.from(selectedIds));

      await loadDashboardData();
    } catch (error) {
      console.error('Error deleting classes:', error);
    } finally {
      setBulkLoading(false);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allSelected = classes.length > 0 && selectedIds.size === classes.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="p-6 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Klassen Overzicht</h2>
          </div>

          {classes.length > 0 && (
            <div className="flex items-center gap-2">
              {someSelected && (
                <>
                  <span className="text-sm text-gray-500 mr-1">
                    {selectedIds.size} geselecteerd
                  </span>
                  <button
                    onClick={handleBulkArchive}
                    disabled={bulkLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archiveren
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Verwijderen
                  </button>
                </>
              )}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                {allSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {allSelected ? 'Deselecteer alles' : 'Selecteer alles'}
              </button>
            </div>
          )}
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Geen klassen gevonden. Maak je eerste klas aan!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const isSelected = selectedIds.has(cls.id);
              return (
                <div
                  key={cls.id}
                  onClick={() => !someSelected && onClassClick(cls.id)}
                  className={`bg-white rounded-lg border-2 p-5 transition cursor-pointer relative ${
                    isSelected
                      ? 'border-sky-500 shadow-md bg-sky-50/30'
                      : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  <div
                    onClick={(e) => {
                      if (!someSelected) return;
                      toggleSelect(cls.id, e);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{cls.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-sky-600">
                          {cls.test_count} toetsen
                        </span>
                        <button
                          onClick={(e) => toggleSelect(cls.id, e)}
                          className={`p-1 rounded transition ${
                            isSelected ? 'text-sky-600' : 'text-gray-300 hover:text-gray-500'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-3">
                      {cls.pending_actions > 0
                        ? `${cls.pending_actions} openstaande acties`
                        : 'Geen openstaande acties'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Vandaag & Binnenkort</h2>
        </div>

        {upcomingTests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Geen geplande toetsen in de komende week</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {upcomingTests.map((test) => {
              const steps = [
                test.is_made, test.is_submitted, test.is_collected,
                test.is_reviewed, test.is_discussed, test.grades_adjusted,
                test.accommodations_submitted, test.accommodations_collected,
              ];
              const completed = steps.filter(Boolean).length;
              return (
                <div
                  key={test.id}
                  onClick={() => onTestClick(test.id)}
                  className="flex items-center px-6 py-4 hover:bg-gray-50 transition cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{test.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{test.class_name} - {test.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(test.scheduled_date)}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-600 h-full transition-all"
                        style={{ width: `${(completed / 8) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-700 font-semibold whitespace-nowrap w-8 text-right">
                      {completed}/8
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-4 group-hover:text-gray-600 transition-colors" />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
