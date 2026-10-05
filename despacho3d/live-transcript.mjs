// Timing describes transcript fragments, not playback or completed turns.
export function groupTranscriptFragments(fragments, gapMs = 800) {
  const groups = [];
  for (const role of ['user', 'assistant']) {
    const ordered = fragments.filter(value => value.role === role)
      .sort((a, b) => a.start_ms - b.start_ms || a.end_ms - b.end_ms || a.sequence - b.sequence);
    let group = null;
    for (const fragment of ordered) {
      if (!group || fragment.start_ms > group.end_ms + gapMs) {
        group = {role, start_ms: fragment.start_ms, end_ms: fragment.end_ms, fragments: [], text: ''};
        groups.push(group);
      }
      group.end_ms = Math.max(group.end_ms, fragment.end_ms);
      group.fragments.push(fragment); group.text += fragment.delta;
    }
  }
  return groups.sort((a, b) => a.start_ms - b.start_ms || a.end_ms - b.end_ms);
}
export function transcriptFragment(event, sequence = 0) {
  const role = event?.type === 'session.input_transcript.delta' ? 'user' :
    event?.type === 'session.output_transcript.delta' ? 'assistant' : null;
  if (!role || typeof event.delta !== 'string' || !Number.isSafeInteger(event.start_ms) ||
    !Number.isSafeInteger(event.end_ms) || event.start_ms < 0 || event.end_ms < event.start_ms) return null;
  return {role, delta: event.delta, start_ms: event.start_ms, end_ms: event.end_ms,
    event_id: typeof event.event_id === 'string' ? event.event_id : '', sequence};
}
