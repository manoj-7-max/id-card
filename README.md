# ID Card Generator Pro

Professional offline desktop application for generating student, employee, and staff ID cards from Excel/CSV files and local photo folders.

## Features

- React + Electron + Vite desktop app with TypeScript.
- Fully offline processing: no cloud storage, no database server, no internet connection required.
- XLSX, XLS, and CSV import with SheetJS and editable column mapping.
- Local photo folder matching by `StudentID.jpg` or `AdmissionNo.jpg`.
- Canva-style template designer using `react-konva`.
- Front and back card designs saved as JSON templates.
- Dynamic placeholders such as `{{Name}}`, `{{Class}}`, `{{StudentID}}`, `{{Photo}}`, `{{QRCode}}`, and `{{Barcode}}`.
- Automatic QR code and Code128 barcode rendering.
- Single preview, grid preview, zoom, next/previous navigation, and missing-photo warnings.
- Batch generation for large record sets with progress and ETA.
- PDF export with single-card and A4 layouts: 2, 3, 6, or 8 cards per page.
- PNG/JPEG ZIP image export with local file naming.
- Reports for total records, matched photos, missing photos, generated cards, and CSV export.
- Settings for default export folder, default template, theme, language, auto-save, DPI, and PDF layout.
- Unicode-ready UI using local system font fallbacks for Noto Sans/Noto Sans Tamil.

## Project Structure

```text
src/
  components/
    common/
    designer/
    layout/
    preview/
    ui/
  contexts/
  hooks/
  pages/
  services/
  templates/
  utils/
  exports/
  assets/
electron/
  main.ts
  preload.ts
public/
  samples/
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Vite launches the Electron app through `vite-plugin-electron`.

## Build

```bash
npm run build
```

## Windows Installer

```bash
npm run dist
```

The `.exe` installer is created in `release/`.

## Sample Export Workflow

1. Open **Excel Import** and choose `public/samples/students-sample.csv` or an XLSX/XLS file.
2. Review the automatic column mapping and adjust if required.
3. Open **Photo Folder Import** and choose a folder containing images named like `ST001.jpg` or `ADM001.png`.
4. Open **Template Manager** and select the sample CR80 template.
5. Open **Template Designer** to adjust front/back layouts.
6. Open **Card Preview** to verify records, zoom, and missing photo warnings.
7. Open **Generate & Export**, choose PDF or image ZIP, and click **Generate Cards**.
8. Open **Reports** to export the production report as CSV.

## Sample Data

- CSV sample: `public/samples/students-sample.csv`
- XLSX sample: generated as `public/samples/students-sample.xlsx` by the setup script used in this workspace.
- Sample template: `src/templates/sampleTemplate.ts`

## Offline Notes

All file access goes through Electron IPC. Data files, photo folders, templates, settings, reports, image exports, and PDFs remain on the user's computer.
