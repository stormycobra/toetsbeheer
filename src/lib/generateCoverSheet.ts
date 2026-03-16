import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  TableLayoutType,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';

interface CoverSheetData {
  subject: string;
  scheduled_date: string;
  lesson_hour: string;
  location: string | null;
  class_name: string;
  supervisor: string | null;
  student_count: number;
  test_made_on: string;
  allowed_tools: string;
  pre_remarks: string;
  submit_to: string;
  title: string;
}

const border = {
  top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
};

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function labelValueRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        borders: noBorder,
        width: { size: 4000, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: label, size: 22 })] })],
      }),
      new TableCell({
        borders: noBorder,
        width: { size: 500, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: '=', size: 22 })] })],
      }),
      new TableCell({
        borders: noBorder,
        width: { size: 5000, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 22 })] })],
      }),
    ],
  });
}

function infoBox(label: string, value: string): Table {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: border,
            children: [
              new Paragraph({ children: [new TextRun({ text: label, size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: value || ' ', size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

function spacer(): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export async function generateCoverSheet(data: CoverSheetData): Promise<void> {
  const topTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      labelValueRow('Vak', data.subject),
      labelValueRow('Datum', formatDate(data.scheduled_date)),
      labelValueRow('Lesuur', data.lesson_hour),
      labelValueRow('Lokaal', data.location || ''),
      labelValueRow('Klas / Cluster', data.class_name),
      labelValueRow('Surveillant', data.supervisor || ''),
      new TableRow({
        children: [
          new TableCell({
            borders: noBorder,
            columnSpan: 3,
            children: [new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: noBorder,
            width: { size: 7000, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Totaal aantal leerlingen in deze klas / dit cluster', size: 22 })],
              }),
            ],
          }),
          new TableCell({
            borders: noBorder,
            width: { size: 500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: '=', size: 22 })] })],
          }),
          new TableCell({
            borders: noBorder,
            width: { size: 2000, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: data.student_count > 0 ? String(data.student_count) : '', size: 22 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: noBorder,
            columnSpan: 3,
            children: [new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] })],
          }),
        ],
      }),
    ],
  });

  const wrappedTopTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: border,
            children: [topTable],
          }),
        ],
      }),
    ],
  });

  const surveillantBox = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: border,
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Aantal leerlingen aanwezig:', size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Opmerkingen door surveillant:', size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: ' ', size: 22 })] }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Voorblad toetsweek', bold: true, size: 24 })],
            spacing: { after: 200 },
          }),
          wrappedTopTable,
          spacer(),
          infoBox('De toets moet worden gemaakt op:', data.test_made_on),
          spacer(),
          infoBox('Toegestane hulpmiddelen:', data.allowed_tools),
          spacer(),
          infoBox('Opmerkingen vooraf:', data.pre_remarks),
          spacer(),
          surveillantBox,
          spacer(),
          infoBox('Toetsen inleveren in postvak van:', data.submit_to),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `voorblad_${data.title.replace(/\s+/g, '_')}.docx`);
}
