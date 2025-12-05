"use client";

export default function Step3ReviewSummary({ formData, isLoading }) {
  const getAdministeredDate = () => {
    if (formData.vaccineStatus === "fully_vaccinated") {
      if (formData.selectedVaccines.length > 0) {
        const dates = formData.selectedVaccines.map(
          (v) => new Date(v.vaccineDate)
        );
        const latestDate = new Date(Math.max(...dates));
        return latestDate.toLocaleDateString();
      }
    }
    return new Date().toLocaleDateString();
  };

  const getBeneficiaryRecords = () => {
    const records = [];

    if (formData.vaccineStatus === "not_vaccinated") {
      // Handle custom vaccines for missed sessions
      if (formData.missedSessions === true) {
        formData.selectedVaccines.forEach((vaccine) => {
          records.push({
            vaccine: vaccine.vaccineName,
            date: new Date(vaccine.vaccineDate).toLocaleDateString(),
            session: "Missed (No Session)",
            attended: "No",
            vaccinated: "No",
          });
        });
      }

      // Handle selected sessions (can be array or single object)
      const selectedSessions = Array.isArray(formData.selectedSession)
        ? formData.selectedSession
        : formData.selectedSession
        ? [formData.selectedSession]
        : [];

      selectedSessions.forEach((session) => {
        records.push({
          vaccine: session.vaccineName,
          date: new Date(session.sessionDate).toLocaleDateString(),
          session: session.barangayName,
          attended: "No",
          vaccinated: "No",
        });
      });
    } else if (formData.vaccineStatus === "partially_vaccinated") {
      // Custom vaccines for partially vaccinated
      formData.selectedVaccines.forEach((vaccine) => {
        records.push({
          vaccine: vaccine.vaccineName,
          date: new Date(vaccine.vaccineDate).toLocaleDateString(),
          session: "Custom (No Session)",
          attended: "Yes",
          vaccinated: "Yes",
        });
      });

      // Selected upcoming sessions (can be array or single object)
      const selectedSessions = Array.isArray(formData.selectedUpcomingSession)
        ? formData.selectedUpcomingSession
        : formData.selectedUpcomingSession
        ? [formData.selectedUpcomingSession]
        : [];

      selectedSessions.forEach((session) => {
        records.push({
          vaccine: session.vaccineName,
          date: new Date(session.sessionDate).toLocaleDateString(),
          session: session.barangayName,
          attended: "No",
          vaccinated: "No",
        });
      });
    } else if (formData.vaccineStatus === "fully_vaccinated") {
      // Custom vaccines for fully vaccinated
      formData.selectedVaccines.forEach((vaccine) => {
        records.push({
          vaccine: vaccine.vaccineName,
          date: new Date(vaccine.vaccineDate).toLocaleDateString(),
          session: "Custom (No Session)",
          attended: "Yes",
          vaccinated: "Yes",
        });
      });

      // Selected upcoming sessions (can be array or single object)
      const selectedSessions = Array.isArray(formData.selectedFullyVaccinatedSessions)
        ? formData.selectedFullyVaccinatedSessions
        : formData.selectedFullyVaccinatedSessions
        ? [formData.selectedFullyVaccinatedSessions]
        : [];

      selectedSessions.forEach((session) => {
        records.push({
          vaccine: session.vaccineName,
          date: new Date(session.sessionDate).toLocaleDateString(),
          session: session.barangayName,
          attended: "No",
          vaccinated: "No",
        });
      });
    }

    return records;
  };

  const beneficiaryRecords = getBeneficiaryRecords();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Review & Summary
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Please review the information before submitting
        </p>
      </div>

      {/* Section 1: Resident Information */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Resident Information</h4>
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Full Name</p>
            <p className="font-medium text-gray-900">
              {formData.name.toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Birthday</p>
            <p className="font-medium text-gray-900">
              {new Date(formData.birthday).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sex</p>
            <p className="font-medium text-gray-900">{formData.sex}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Barangay</p>
            <p className="font-medium text-gray-900">{formData.barangay}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Vaccine Status</p>
            <p className="font-medium text-gray-900 capitalize">
              {formData.vaccineStatus.replace(/_/g, " ")}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Administered Date</p>
            <p className="font-medium text-gray-900">{getAdministeredDate()}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Vaccine History */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Vaccine History</h4>

        {formData.vaccineStatus === "not_vaccinated" && (
          <div className="space-y-4">
            {formData.missedSessions === true && formData.selectedVaccines.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-semibold text-orange-900 mb-2">
                  Custom Vaccines (Missed Sessions):
                </p>
                <ul className="text-sm text-orange-900 space-y-1">
                  {formData.selectedVaccines.map((vaccine, index) => (
                    <li key={index}>
                      • {vaccine.vaccineName} -{" "}
                      {new Date(vaccine.vaccineDate).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {formData.selectedSession && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  {formData.missedSessions === false ? "Upcoming Sessions:" : "Past Sessions Missed:"}
                </p>
                {Array.isArray(formData.selectedSession) ? (
                  <ul className="text-sm text-blue-900 space-y-2">
                    {formData.selectedSession.map((session, index) => (
                      <li key={index} className="border-l-2 border-blue-300 pl-2">
                        <p>
                          <span className="font-semibold">Session:</span>{" "}
                          {session.barangayName}
                        </p>
                        <p>
                          <span className="font-semibold">Vaccine:</span>{" "}
                          {session.vaccineName}
                        </p>
                        <p>
                          <span className="font-semibold">Date:</span>{" "}
                          {new Date(session.sessionDate).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Session:</span>{" "}
                      {formData.selectedSession.barangayName}
                    </p>
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Vaccine:</span>{" "}
                      {formData.selectedSession.vaccineName}
                    </p>
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Date:</span>{" "}
                      {new Date(formData.selectedSession.sessionDate).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {(formData.vaccineStatus === "partially_vaccinated" ||
          formData.vaccineStatus === "fully_vaccinated") && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900">
                    Vaccine
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.selectedVaccines.map((vaccine, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 px-3 capitalize">{vaccine.vaccineName}</td>
                    <td className="py-2 px-3">
                      {new Date(vaccine.vaccineDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Session Beneficiaries Preview */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">
          Session Beneficiaries Preview
        </h4>
        <p className="text-sm text-gray-600">
          The following records will be created:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-gray-900">
                  Vaccine
                </th>
                <th className="text-left py-2 px-3 font-semibold text-gray-900">
                  Date
                </th>
                <th className="text-left py-2 px-3 font-semibold text-gray-900">
                  Session
                </th>
                <th className="text-center py-2 px-3 font-semibold text-gray-900">
                  Attended
                </th>
                <th className="text-center py-2 px-3 font-semibold text-gray-900">
                  Vaccinated
                </th>
              </tr>
            </thead>
            <tbody>
              {beneficiaryRecords.map((record, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-2 px-3 capitalize">{record.vaccine}</td>
                  <td className="py-2 px-3">{record.date}</td>
                  <td className="py-2 px-3 text-xs">{record.session}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        record.attended === "Yes"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {record.attended === "Yes" ? "✓" : "✗"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        record.vaccinated === "Yes"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {record.vaccinated === "Yes" ? "✓" : "✗"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <span className="font-semibold">Ready to submit?</span> Click the
          Submit button to create the resident and add them to the vaccination
          sessions.
        </p>
      </div>
    </div>
  );
}
