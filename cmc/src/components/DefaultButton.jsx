export default function DefaultButton({ defaultValue, onClick, label = 'Use Default' }) {
  if (defaultValue === null || defaultValue === undefined || defaultValue === '') {
    return null
  }

  return (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  )
}