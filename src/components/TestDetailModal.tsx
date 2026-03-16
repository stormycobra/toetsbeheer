import { useEffect, useState, useRef } from 'react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateCoverSheet } from '../lib/generateCoverSheet';
import {
  BookOpen, ArrowRight, ArrowLeft, CheckCircle, MessageSquare,
  File as FileEdit, Paperclip, Wrench, Download, Trash2, FileText,
  User, MapPin, Users, Pencil, Check,
} from 'lucide-react';

interface TestDetailModalProps {
  testId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface TestDetail {
  id: string;
  title: string;
  class_id: string;
  class_name: string;
  subject: string;
  scheduled_date: string;
  description: string | null;
  status: string;
  is_made: boolean;
  is_submitted: boolean;
  is_collected: boolean;
  is_reviewed: boolean;
  is_discussed: boolean;
  grades_adjusted: boolean;
  accommodations_submitted: boolean;
  accommodations_collected: boolean;
  notes: string;
  supervisor: string | null;
  location: string | null;
  lesson_hour: string;
  student_count: number;
  test_made_on: string;
  allowed_tools: string;
  pre_remarks: string;
  submit_to: string;
}

export function TestDetailModal({ testId, isOpen, onClose, onRefresh }: TestDetailModalProps) {
  const { user } = useAuth();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingCover, setEditingCover] = useState(false);
  const [coverDraft, setCoverDraft] = useState({
    lesson_hour: '',
    student_count: 0,
    test_made_on: '',
    allowed_tools: '',
    pre_remarks: '',
    submit_to: '',
  });
  const [savingCover, setSavingCover] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen && testId && user) {
      loadTestDetails();
    }
  }, [isOpen, testId, user]);

  const loadTestDetails = async () => {
    if (!testId || !user) return;
    setLoading(true);
    try {
      const { data: testData } = await supabase
        .from('tests')
        .select('*, classes(name)')
        .eq('id', testId)
        .single();

      if (testData) {
        const detail: TestDetail = {
          id: testData.id,
          title: testData.title,
          class_id: testData.class_id,
          class_name: (testData.classes as any)?.name || '',
          subject: testData.subject,
          scheduled_date: testData.scheduled_date,
          description: testData.description,
          status: testData.status,
          is_made: testData.is_made || false,
          is_submitted: testData.is_submitted || false,
          is_collected: testData.is_collected || false,
          is_reviewed: testData.is_reviewed || false,
          is_discussed: testData.is_discussed || false,
          grades_adjusted: testData.grades_adjusted || false,
          accommodations_submitted: testData.accommodations_submitted || false,
          accommodations_collected: testData.accommodations_collected || false,
          notes: testData.notes || '',
          supervisor: testData.supervisor || null,
          location: testData.location || null,
          lesson_hour: testData.lesson_hour || '',
          student_count: testData.student_count || 0,
          test_made_on: testData.test_made_on || '',
          allowed_tools: testData.allowed_tools || '',
          pre_remarks: testData.pre_remarks || '',
          submit_to: testData.submit_to || '',
        };
        setTest(detail);
        setNotes(detail.notes);
        setCoverDraft({
          lesson_hour: detail.lesson_hour,
          student_count: detail.student_count,
          test_made_on: detail.test_made_on,
          allowed_tools: detail.allowed_tools,
          pre_remarks: detail.pre_remarks,
          submit_to: detail.submit_to,
        });
      }
    } catch (error) {
      console.error('Error loading test details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (field: keyof TestDetail, label: string) => {
    if (!test || !testId) return;
    const newValue = !test[field];
    try {
      await supabase.from('tests').update({ [field]: newValue }).eq('id', testId);
      setTest({ ...test, [field]: newValue });
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      setSavingNotes(true);
      try {
        await supabase.from('tests').update({ notes: value }).eq('id', testId);
        if (test) setTest({ ...test, notes: value });
        onRefresh();
      } catch (error) {
        console.error('Error saving notes:', error);
      } finally {
        setSavingNotes(false);
      }
    }, 800);
  };

  const handleSaveCover = async () => {
    if (!testId) return;
    setSavingCover(true);
    try {
      await supabase.from('tests').update(coverDraft).eq('id', testId);
      if (test) setTest({ ...test, ...coverDraft });
      setEditingCover(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving cover sheet:', error);
    } finally {
      setSavingCover(false);
    }
  };

  const handleDownload = async () => {
    if (!test) return;
    await generateCoverSheet({
      subject: test.subject,
      scheduled_date: test.scheduled_date,
      lesson_hour: test.lesson_hour,
      location: test.location,
      class_name: test.class_name,
      supervisor: test.supervisor,
      student_count: test.student_count,
      test_made_on: test.test_made_on,
      allowed_tools: test.allowed_tools,
      pre_remarks: test.pre_remarks,
      submit_to: test.submit_to,
      title: test.title,
    });
  };

  const handleDeleteTest = async () => {
    if (!testId || !confirm('Weet je zeker dat je deze toets wilt verwijderen?')) return;
    try {
      await supabase.from('tests').update({ is_deleted: true }).eq('id', testId);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error deleting test:', error);
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

  const getCompletedCount = () => {
    if (!test) return 0;
    return [
      test.is_made, test.is_submitted, test.is_collected,
      test.is_reviewed, test.is_discussed, test.grades_adjusted,
      test.accommodations_submitted, test.accommodations_collected,
    ].filter(Boolean).length;
  };

  if (!isOpen || !testId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      ) : test ? (
        <div className="space-y-5">
          <div>
            <p className="text-sm text-sky-600 font-medium mb-1">
              {test.class_name} - {test.subject}
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{test.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>{formatDate(test.scheduled_date)}</span>
              {test.supervisor && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{test.supervisor}</span>
                </div>
              )}
              {test.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{test.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{test.student_count > 0 ? test.student_count : '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Voortgang</span>
              <span className="text-sm font-semibold text-gray-900">{getCompletedCount()}/8</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-sky-600 h-full transition-all duration-300"
                style={{ width: `${(getCompletedCount() / 8) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              STATUS
            </h4>
            <div className="space-y-1">
              <StatusToggle icon={<BookOpen className="w-4 h-4" />} label="Gemaakt" checked={test.is_made} onChange={() => handleToggleStatus('is_made', 'Gemaakt')} />
              <StatusToggle icon={<ArrowRight className="w-4 h-4" />} label="Ingeleverd" checked={test.is_submitted} onChange={() => handleToggleStatus('is_submitted', 'Ingeleverd')} />
              <StatusToggle icon={<ArrowLeft className="w-4 h-4" />} label="Opgehaald" checked={test.is_collected} onChange={() => handleToggleStatus('is_collected', 'Opgehaald')} />
              <StatusToggle icon={<CheckCircle className="w-4 h-4" />} label="Nagekeken" checked={test.is_reviewed} onChange={() => handleToggleStatus('is_reviewed', 'Nagekeken')} />
              <StatusToggle icon={<MessageSquare className="w-4 h-4" />} label="Besproken" checked={test.is_discussed} onChange={() => handleToggleStatus('is_discussed', 'Besproken')} />
              <StatusToggle icon={<FileEdit className="w-4 h-4" />} label="Cijfers Aangepast" checked={test.grades_adjusted} onChange={() => handleToggleStatus('grades_adjusted', 'Cijfers Aangepast')} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              FACILITEITEN
            </h4>
            <div className="space-y-1">
              <StatusToggle icon={<Paperclip className="w-4 h-4" />} label="Faciliteiten Ingeleverd" checked={test.accommodations_submitted} onChange={() => handleToggleStatus('accommodations_submitted', 'Faciliteiten Ingeleverd')} />
              <StatusToggle icon={<Wrench className="w-4 h-4" />} label="Faciliteiten Opgehaald" checked={test.accommodations_collected} onChange={() => handleToggleStatus('accommodations_collected', 'Faciliteiten Opgehaald')} />
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  VOORBLAD INFORMATIE
                </span>
              </div>
              {!editingCover ? (
                <button
                  onClick={() => setEditingCover(true)}
                  className="p-1.5 rounded hover:bg-gray-200 transition text-gray-500 hover:text-gray-700"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSaveCover}
                  disabled={savingCover}
                  className="p-1.5 rounded hover:bg-green-100 transition text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="p-4 space-y-4 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <CoverField
                  label="Lesuur"
                  placeholder="bijv. 3e uur"
                  value={editingCover ? coverDraft.lesson_hour : test.lesson_hour}
                  editing={editingCover}
                  onChange={(v) => setCoverDraft({ ...coverDraft, lesson_hour: v })}
                />
                <CoverField
                  label="Aantal Leerlingen"
                  placeholder="0"
                  value={editingCover ? String(coverDraft.student_count || '') : String(test.student_count || '')}
                  editing={editingCover}
                  onChange={(v) => setCoverDraft({ ...coverDraft, student_count: parseInt(v) || 0 })}
                />
              </div>

              <CoverField
                label="De toets wordt gemaakt op"
                placeholder={test.class_name}
                value={editingCover ? coverDraft.test_made_on : test.test_made_on}
                editing={editingCover}
                onChange={(v) => setCoverDraft({ ...coverDraft, test_made_on: v })}
              />

              <CoverField
                label="Toegestane Hulpmiddelen"
                placeholder="bijv. Rekenmachine, Woordenboek"
                value={editingCover ? coverDraft.allowed_tools : test.allowed_tools}
                editing={editingCover}
                onChange={(v) => setCoverDraft({ ...coverDraft, allowed_tools: v })}
              />

              <CoverField
                label="Opmerkingen Vooraf"
                placeholder="bijv. Geen telefoons op tafel"
                value={editingCover ? coverDraft.pre_remarks : test.pre_remarks}
                editing={editingCover}
                onChange={(v) => setCoverDraft({ ...coverDraft, pre_remarks: v })}
              />

              <CoverField
                label="Inleveren in postvak van"
                placeholder="Naam docent"
                value={editingCover ? coverDraft.submit_to : test.submit_to}
                editing={editingCover}
                onChange={(v) => setCoverDraft({ ...coverDraft, submit_to: v })}
              />

              <button
                onClick={handleDownload}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition text-sm"
              >
                <FileText className="w-4 h-4" />
                Download Voorblad (Word)
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              NOTITIES
              {savingNotes && <span className="text-xs text-gray-400 font-normal normal-case ml-1">Opslaan...</span>}
            </h4>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Voeg hier uw notities toe..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none text-sm text-gray-700"
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <button
              onClick={handleDownload}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Downloaden
            </button>
            <button
              onClick={handleDeleteTest}
              className="px-4 py-2.5 bg-white border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Verwijderen
            </button>
            <button
              onClick={onClose}
              className="ml-auto px-6 py-2.5 bg-sky-600 rounded-xl text-sm font-medium text-white hover:bg-sky-700 transition"
            >
              Sluiten
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">Toets niet gevonden</div>
      )}
    </Modal>
  );
}

function StatusToggle({
  icon, label, checked, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white border border-gray-100 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${checked ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500'}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-sky-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function CoverField({
  label, placeholder, value, editing, onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-800"
        />
      ) : (
        <p className="text-sm text-gray-500">{value || placeholder}</p>
      )}
    </div>
  );
}
