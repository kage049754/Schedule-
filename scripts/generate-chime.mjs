import fs from 'node:fs';
const rate = 22050, notes = [{ hz: 659.25, duration: .22 }, { hz: 783.99, duration: .24 }, { hz: 987.77, duration: .42 }];
const samples = [];
for (const note of notes) {
  const count = Math.floor(rate * note.duration);
  for (let i = 0; i < count; i++) {
    const envelope = Math.min(1, i / (rate * .012), (count - i) / (rate * .07)) * .22;
    samples.push((Math.sin(2 * Math.PI * note.hz * i / rate) + .22 * Math.sin(4 * Math.PI * note.hz * i / rate)) * envelope);
  }
}
const data = Buffer.alloc(samples.length * 2);
samples.forEach((value, i) => data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(value * 32767))), i * 2));
const head = Buffer.alloc(44);
head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8); head.write('fmt ', 12);
head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22); head.writeUInt32LE(rate, 24);
head.writeUInt32LE(rate * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(data.length, 40);
fs.mkdirSync('assets', { recursive: true }); fs.writeFileSync('assets/schedule_chime.wav', Buffer.concat([head, data]));
