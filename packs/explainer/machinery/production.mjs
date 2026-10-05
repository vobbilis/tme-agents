import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DIR, OUT, SOURCES, PRESERVED } from './story.mjs'

export const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export const hashFile = file => hash(readFileSync(file))
export const readJSON = file => JSON.parse(readFileSync(file, 'utf8'))
export const scriptHash = () => hashFile(resolve(DIR, 'SCRIPT.md'))
export const sourceHash = files => hash(files.map(file => `${file}\n${readFileSync(resolve(DIR, file), 'utf8')}`).join('\n'))
export const visualHash = () => sourceHash(['SCRIPT.md', 'story.mjs', 'illustrations.mjs', 'closing-motion.mjs', 'build-board.mjs'])

// This is a frozen pre-production receipt, not a baseline to silently refresh.
export function checkPreserved() {
  const receipt = readJSON(resolve(OUT, 'source-receipt.json'))
  const expected = [...SOURCES, ...PRESERVED]
  if (receipt.files.length !== expected.length) throw new Error('Incomplete preservation receipt')
  return expected.map(item => {
    const saved = receipt.files.find(file => file.id === item.id && file.path === item.path)
    if (!saved || !existsSync(item.path) || hashFile(item.path) !== saved.sha256)
      throw new Error(`Source or preserved reference changed: ${item.id}`)
    return { ...saved, unchanged: true }
  })
}

export function contrast(a, b) {
  const luminance = hex => {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]
  }
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (values[0] + .05) / (values[1] + .05)
}
