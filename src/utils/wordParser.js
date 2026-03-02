import JSZip from 'jszip'

/**
 * Formats supportés — les deux sont détectés automatiquement.
 * Le fichier Word peut avoir les options sur des lignes séparées
 * OU tout collé sur une seule ligne (cas fréquent avec Word).
 *
 * FORMAT 1 — Lignes séparées :
 *   1) Question ?
 *   A) Option A
 *   B) Option B (R)
 *   C) Option C
 *   D) Option D
 *
 * FORMAT 2 — Tout sur une ligne (cas Word) :
 *   1) Question ?A) Option AB) Option B (R)C) Option CD) Option D
 *
 * FORMAT 3 — Réponse sur ligne séparée :
 *   Q: Question ?
 *   A: Option A
 *   B: Option B
 *   R: B
 */

export async function parseWordQuestions(file) {
  const arrayBuffer = await file.arrayBuffer()
  const text = await extractTextFromDocx(arrayBuffer)
  return parseQuestionsFromText(text)
}

export async function parseWordQuestionsFromUrl(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Impossible de charger : ${url} (statut ${response.status})`)
  const arrayBuffer = await response.arrayBuffer()
  const text = await extractTextFromDocx(arrayBuffer)
  return parseQuestionsFromText(text)
}

export async function extractTextForDebug(arrayBuffer) {
  return extractTextFromDocx(arrayBuffer)
}

async function extractTextFromDocx(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer)
  const xmlFile = zip.file('word/document.xml')
  if (!xmlFile) throw new Error('Fichier word/document.xml introuvable dans le .docx')

  const xmlText = await xmlFile.async('text')

  const paragraphs = []
  const pRegex = /<w:p[ >][\s\S]*?<\/w:p>/g
  let pMatch

  while ((pMatch = pRegex.exec(xmlText)) !== null) {
    const para = pMatch[0]
    const textParts = []
    const tRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g
    let tMatch
    while ((tMatch = tRegex.exec(para)) !== null) {
      textParts.push(tMatch[1])
    }
    const line = textParts.join('').trim()
    if (line.length > 0) paragraphs.push(line)
  }

  return paragraphs.join('\n')
}

/**
 * Découpe une ligne qui contient question + options collées ensemble.
 * Ex: "1) Question ?A) Opt AB) Opt B (R)C) Opt CD) Opt D"
 * → ["1) Question ?", "A) Opt A", "B) Opt B (R)", "C) Opt C", "D) Opt D"]
 */
function splitCompactLine(line) {
  // Insérer un \n avant chaque A) B) C) D) qui suit du texte
  // On cherche les patterns [ABCD]) précédés d'un caractère non-espace
  const split = line.replace(/(?<=[^\s])([ABCD]\))/g, '\n$1')
  return split.split('\n').map(l => l.trim()).filter(Boolean)
}

export function parseQuestionsFromText(rawText) {
  const questions = []

  // Normaliser les caractères typographiques
  const text = rawText
    .replace(/\u2013|\u2014/g, '-')   // – et — → -
    .replace(/\u00a0|\u202f/g, ' ')   // espaces insécables → espace
    .replace(/\u2019|\u2018/g, "'")   // apostrophes typographiques
    .replace(/\u201c|\u201d/g, '"')   // guillemets typographiques

  // D'abord, on pré-découpe les lignes compactes
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const lines = []

  for (const line of rawLines) {
    // Si la ligne contient une question ET des options collées, on la découpe
    const hasQuestion = /^(?:Q[:.)\s]|Question\s*[:.)\s]|\d+[.):\-]\s+).+/i.test(line)
    const hasInlineOptions = /[ABCD]\)/.test(line)

    if (hasQuestion && hasInlineOptions) {
      // Découper la ligne compacte
      lines.push(...splitCompactLine(line))
    } else {
      lines.push(line)
    }
  }

  let current = null
  const letterMap = { A: 0, B: 1, C: 2, D: 3 }

  for (const line of lines) {
    // ── Question ─────────────────────────────────────────────────────────
    const qMatch = line.match(
      /^(?:Q[:.)\s]|Question\s*[:.)\s]|\d+[.):\-]\s+)(.+)/i
    )

    // ── Option A/B/C/D ────────────────────────────────────────────────────
    const optMatch = line.match(/^([ABCD])[.):\-]\s*(.+)/i)

    // ── Réponse séparée ───────────────────────────────────────────────────
    const rLineMatch = line.match(
      /^(?:R[:.)\s]|R[ée]p(?:onse)?[:.)\s])\s*([ABCD])\b/i
    )

    if (qMatch) {
      if (current && isComplete(current)) {
        questions.push(buildQuestion(current, letterMap))
      }
      current = { q: qMatch[1].trim(), a: null, b: null, c: null, d: null, r: null }

    } else if (optMatch && current) {
      const letter = optMatch[1].toUpperCase()
      let optionText = optMatch[2].trim()

      const isCorrect = /\(\s*R\s*\)\s*$/i.test(optionText)
      optionText = optionText.replace(/\s*\(\s*R\s*\)\s*$/i, '').trim()

      current[letter.toLowerCase()] = optionText
      if (isCorrect) current.r = letter

    } else if (rLineMatch && current) {
      current.r = rLineMatch[1].toUpperCase()
    }
  }

  if (current && isComplete(current)) {
    questions.push(buildQuestion(current, letterMap))
  }

  return questions
}

function isComplete(c) {
  return c.q && c.a !== null && c.b !== null && c.c !== null && c.d !== null && c.r !== null
}

function buildQuestion(c, letterMap) {
  return {
    question: c.q,
    options: [c.a, c.b, c.c, c.d],
    correctIndex: letterMap[c.r],
  }
}
