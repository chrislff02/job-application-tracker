interface ApplicationFormValues {
  company: string;
  position: string;
  status: string;
  appliedDate: string;
  location: string;
  salary: string;
  source: string;
}

interface ApplicationFormProps {
  values: ApplicationFormValues;
  onChange: (field: keyof ApplicationFormValues, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitLabel: string;
}

function ApplicationForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: ApplicationFormProps) {
  return (
    <form className="add-application-form" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Company"
        value={values.company}
        onChange={(event) => onChange("company", event.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Position"
        value={values.position}
        onChange={(event) => onChange("position", event.target.value)}
        required
      />

      <select
        value={values.status}
        onChange={(event) => onChange("status", event.target.value)}
      >
        <option value="SAVED">Saved</option>
        <option value="APPLIED">Applied</option>
        <option value="ASSESSMENT">Assessment</option>
        <option value="PHONE_SCREEN">Phone Screen</option>
        <option value="INTERVIEW">Interview</option>
        <option value="FINAL_INTERVIEW">Final Interview</option>
        <option value="OFFER">Offer</option>
        <option value="REJECTED">Rejected</option>
        <option value="WITHDRAWN">Withdrawn</option>
      </select>

      <input
        type="date"
        value={values.appliedDate}
        onChange={(event) => onChange("appliedDate", event.target.value)}
      />

      <input
        type="text"
        placeholder="Location"
        value={values.location}
        onChange={(event) => onChange("location", event.target.value)}
      />

      <input
        type="text"
        placeholder="Salary"
        value={values.salary}
        onChange={(event) => onChange("salary", event.target.value)}
      />

      <select
        value={values.source}
        onChange={(event) => onChange("source", event.target.value)}
      >
        <option value="">Select Source</option>
        <option value="LinkedIn">LinkedIn</option>
        <option value="Indeed">Indeed</option>
        <option value="Company Website">Company Website</option>
        <option value="Referral">Referral</option>
        <option value="Recruiter">Recruiter</option>
        <option value="Other">Other</option>
      </select>

      <div className="form-actions">
        <button type="submit">{submitLabel}</button>

        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ApplicationForm;
