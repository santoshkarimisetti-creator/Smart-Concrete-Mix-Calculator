import DefaultButton from './DefaultButton.jsx'

export default function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  placeholder = 'Select an option',
  defaultValue,
  onUseDefault,
  required = true,
}) {
  const showDefaultButton =
    defaultValue !== null && defaultValue !== undefined && defaultValue !== ''

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <div className="field__control">
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {showDefaultButton ? (
          <DefaultButton
            defaultValue={defaultValue}
            onClick={() => onUseDefault(name, defaultValue)}
          />
        ) : null}
      </div>
      {error ? (
        <p id={`${name}-error`} className="field__error" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  )
}