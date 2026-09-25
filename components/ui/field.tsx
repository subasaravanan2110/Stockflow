import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Base = { label: string; name: string; error?: string[]; hint?: string };

const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$";

export function Field({ label, name, error, hint, type, pattern, title, onInvalid, onInput, ...props }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = error?.length ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        id={name}
        name={name}
        type={type}
        pattern={pattern ?? (type === "email" ? EMAIL_PATTERN : undefined)}
        title={title ?? (type === "email" ? "Enter a valid email address like name@example.com" : undefined)}
        className="input"
        aria-invalid={Boolean(error?.length)}
        aria-describedby={describedBy}
        onInput={(event) => { event.currentTarget.setCustomValidity(""); onInput?.(event); }}
        onInvalid={(event) => {
          const input = event.currentTarget;
          if (input.validity.valueMissing) input.setCustomValidity(`${label} is required.`);
          else if (type === "email" && (input.validity.typeMismatch || input.validity.patternMismatch)) input.setCustomValidity("Enter a valid email address like name@example.com.");
          else if (input.validity.patternMismatch) input.setCustomValidity(title ?? `${label} has an invalid format.`);
          else if (type === "number" && input.validity.badInput) input.setCustomValidity(`${label} must be a valid number.`);
          else if (type === "number" && input.validity.stepMismatch) input.setCustomValidity(`${label} must use a valid numeric increment.`);
          else if (input.validity.rangeUnderflow) input.setCustomValidity(`${label} must be at least ${props.min}.`);
          else if (input.validity.rangeOverflow) input.setCustomValidity(`${label} must be no more than ${props.max}.`);
          else if (input.validity.tooShort) input.setCustomValidity(`${label} is too short.`);
          else if (input.validity.tooLong) input.setCustomValidity(`${label} is too long.`);
          onInvalid?.(event);
        }}
        {...props}
      />
      {error?.[0] ? <span id={`${name}-error`} role="alert" className="help text-red-700">{error[0]}</span> : hint ? <span id={`${name}-hint`} className="help">{hint}</span> : null}
    </label>
  );
}

export function SelectField({ label, name, error, children, onInvalid, onInput, ...props }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select id={name} name={name} className="input" aria-invalid={Boolean(error?.length)} aria-describedby={error?.length ? `${name}-error` : undefined} onInput={(event) => { event.currentTarget.setCustomValidity(""); onInput?.(event); }} onInvalid={(event) => { if (event.currentTarget.validity.valueMissing) event.currentTarget.setCustomValidity(`Select ${label.toLowerCase()}.`); onInvalid?.(event); }} {...props}>{children}</select>
      {error?.[0] ? <span id={`${name}-error`} role="alert" className="help text-red-700">{error[0]}</span> : null}
    </label>
  );
}

export function TextareaField({ label, name, error, onInvalid, onInput, ...props }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea id={name} name={name} className="input min-h-24 resize-y" aria-invalid={Boolean(error?.length)} aria-describedby={error?.length ? `${name}-error` : undefined} onInput={(event) => { event.currentTarget.setCustomValidity(""); onInput?.(event); }} onInvalid={(event) => { if (event.currentTarget.validity.valueMissing) event.currentTarget.setCustomValidity(`${label} is required.`); onInvalid?.(event); }} {...props} />
      {error?.[0] ? <span id={`${name}-error`} role="alert" className="help text-red-700">{error[0]}</span> : null}
    </label>
  );
}
