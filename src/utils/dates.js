export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDayIndex(date = new Date()) {
  return date.getDay()
}

export function minutesFromTime(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Time must use HH:mm format.')
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}
