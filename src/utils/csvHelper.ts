/**
 * CSV Helper Utilities for Storyboard Import
 */

/**
 * Parse CSV text into headers and data rows
 * Handles quoted fields with commas and escaped quotes
 */
export const parseCsvData = (
  csvText: string
): { headers: string[]; data: Record<string, string>[] } => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const normalizedText = csvText.replace(/\r\n/g, "\n").trim();

  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < normalizedText.length && normalizedText[i + 1] === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      // Not in quotes
      if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else if (char === '"' && currentField.trim() === "") {
        currentField = "";
        inQuotes = true;
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length < 2) {
    throw new Error("CSV must have a header and at least one data row.");
  }

  const headers = rows[0].map((h) => h.trim());

  const data = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((rowValues) => {
      return headers.reduce(
        (obj, header, index) => {
          if (header) {
            obj[header] = rowValues[index] || "";
          }
          return obj;
        },
        {} as Record<string, string>
      );
    });

  return { headers: headers.filter(Boolean), data };
};

/**
 * Convert column letter (A, B, ..., Z, AA, AB, ...) to 0-based index
 * Example: A -> 0, B -> 1, Z -> 25, AA -> 26
 */
export const colLetterToIndex = (col: string): number => {
  const letters = col.toUpperCase();
  let value = 0;
  for (let i = 0; i < letters.length; i++) {
    value = value * 26 + (letters.charCodeAt(i) - "A".charCodeAt(0) + 1);
  }
  return value - 1; // Return 0-based index
};

/**
 * Parse a cell reference like "H2" into column index and row number
 */
export const parseCellReference = (
  cell: string
): { colIndex: number; row: number } | null => {
  const match = cell.trim().match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  return {
    colIndex: colLetterToIndex(match[1]),
    row: parseInt(match[2], 10),
  };
};

/**
 * Escape a cell value for CSV export
 */
export const escapeCsvCell = (
  cellData: string | number | null | undefined
): string => {
  if (cellData === null || cellData === undefined) {
    return "";
  }
  let cell = String(cellData);
  cell = cell.replace(/(\r\n|\n|\r)/gm, " ");
  if (cell.includes(",") || cell.includes('"')) {
    cell = '"' + cell.replace(/"/g, '""') + '"';
  }
  return cell;
};