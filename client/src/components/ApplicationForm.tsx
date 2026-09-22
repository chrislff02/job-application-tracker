import type { FormEvent } from "react";

interface ApplicationFormValues {
  company: string;
  position: string;
  status: string;
  appliedDate: string;
  location: string;
  salary: string;
  source: string;
  jobUrl: string;
  notes: string;
  recruiterName: string;
  recruiterEmail: string;
}

interface ApplicationFormProps {
  values: ApplicationFormValues;
  onChange: (field: keyof ApplicationFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitLabel: string;
  isSubmitting: boolean;
}

function ApplicationForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
}: ApplicationFormProps) {
  return (
    <form className="add-application-form" onSubmit={onSubmit}>
      <div className="form-field">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          type="text"
          value={values.company}
          onChange={(event) => onChange("company", event.target.value)}
          disabled={isSubmitting}
          autoComplete="organization"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="position">Position</label>
        <input
          id="position"
          type="text"
          value={values.position}
          onChange={(event) => onChange("position", event.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={values.status}
          onChange={(event) => onChange("status", event.target.value)}
          disabled={isSubmitting}
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
      </div>

      <div className="form-field">
        <label htmlFor="appliedDate">Applied Date</label>
        <input
          id="appliedDate"
          type="date"
          value={values.appliedDate}
          onChange={(event) => onChange("appliedDate", event.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="form-field">
        <label htmlFor="location">Location</label>
        <input
          id="location"
          type="text"
          value={values.location}
          onChange={(event) => onChange("location", event.target.value)}
          disabled={isSubmitting}
          autoComplete="address-level2"
        />
      </div>

      <div className="form-field">
        <label htmlFor="salary">Salary</label>
        <input
          id="salary"
          type="text"
          value={values.salary}
          onChange={(event) => onChange("salary", event.target.value)}
          disabled={isSubmitting}
          placeholder="e.g. $90,000–$110,000"
        />
      </div>

      <div className="form-field">
        <label htmlFor="source">Source</label>
        <select
          id="source"
          value={values.source}
          onChange={(event) => onChange("source", event.target.value)}
          disabled={isSubmitting}
        >
          <option value="">Select Source</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Indeed">Indeed</option>
          <option value="Company Website">Company Website</option>
          <option value="Referral">Referral</option>
          <option value="Recruiter">Recruiter</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="jobUrl">Job Posting URL</label>
        <input
          id="jobUrl"
          type="url"
          value={values.jobUrl}
          onChange={(event) => onChange("jobUrl", event.target.value)}
          disabled={isSubmitting}
          placeholder="https://..."
        />
      </div>

      <div className="form-field">
        <label htmlFor="recruiterName">Recruiter Name</label>
        <input
          id="recruiterName"
          type="text"
          value={values.recruiterName}
          onChange={(event) => onChange("recruiterName", event.target.value)}
          disabled={isSubmitting}
          autoComplete="name"
        />
      </div>

      <div className="form-field">
        <label htmlFor="recruiterEmail">Recruiter Email</label>
        <input
          id="recruiterEmail"
          type="email"
          value={values.recruiterEmail}
          onChange={(event) => onChange("recruiterEmail", event.target.value)}
          disabled={isSubmitting}
          autoComplete="email"
        />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={values.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          disabled={isSubmitting}
          rows={5}
          placeholder="Add any notes about the application..."
        />
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? `${submitLabel}...` : submitLabel}
        </button>

        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ApplicationForm;
