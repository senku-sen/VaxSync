import { useEffect } from 'react';

/**
 * AutoGenerateMonthlyReports Component
 * Automatically generates monthly report records for the current month
 * if they don't already exist
 */
export default function AutoGenerateMonthlyReports() {
  useEffect(() => {
    const generateMonthlyReports = async () => {
      try {
        // Get current month in YYYY-MM-01 format
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

        console.log('Checking for monthly reports:', currentMonth);

        // Check if records already exist for this month
        const checkResponse = await fetch(`/api/MonthlyReports?month=${currentMonth}`);
        
        if (!checkResponse.ok) {
          console.error('Failed to check monthly reports. Status:', checkResponse.status);
          const errorText = await checkResponse.text();
          console.error('Response:', errorText);
          return;
        }

        const checkData = await checkResponse.json();

        if (checkData.count > 0) {
          console.log(`✅ Monthly reports already exist for ${currentMonth}:`, checkData.count, 'records');
          return;
        }

        console.log(`⏳ No monthly reports found for ${currentMonth}. Creating...`);

        // Generate records for current month
        const generateResponse = await fetch('/api/MonthlyReports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: currentMonth })
        });

        if (!generateResponse.ok) {
          console.error('Failed to generate monthly reports. Status:', generateResponse.status);
          const errorText = await generateResponse.text();
          console.error('Response:', errorText);
          return;
        }

        const generateData = await generateResponse.json();

        if (generateData.success) {
          console.log('✅ Monthly reports generated:', generateData.message);
        } else {
          console.error('❌ Failed to generate monthly reports:', generateData.error);
        }
      } catch (err) {
        console.error('Error in AutoGenerateMonthlyReports:', err);
      }
    };

    generateMonthlyReports();
  }, []);

  // This component doesn't render anything
  return null;
}
