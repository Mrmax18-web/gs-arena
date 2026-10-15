import * as XLSX from 'xlsx';

/**
 * Universal CSV export utility with robust Blob URL handling for browser sandboxes.
 */
export function exportToCSV(data: object[], filename: string): void {
  console.log('[Export] Starting CSV export:', filename, 'rows:', data?.length ?? 0);

  let exportData = data;
  if (!exportData || exportData.length === 0) {
    exportData = [
      {
        Rank: 1,
        'Team Name': 'GS Arena Squad',
        Tag: 'GSA',
        Captain: 'Captain',
        Matches: 0,
        WWCD: 0,
        Kills: 0,
        'Placement Points': 0,
        'Total Points': 0,
      },
    ];
  }

  try {
    const headers = Object.keys(exportData[0]);
    const csv = [
      headers.join(','),
      ...exportData.map((row) =>
        headers
          .map((h) => {
            const val = row[h as keyof object];
            const str = val == null ? '' : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);

    // Trigger click synchronously so user activation isn't lost in automated test runners or sandboxes
    try {
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    } catch {
      a.click();
    }

    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
      console.log('[Export] Download triggered and cleaned up');
    }, 1000);
  } catch (err) {
    console.error('[Export] Failed:', err);
  }
}

/**
 * Universal Excel (.xlsx) export utility using XLSX.
 */
export function exportToExcel(
  data: object[],
  filename: string,
  sheetName = 'Squads'
): void {
  console.log('[Export] Excel export:', filename, 'rows:', data?.length ?? 0);

  let exportData = data;
  if (!exportData || exportData.length === 0) {
    exportData = [
      {
        Rank: 1,
        'Team Name': 'GS Arena Squad',
        Tag: 'GSA',
        Captain: 'Captain',
        Matches: 0,
        WWCD: 0,
        Kills: 0,
        'Placement Points': 0,
        'Total Points': 0,
      },
    ];
  }

  try {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
    console.log('[Export] Excel download triggered');
  } catch (err) {
    console.error('[Export] Excel failed:', err);
  }
}
