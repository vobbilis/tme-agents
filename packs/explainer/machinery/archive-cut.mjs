// Preserve the last delivered generation before revising its source or media.
// Never recurse into archives, and never overwrite an existing archive.
import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { DIR, OUT, NAME } from './story.mjs'
import { hashFile, readJSON } from './production.mjs'

const delivered = readJSON(resolve(OUT, 'render-report.json'))
const version = delivered.version
if (!/^secops-story-cut-\d+$/.test(version)) throw new Error('Unexpected archive version')
const destination = resolve(OUT, 'archive', version)
if (existsSync(destination)) throw new Error(`Archive already exists: ${destination}`)
const paths = readdirSync(DIR).filter(name => /\.(md|mjs|py)$/.test(name)).map(name => resolve(DIR, name))
for (const name of [`${NAME}.mp4`, `${NAME}.srt`, `${NAME}.vtt`, 'narration.json', 'timing.json',
  'render-report.json', 'verification-report.json', 'illustration-report.json', 'source-receipt.json', 'review.html', 'review-player-report.json'])
  if (existsSync(resolve(OUT, name))) paths.push(resolve(OUT, name))
for (const directory of [resolve(DIR, 'illustrations'), resolve(OUT, 'audio'), resolve(OUT, 'plates'), resolve(OUT, 'closing')]) {
  if (!existsSync(directory)) continue
  paths.push(...readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isFile() && !entry.name.includes('.partial'))
    .map(entry => resolve(directory, entry.name)))
}
paths.push(resolve(DIR, 'storyboard.html'))
const files = paths.map(path => {
  const name = relative(DIR, path)
  const target = resolve(destination, name)
  mkdirSync(resolve(target, '..'), { recursive: true })
  copyFileSync(path, target, constants.COPYFILE_EXCL)
  const sha256 = hashFile(path)
  if (sha256 !== hashFile(target)) throw new Error(`Archive copy mismatch: ${name}`)
  return { file: name, sha256 }
})
writeFileSync(resolve(destination, 'archive.json'), JSON.stringify({ archivedAt: new Date().toISOString(), version,
  deliveredSha256: delivered.outputSha256, files }, null, 2))
console.log(`Preserved ${files.length} files: ${destination}`)
