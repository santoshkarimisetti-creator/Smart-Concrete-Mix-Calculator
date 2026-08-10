import DefaultButton from './DefaultButton.jsx'

export default function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  unit = '',
  error,
  defaultValue,
  onUseDefault,
  min,
  step = 'any',
  required = true,
}) {
  const showDefaultButton =
    defaultValue !== null && defaultValue !== undefined && defaultValue !== ''

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <div className="field__control">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          step={step}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          style={type === 'number' ? { MozAppearance: 'textfield' } : undefined}
          className={type === 'number' ? 'no-spinner' : undefined}
        />
        {unit ? <span className="field__unit">{unit}</span> : null}
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