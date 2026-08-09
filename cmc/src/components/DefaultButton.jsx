export default function DefaultButton({ defaultValue, onClick }) {
  if (defaultValue === null || defaultValue === undefined || defaultValue === '') {
    return null
  }

  return (
    <button type="button" onClick={onClick}>
      Use Default
    </button>
  )
}