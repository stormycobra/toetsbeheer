import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Filter, Calendar as CalendarIcon, MoreVertical, Trash2, Eye, Copy, Archive, Users } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  class_name: string;
  subject: string;
  scheduled_date: string;
  graded_count: number;
  total_students: number;
  student_count: number;
  status: string;
  is_made: boolean;
  is_submitted: boolean;
  is_collected: boolean;
  is_reviewed: boolean;
  is_discussed: boolean;
  grades_adjusted: boolean;
  accommodations_submitted: boolean;
  accommodations_collected: boolean;
}

interface TestListProps {
  searchQuery: string;
  onTestClick: (testId: string) => void;
}

export function TestList({ searchQuery, onTestClick }: TestListProps) {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(false);
  const [sortField, setSortField] = useState<'scheduled_date' | 'title'>('scheduled_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTests();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortTests();
  }, [tests, searchQuery, classFilter, subjectFilter, dateFilter, sortField, sortDirection]);

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
            graded_count: gradedCount || 0,
            total_students: students?.length || 0,
            student_count: test.student_count || 0,
            status: test.status,
            is_made: test.is_made || false,
            is_submitted: test.is_submitted || false,
            is_collected: test.is_collected || false,
            is_reviewed: test.is_reviewed || false,
            is_discussed: test.is_discussed || false,
            grades_adjusted: test.grades_adjusted || false,
            accommodations_submitted: test.accommodations_submitted || false,
            accommodations_collected: test.accommodations_collected || false,
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

  const filterAndSortTests = () => {
    let filtered = [...tests];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (test) =>
          test.title.toLowerCase().includes(query) ||
          test.class_name.toLowerCase().includes(query) ||
          test.subject.toLowerCase().includes(query)
      );
    }

    if (classFilter) {
      filtered = filtered.filter((test) => test.class_name === classFilter);
    }

    if (subjectFilter) {
      const q = subjectFilter.toLowerCase();
      filtered = filtered.filter((test) => test.subject.toLowerCase().includes(q));
    }

    if (dateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((test) => new Date(test.scheduled_date) >= today);
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'scheduled_date') {
        aValue = new Date(a.scheduled_date).getTime();
        bValue = new Date(b.scheduled_date).getTime();
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTests(filtered);
  };

  const handleSort = (field: 'scheduled_date' | 'title') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteTest = async (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Weet je zeker dat je deze toets wilt verwijderen?')) {
      return;
    }

    try {
      await supabase.from('tests').update({ is_deleted: true }).eq('id', testId);
      loadTests();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const handleArchiveTest = async (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from('tests').update({ is_archived: true }).eq('id', testId);
      loadTests();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error archiving test:', error);
    }
  };

  const handleDuplicateTest = async (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: originalTest } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (originalTest) {
        const { id, created_at, ...testData } = originalTest;
        await supabase.from('tests').insert({
          ...testData,
          title: `${testData.title} (kopie)`,
        });
        loadTests();
        setOpenMenuId(null);
      }
    } catch (error) {
      console.error('Error duplicating test:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

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

  const uniqueClasses = Array.from(new Set(tests.map((t) => t.class_name))).sort();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-900">Alle Toetsen</h2>

        <div className="flex items-center gap-2 ml-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-sm outline-none bg-white border border-gray-300 rounded-lg px-3 py-2 font-medium text-gray-700 cursor-pointer focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="">Alle Klassen</option>
            {uniqueClasses.map((className) => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          placeholder="Filter op vak..."
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-44"
        />

        <button
          onClick={() => setDateFilter(!dateFilter)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${
            dateFilter
              ? 'bg-sky-600 border-sky-600 text-white hover:bg-sky-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Vandaag</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 w-12">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th
                onClick={() => handleSort('title')}
                className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:text-gray-900 transition"
              >
                Titel {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Klas
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Vak
              </th>
              <th
                onClick={() => handleSort('scheduled_date')}
                className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:text-gray-900 transition"
              >
                <div className="flex items-center gap-1">
                  Gepland Op
                  {sortField === 'scheduled_date' && (
                    <span className="text-sky-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Leerlingen
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Voortgang
              </th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-gray-500 text-sm">
                  Geen toetsen gevonden
                </td>
              </tr>
            ) : (
              filteredTests.map((test) => (
                <tr
                  key={test.id}
                  onClick={() => onTestClick(test.id)}
                  className="hover:bg-sky-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-5">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-semibold text-gray-900 text-base">{test.title}</div>
                  </td>
                  <td className="px-6 py-5 text-gray-700 text-sm">{test.class_name}</td>
                  <td className="px-6 py-5 text-gray-600 text-sm">{test.subject}</td>
                  <td className="px-6 py-5 text-gray-700 text-sm font-medium">{formatDate(test.scheduled_date)}</td>
                  <td className="px-6 py-5">
                    {test.student_count > 0 ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{test.student_count}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 w-32 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-500 to-sky-600 h-full transition-all duration-300"
                          style={{
                            width: `${
                              (() => {
                                const completed = [
                                  test.is_made,
                                  test.is_submitted,
                                  test.is_collected,
                                  test.is_reviewed,
                                  test.is_discussed,
                                  test.grades_adjusted,
                                  test.accommodations_submitted,
                                  test.accommodations_collected,
                                ].filter(Boolean).length;
                                return (completed / 8) * 100;
                              })()
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700 font-semibold whitespace-nowrap min-w-[2.5rem]">
                        {
                          [
                            test.is_made,
                            test.is_submitted,
                            test.is_collected,
                            test.is_reviewed,
                            test.is_discussed,
                            test.grades_adjusted,
                            test.accommodations_submitted,
                            test.accommodations_collected,
                          ].filter(Boolean).length
                        }
                        /8
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="relative flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === test.id ? null : test.id);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTest(test.id, e)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {openMenuId === test.id && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTestClick(test.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-900 flex items-center gap-3 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="font-medium">Details bekijken</span>
                          </button>
                          <button
                            onClick={(e) => handleDuplicateTest(test.id, e)}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-900 flex items-center gap-3 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            <span className="font-medium">Dupliceren</span>
                          </button>
                          <button
                            onClick={(e) => handleArchiveTest(test.id, e)}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-900 flex items-center gap-3 transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                            <span className="font-medium">Archiveren</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
