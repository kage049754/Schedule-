export function hasTimeConflict(existingSlots, candidate) {
  return existingSlots.some((slot) =>
    slot.active !== false &&
    Number(candidate.startMinutes) < Number(slot.endMinutes) &&
    Number(candidate.endMinutes) > Number(slot.startMinutes)
  )
}

export function mergeAdjacentSlots(slots) {
  const sorted = [...slots].sort((a, b) => a.startMinutes - b.startMinutes)
  const merged = []
  for (const slot of sorted) {
    const previous = merged[merged.length - 1]
    if (previous &&
      previous.subjectId === slot.subjectId &&
      previous.room === slot.room &&
      previous.kind === slot.kind &&
      previous.endMinutes === slot.startMinutes) {
      previous.endMinutes = slot.endMinutes
      previous.ids.push(slot.id)
    } else {
      merged.push({ ...slot, ids: [slot.id] })
    }
  }
  return merged
}
