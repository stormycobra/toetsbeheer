import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarTest {
  id: string;
  title: string;
  class_name: string;
  scheduled_date: string;
}

interface CalendarViewProps {
  onTestClick: (testId: string) => void;
}

export function CalendarView({ onTestClick }: CalendarViewProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tests, setTests] = useState<CalendarTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTests();
    }
  }, [user, currentDate]);

  const loadTests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: testsData } = await supabase
        .from('tests')
        .select('*, classes(name)')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .gte('scheduled_date', startOfMonth.toISOString())
        .lte('scheduled_date', endOfMonth.toISOString());

      const testsForCalendar = (testsData || []).map((test) => ({
        id: test.id,
        title: test.title,
        class_name: (test.classes as any)?.name || '',
        scheduled_date: test.scheduled_date,
      }));

      setTests(testsForCalendar);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getTestsForDay = (date: Date | null) => {
    if (!date) return [];

    return tests.filter((test) => {
      const testDate = new Date(test.scheduled_date);
      return (
        testDate.getDate() === date.getDate() &&
        testDate.getMonth() === date.getMonth() &&
        testDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(
    currentDate
  );

  const weekDays = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  const days = getDaysInMonth();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 capitalize">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="px-4 py-3 text-center font-medium text-gray-700 text-sm">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            const dayTests = getTestsForDay(date);
            const today = isToday(date);

            return (
              <div
                key={index}
                className={`min-h-32 border-r border-b border-gray-200 p-2 ${
                  !date ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                }`}
              >
                {date && (
                  <>
                    <div
                      className={`text-sm font-medium mb-2 ${
                        today
                          ? 'bg-sky-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                          : 'text-gray-700'
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayTests.map((test) => (
                        <div
                          key={test.id}
                          onClick={() => onTestClick(test.id)}
                          className="bg-sky-100 text-sky-900 text-xs px-2 py-1 rounded cursor-pointer hover:bg-sky-200 transition"
                        >
                          <div className="font-medium truncate">{test.title}</div>
                          <div className="text-sky-700 truncate">{test.class_name}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
