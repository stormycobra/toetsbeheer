import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NewTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Class {
  id: string;
  name: string;
  subject: string;
}

export function NewTestModal({ isOpen, onClose, onSuccess }: NewTestModalProps) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [description, setDescription] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadClasses();
    }
  }, [isOpen, user]);

  const loadClasses = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('classes')
      .select('id, name, subject')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('name');

    setClasses(data || []);
  };

  const handleClassChange = (selectedClassId: string) => {
    setClassId(selectedClassId);
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (selectedClass) {
      setSubject(selectedClass.subject);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      let resolvedClassId = classId;

      if (!resolvedClassId) {
        const currentYear = new Date().getFullYear();
        const schoolYear = `${currentYear}-${currentYear + 1}`;

        const { data: newClass, error: classError } = await supabase
          .from('classes')
          .insert({
            user_id: user.id,
            name: title,
            subject: subject || title,
            school_year: schoolYear,
          })
          .select('id')
          .single();

        if (classError) throw classError;
        resolvedClassId = newClass.id;
        await loadClasses();
      }

      const { error: insertError } = await supabase.from('tests').insert({
        user_id: user.id,
        class_id: resolvedClassId,
        title,
        subject,
        scheduled_date: scheduledDateTime,
        description: description || null,
        supervisor: supervisor || null,
        location: location || null,
      });

      if (insertError) throw insertError;

      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', resolvedClassId);

      if (students && students.length > 0) {
        const { data: newTest } = await supabase
          .from('tests')
          .select('id')
          .eq('user_id', user.id)
          .eq('class_id', classId)
          .eq('title', title)
          .single();

        if (newTest) {
          const gradeEntries = students.map((student) => ({
            test_id: newTest.id,
            student_id: student.id,
            user_id: user.id,
            is_graded: false,
          }));

          await supabase.from('grades').insert(gradeEntries);
        }
      }

      setTitle('');
      setClassId('');
      setSubject('');
      setScheduledDate('');
      setScheduledTime('');
      setDescription('');
      setSupervisor('');
      setLocation('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nieuwe Toets">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titel *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="bijv. Proefwerk Hoofdstuk 5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
            Klas
          </label>
          <select
            id="class"
            value={classId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
          >
            <option value="">Automatisch aanmaken op basis van toetsnaam</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.subject}
              </option>
            ))}
          </select>
          {!classId && (
            <p className="mt-1 text-xs text-gray-500">
              Er wordt automatisch een klas aangemaakt met de toetsnaam als klasnaam.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Vak *
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="bijv. Biologie, Frans"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Datum *
            </label>
            <input
              id="date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Tijd *
            </label>
            <input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="supervisor" className="block text-sm font-medium text-gray-700 mb-1">
              Surveillant
            </label>
            <input
              id="supervisor"
              type="text"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              placeholder="bijv. tvd1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Lokaal
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="bijv. e307"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Beschrijving
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optionele notities over deze toets"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Toets Aanmaken'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
