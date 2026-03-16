import { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, AlertCircle, Search, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportedTest {
  toetsnaam: string;
  datum: string;
  tijd?: string;
  minuten?: number;
  lokaal?: string;
  surveillant?: string;
  lln?: number;
  selected: boolean;
}

interface Class {
  id: string;
  name: string;
  subject: string;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workbookRef = useRef<XLSX.WorkBook | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classMode, setClassMode] = useState<'existing' | 'new' | 'per-test'>('per-test');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [importedTests, setImportedTests] = useState<ImportedTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbookRef.current && sheetName) {
      loadSheetData(workbookRef.current, sheetName);
    }
  };

  const loadSheetData = (workbook: XLSX.WorkBook, sheetName: string) => {
    try {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
      const tests: ImportedTest[] = jsonData.map((row) => ({
        toetsnaam: String(row.TOETSNAAM || row.toetsnaam || row.Toetsnaam || ''),
        datum: String(row.DATUM || row.datum || row.Datum || ''),
        tijd: row.TIJD || row.tijd || row.Tijd ? String(row.TIJD || row.tijd || row.Tijd) : '',
        minuten: row.MINUTEN || row.minuten || row.Minuten || 0,
        lokaal: row.LOKAAL || row.lokaal || row.Lokaal ? String(row.LOKAAL || row.lokaal || row.Lokaal) : '',
        surveillant: row.SURVEILLANT || row.surveillant || row.Surveillant ? String(row.SURVEILLANT || row.surveillant || row.Surveillant) : '',
        lln: parseInt(row.LLN || row.lln || row.Lln || row['lln'] || 0) || 0,
        selected: false,
      }));
      const filtered = tests.filter((t) => t.toetsnaam && t.datum);
      setImportedTests(filtered);
    } catch {
      setError('Fout bij het verwerken van het tabblad. Controleer het formaat.');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          workbookRef.current = workbook;
          setAvailableSheets(workbook.SheetNames);
          if (workbook.SheetNames.length > 0) {
            const firstSheet = workbook.SheetNames[0];
            setSelectedSheet(firstSheet);
            loadSheetData(workbook, firstSheet);
          }
          setStep('preview');
        } catch {
          setError('Fout bij het verwerken van het bestand. Controleer het formaat.');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Fout bij het lezen van het bestand');
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch {
      setError('Er is een fout opgetreden bij het importeren');
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileSelect({ target: input } as any);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const deriveClassName = (tests: ImportedTest[]): string => {
    const selected = tests.filter((t) => t.selected);
    if (selected.length === 0) return '';
    const names = selected.map((t) => t.toetsnaam);
    const firstParts = names.map((n) => n.split('_')[0]);
    const unique = [...new Set(firstParts)];
    if (unique.length === 1) return unique[0];
    const allParts = names.map((n) => n.split('_'));
    const minLen = Math.min(...allParts.map((p) => p.length));
    const common: string[] = [];
    for (let i = 0; i < minLen; i++) {
      const part = allParts[0][i];
      if (allParts.every((p) => p[i] === part)) {
        common.push(part);
      } else {
        break;
      }
    }
    return common.length > 0 ? common.join('_') : unique.join(', ');
  };

  const toggleTestSelection = (index: number) => {
    const updated = importedTests.map((test, i) =>
      i === index ? { ...test, selected: !test.selected } : test
    );
    setImportedTests(updated);
    if (classMode === 'new') setNewClassName(deriveClassName(updated));
  };

  const toggleAllFiltered = () => {
    const filteredIndexes = new Set(
      filteredTests.map((t) => importedTests.indexOf(t))
    );
    const allFilteredSelected = filteredTests.every((t) => t.selected);
    const updated = importedTests.map((test, i) =>
      filteredIndexes.has(i) ? { ...test, selected: !allFilteredSelected } : test
    );
    setImportedTests(updated);
    if (classMode === 'new') setNewClassName(deriveClassName(updated));
  };

  const parseScheduledDate = (datum: string, tijd?: string): string => {
    try {
      let parsedDate: Date;
      const dateParts = datum.split('-');
      if (dateParts.length === 3 && dateParts[0].length === 2) {
        parsedDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      } else if (/^\d+$/.test(datum)) {
        const excelEpoch = new Date(1899, 11, 30);
        parsedDate = new Date(excelEpoch.getTime() + parseInt(datum) * 86400000);
      } else {
        parsedDate = new Date(datum);
      }
      if (isNaN(parsedDate.getTime())) throw new Error('Invalid date');
      if (tijd) {
        const timeParts = tijd.split(':');
        if (timeParts.length >= 2) {
          parsedDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
        }
      }
      return parsedDate.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const handleImport = async () => {
    if (!user) return;

    const selectedTests = importedTests.filter((t) => t.selected);
    if (selectedTests.length === 0) {
      setError('Selecteer minimaal één toets om te importeren');
      return;
    }

    if (classMode === 'existing' && !selectedClassId) {
      setError('Selecteer een bestaande klas');
      return;
    }

    if (classMode === 'new' && !newClassName.trim()) {
      setError('Voer een klasnaam in');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentYear = new Date().getFullYear();
      const schoolYear = `${currentYear}-${currentYear + 1}`;
      const subjectValue = newClassSubject.trim();

      if (classMode === 'per-test') {
        for (const test of selectedTests) {
          const className = test.toetsnaam;
          let classId: string;
          const existing = classes.find((c) => c.name === className);
          if (existing) {
            classId = existing.id;
          } else {
            const { data: newClass, error: classError } = await supabase
              .from('classes')
              .insert({
                user_id: user.id,
                name: className,
                subject: subjectValue || className,
                school_year: schoolYear,
              })
              .select('id')
              .single();
            if (classError) throw classError;
            classId = newClass.id;
          }
          const { error: insertError } = await supabase.from('tests').insert({
            user_id: user.id,
            class_id: classId,
            title: test.toetsnaam,
            subject: subjectValue || className,
            scheduled_date: parseScheduledDate(test.datum, test.tijd),
            supervisor: test.surveillant || null,
            location: test.lokaal || null,
            description: test.minuten ? `Duur: ${test.minuten} minuten` : null,
            student_count: test.lln || 0,
            lesson_hour: test.tijd || '',
          });
          if (insertError) throw insertError;
        }
      } else {
        let classId: string;

        if (classMode === 'existing') {
          classId = selectedClassId;
        } else {
          const { data: newClass, error: classError } = await supabase
            .from('classes')
            .insert({
              user_id: user.id,
              name: newClassName.trim(),
              subject: subjectValue || newClassName.trim(),
              school_year: schoolYear,
            })
            .select('id')
            .single();
          if (classError) throw classError;
          classId = newClass.id;
        }

        const selectedClassData = classes.find((c) => c.id === classId);
        const subject = classMode === 'new'
          ? (subjectValue || newClassName.trim())
          : (selectedClassData?.subject || '');

        const testsToInsert = selectedTests.map((test) => ({
          user_id: user.id,
          class_id: classId,
          title: test.toetsnaam,
          subject,
          scheduled_date: parseScheduledDate(test.datum, test.tijd),
          supervisor: test.surveillant || null,
          location: test.lokaal || null,
          description: test.minuten ? `Duur: ${test.minuten} minuten` : null,
          student_count: test.lln || 0,
          lesson_hour: test.tijd || '',
        }));

        const { error: insertError } = await supabase.from('tests').insert(testsToInsert);
        if (insertError) throw insertError;
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het importeren');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImportedTests([]);
    setSelectedClassId('');
    setNewClassName('');
    setNewClassSubject('');
    setAvailableSheets([]);
    setSelectedSheet('');
    setSearchQuery('');
    setClassMode('per-test');
    workbookRef.current = null;
    setStep('upload');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const selectedCount = importedTests.filter((t) => t.selected).length;

  const filteredTests = importedTests.filter((test) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      String(test.toetsnaam).toLowerCase().includes(query) ||
      String(test.datum).toLowerCase().includes(query) ||
      (test.tijd ? String(test.tijd).toLowerCase().includes(query) : false) ||
      (test.lokaal ? String(test.lokaal).toLowerCase().includes(query) : false) ||
      (test.surveillant ? String(test.surveillant).toLowerCase().includes(query) : false)
    );
  });

  const allFilteredSelected = filteredTests.length > 0 && filteredTests.every((t) => t.selected);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Toetsen Importeren">
      <div className="space-y-4">
        {step === 'upload' && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-sky-400 transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                Sleep uw bestand hierheen of klik om te selecteren
              </p>
              <p className="text-sm text-gray-500">
                Ondersteunde formaten: .xlsx, .xls, .csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="space-y-4">
              {availableSheets.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kies een tabblad
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition bg-white"
                  >
                    {availableSheets.map((sheetName) => (
                      <option key={sheetName} value={sheetName}>{sheetName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  Importeren naar klas
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClassMode('per-test')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${
                      classMode === 'per-test'
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Per toets
                  </button>
                  <button
                    onClick={() => setClassMode('existing')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${
                      classMode === 'existing'
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Bestaande klas
                  </button>
                  <button
                    onClick={() => {
                      setClassMode('new');
                      setNewClassName(deriveClassName(importedTests));
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${
                      classMode === 'new'
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Nieuwe klas
                  </button>
                </div>

                {classMode === 'per-test' && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Elke toets krijgt een eigen klas met de toetsnaam als klasnaam.
                    </p>
                    <input
                      type="text"
                      value={newClassSubject}
                      onChange={(e) => setNewClassSubject(e.target.value)}
                      placeholder="Vak (optioneel)"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm"
                    />
                  </div>
                )}

                {classMode === 'existing' && (
                  <div className="relative">
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white appearance-none pr-10"
                    >
                      <option value="">Kies een klas...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}

                {classMode === 'new' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Klasnaam (verplicht)"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newClassSubject}
                        onChange={(e) => setNewClassSubject(e.target.value)}
                        placeholder="Vak (optioneel)"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zoek toetsen..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  />
                </div>
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  {selectedCount} van de {importedTests.length} geselecteerd
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleAllFiltered}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">TOETSNAAM</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">DATUM</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">TIJD</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">MINUTEN</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">LOKAAL</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">SURVEILLANT</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">LLN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTests.length === 0 && searchQuery ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          Geen toetsen gevonden die overeenkomen met "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredTests.map((test) => {
                        const originalIndex = importedTests.indexOf(test);
                        return (
                          <tr key={originalIndex} className={test.selected ? 'bg-white' : 'bg-gray-50 opacity-50'}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={test.selected}
                                onChange={() => toggleTestSelection(originalIndex)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{test.toetsnaam}</td>
                            <td className="px-4 py-3 text-gray-600">{test.datum}</td>
                            <td className="px-4 py-3 text-gray-600">{test.tijd || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{test.minuten || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{test.lokaal || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{test.surveillant || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{test.lln || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Ander bestand
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Annuleren
              </button>
              <button
                onClick={handleImport}
                disabled={loading || selectedCount === 0}
                className="px-6 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition disabled:opacity-50"
              >
                {loading ? 'Bezig...' : `Importeer ${selectedCount} Toetsen`}
              </button>
            </div>
          </>
        )}

        {step === 'upload' && loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Bestand verwerken...</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
