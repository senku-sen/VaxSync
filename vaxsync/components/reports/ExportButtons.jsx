import { Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

export default function ExportButtons({ activeTab }) {
  const handleExportPDF = async () => {
    try {
      toast.loading("Generating PDF...");

      // Get the main content area
      const element = document.querySelector("main");
      if (!element) {
        toast.error("Could not find content to export");
        return;
      }

      // Create canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      const fileName = `Report_${activeTab}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.loading("Generating Excel...");

      // Get table data
      const tables = document.querySelectorAll("table");
      if (tables.length === 0) {
        toast.error("No tables found to export");
        return;
      }

      const workbook = XLSX.utils.book_new();

      // Add each table as a sheet
      tables.forEach((table, index) => {
        const ws = XLSX.utils.table_to_sheet(table);
        const sheetName = `Sheet${index + 1}`;
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      });

      const fileName = `Report_${activeTab}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Excel exported successfully");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel");
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportPDF}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        Export PDF
      </button>
      <button
        onClick={handleExportExcel}
        className="flex items-center gap-2 px-4 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3E6B4D] transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        Export Excel
      </button>
    </div>
  );
}
