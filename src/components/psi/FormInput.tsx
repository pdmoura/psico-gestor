import { AlertCircle } from "lucide-react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput = ({ label, id, error, required, className = "", ...props }: FormInputProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        id={id}
        className={`h-11 px-3 text-sm w-full bg-card border-2 rounded-lg text-foreground placeholder:text-muted-foreground
          ${error ? "border-destructive" : "border-border"} 
          focus:border-ring focus:outline-none transition-colors ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
};
