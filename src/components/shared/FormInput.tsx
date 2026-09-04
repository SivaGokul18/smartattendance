import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface FormInputProps {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  theme?: 'light' | 'dark';
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  rightAction?: React.ReactNode;
  maxLength?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  icon,
  theme = 'light',
  required = false,
  disabled = false,
  autoComplete,
  rightAction,
  maxLength,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const isDark = theme === 'dark';

  return (
    <div className="w-full space-y-1.5">
      {/* Label and optional Right Action (e.g. Forgot password) */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className={`text-xs font-semibold tracking-wide select-none ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        {rightAction}
      </div>

      {/* Input wrapper */}
      <div className="relative group">
        {/* Optional Left Icon */}
        {icon && (
          <div
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              error
                ? 'text-rose-500'
                : isDark
                ? 'text-slate-400 group-focus-within:text-indigo-400'
                : 'text-slate-400 group-focus-within:text-indigo-600'
            }`}
          >
            {icon}
          </div>
        )}

        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full text-sm rounded-xl transition-all duration-200 focus:outline-none ${
            icon ? 'pl-10' : 'pl-4'
          } ${isPassword ? 'pr-11' : 'pr-4'} py-3 ${
            isDark
              ? error
                ? 'bg-slate-900/90 text-white border border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'bg-slate-900/80 text-white border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-500 hover:border-slate-600'
              : error
              ? 'bg-white text-slate-900 border border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
              : 'bg-slate-50/70 text-slate-900 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 placeholder-slate-400 hover:border-slate-300'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        {/* Password Eye Toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {/* Accessible Inline Error Message */}
      {error && (
        <div
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs text-rose-500 font-medium animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
