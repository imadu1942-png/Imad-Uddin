/**
 * Export structured data as CSV file with UTF-8 BOM for perfect Bengali text display in Excel
 */
export function exportToCSV(
  filename: string,
  rows: Record<string, unknown>[],
  headers: { key: string; label: string }[]
): void {
  if (!rows || rows.length === 0) {
    alert('রপ্তানি করার মতো কোনো তথ্য নেই।');
    return;
  }

  const headerLine = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((row) => {
    return headers
      .map((h) => {
        const val = row[h.key];
        const stringVal = val === undefined || val === null ? '' : String(val);
        return `"${stringVal.replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  // \uFEFF is the UTF-8 Byte Order Mark (BOM) needed by Excel to interpret UTF-8
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrint(): void {
  window.print();
}
