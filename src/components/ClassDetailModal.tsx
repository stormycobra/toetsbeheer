import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Trash2, Archive } from 'lucide-react';

interface ClassDetailModalProps {
  classId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface ClassDetail {
  id: string;
  name: string;
  subject: string;
  school_year: string;
  is_archived: boolean;
}

interface Student {
  id: string;
  name: string;
  student_number: string | null;
}

export function ClassDetailModal({ classId, isOpen, onClose, onRefresh }: ClassDetailModalProps) {
  const { user } = useAuth();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    if (isOpen && classId && user) {
      loadClassDetails();
    }
  }, [isOpen, classId, user]);

  const loadClassDetails = async () => {
    if (!classId || !user) return;

    setLoading(true);
    try {
      const { data: cls } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (cls) {
        setClassData(cls);
      }

      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('name');

      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error loading class details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !user || !newStudentName.trim()) return;

    setAddingStudent(true);
    try {
      const { data: newStudent, error } = await supabase
        .from('students')
        .insert({
          class_id: classId,
          user_id: user.id,
          name: newStudentName.trim(),
          student_number: newStudentNumber.trim() || null,
        })
        .select()
        .single();

      if (!error && newStudent) {
        setStudents([...students, newStudent]);
        setNewStudentName('');
        setNewStudentNumber('');
      }
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setAddingStudent(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Weet je zeker dat je deze leerling wilt verwijderen?')) {
      return;
    }

    try {
      await supabase.from('students').delete().eq('id', studentId);
      setStudents(students.filter((s) => s.id !== studentId));
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleArchiveClass = async () => {
    if (!classId || !classData) return;

    const action = classData.is_archived ? 'herstellen' : 'archiveren';
    if (!confirm(`Weet je zeker dat je deze klas wilt ${action}?`)) {
      return;
    }

    try {
      await supabase
        .from('classes')
        .update({ is_archived: !classData.is_archived })
        .eq('id', classId);

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error archiving class:', error);
    }
  };

  if (!isOpen || !classId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Klas Details">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      ) : classData ? (
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{classData.name}</h3>
                <p className="text-sm text-gray-600">
                  {classData.subject} - {classData.school_year}
                </p>
              </div>
              <button
                onClick={handleArchiveClass}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <Archive className="w-4 h-4" />
                <span>{classData.is_archived ? 'Herstellen' : 'Archiveren'}</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Leerlingen ({students.length})
            </h4>

            <form onSubmit={handleAddStudent} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Naam leerling"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                />
                <input
                  type="text"
                  value={newStudentNumber}
                  onChange={(e) => setNewStudentNumber(e.target.value)}
                  placeholder="Leerlingnummer (optioneel)"
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  disabled={addingStudent || !newStudentName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Toevoegen</span>
                </button>
              </div>
            </form>

            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Geen leerlingen in deze klas
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      {student.student_number && (
                        <p className="text-sm text-gray-500">#{student.student_number}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Sluiten
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Klas niet gevonden
        </div>
      )}
    </Modal>
  );
}
