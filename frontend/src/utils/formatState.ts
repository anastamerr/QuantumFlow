export interface FormatConfig {
  decimalPrecision: number;
  maxTermsBeforeCollapse: number;
  maxPreviewLength: number;
  amplitudeThreshold: number;
  maxLineLength: number;
  useScientificNotation: boolean;
}

export interface FormattedState {
  preview: string;
  full: string;
  lines: string[];
  termCount: number;
  visibleTermCount: number;
  hiddenTermCount: number;
  qubits: number;
  isNormalized: boolean;
  maxProbability: number;
  estimatedSize: number;
  isTruncated: boolean;
}

interface QuantumTerm {
  amplitude: number;
  state: string;
  probability: number;
  imaginary?: number;
}

export const FORMAT_PRESETS: Record<string, Partial<FormatConfig>> = {
  preview: {
    decimalPrecision: 3,
    maxTermsBeforeCollapse: 4,
    maxPreviewLength: 280,
    amplitudeThreshold: 0.001,
    maxLineLength: 70,
    useScientificNotation: false,
  },
  detailed: {
    decimalPrecision: 6,
    maxTermsBeforeCollapse: 50,
    amplitudeThreshold: 0.00001,
    maxLineLength: 70,
    useScientificNotation: false,
  },
  compact: {
    decimalPrecision: 2,
    maxTermsBeforeCollapse: 10,
    maxLineLength: 50,
    amplitudeThreshold: 0.01,
    useScientificNotation: false,
  },
  scientific: {
    decimalPrecision: 3,
    maxTermsBeforeCollapse: 20,
    useScientificNotation: true,
    amplitudeThreshold: 0.0001,
    maxLineLength: 70,
  },
};

const DEFAULT_CONFIG: FormatConfig = {
  decimalPrecision: 4,
  maxTermsBeforeCollapse: 20,
  maxPreviewLength: 280,
  amplitudeThreshold: 0.0001,
  maxLineLength: 70,
  useScientificNotation: false,
};

function parseQuantumState(stateString: string): QuantumTerm[] {
  const terms: QuantumTerm[] = [];

  try {
    if (stateString.trim().startsWith('[')) {
      return parseArrayNotation(stateString);
    }

    return parseDiracNotation(stateString);
  } catch (error) {
    console.error('Failed to parse quantum state:', error);
    return [];
  }
}

function parseArrayNotation(stateString: string): QuantumTerm[] {
  try {
    const array = JSON.parse(stateString);
    const terms: QuantumTerm[] = [];

    array.forEach((amplitude: number, index: number) => {
      const state = index.toString(2);
      const probability = amplitude * amplitude;
      terms.push({ amplitude, state, probability });
    });

    return terms;
  } catch {
    return [];
  }
}

function parseDiracNotation(stateString: string): QuantumTerm[] {
  const terms: QuantumTerm[] = [];

  const termRegex = /([+-]?\s*\(?\s*[\d.e+-]+\s*[+-]?\s*[\d.e+-]*i?\)?\s*)\|([01]+)⟩/g;
  let match;

  while ((match = termRegex.exec(stateString)) !== null) {
    const amplitudeStr = match[1].trim();
    const state = match[2];

    let amplitude = 0;
    let imaginary = 0;

    if (amplitudeStr.includes('i')) {
      const complexMatch = amplitudeStr.match(/\(?\s*([-+]?[\d.e+-]+)\s*([+-])\s*([\d.e+-]+)i\)?/);
      if (complexMatch) {
        amplitude = parseFloat(complexMatch[1]);
        imaginary = parseFloat(complexMatch[2] + complexMatch[3]);
      }
    } else {
      amplitude = parseFloat(amplitudeStr.replace(/[()]/g, ''));
    }

    const probability = amplitude * amplitude + imaginary * imaginary;
    terms.push({ amplitude, state, probability, imaginary });
  }

  return terms;
}

function sampleLargeState(stateString: string): QuantumTerm[] {
  const sample = stateString.substring(0, 10000);
  const terms = parseDiracNotation(sample);

  terms.sort((a, b) => b.probability - a.probability);
  return terms.slice(0, 100);
}

function formatAmplitude(
  amplitude: number,
  imaginary: number | undefined,
  config: FormatConfig
): string {
  const formatNumber = (num: number) => {
    if (config.useScientificNotation && Math.abs(num) < 0.001) {
      return num.toExponential(config.decimalPrecision);
    }
    return num.toFixed(config.decimalPrecision);
  };

  if (imaginary !== undefined && imaginary !== 0) {
    const real = formatNumber(amplitude);
    const imag = formatNumber(Math.abs(imaginary));
    const sign = imaginary >= 0 ? '+' : '-';
    return `(${real}${sign}${imag}i)`;
  }

  return formatNumber(amplitude);
}

function breakIntoLines(text: string, maxLength: number): string[] {
  const lines: string[] = [];
  let currentLine = '';

  const terms = text.split(/\s*([+-])\s*(?=[\d(])/);

  for (let i = 0; i < terms.length; i++) {
    const part = terms[i];

    if (currentLine.length + part.length > maxLength && currentLine.length > 0) {
      lines.push(currentLine.trim());
      currentLine = ' ' + part;
    } else {
      currentLine += part;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
}

export function formatQuantumState(
  stateString: string,
  userConfig?: Partial<FormatConfig>
): FormattedState {
  try {
    const config = { ...DEFAULT_CONFIG, ...userConfig };

    if (stateString.length > 100000) {
      console.warn('State exceeds 100k chars. Sampling.');
      const terms = sampleLargeState(stateString);
      return buildFormattedState(terms, config, true);
    }

    const terms = parseQuantumState(stateString);
    return buildFormattedState(terms, config, false);
  } catch (error) {
    console.error('Formatting error:', error);
    return {
      preview: 'Error formatting state',
      full: 'Error formatting state',
      lines: ['Error formatting state'],
      termCount: 0,
      visibleTermCount: 0,
      hiddenTermCount: 0,
      qubits: 0,
      isNormalized: false,
      maxProbability: 0,
      estimatedSize: 0,
      isTruncated: false,
    };
  }
}

function buildFormattedState(
  terms: QuantumTerm[],
  config: FormatConfig,
  wasSampled: boolean
): FormattedState {
  const filteredTerms = terms.filter(
    (term) => term.probability >= config.amplitudeThreshold
  );

  filteredTerms.sort((a, b) => b.probability - a.probability);

  const totalProbability = terms.reduce((sum, term) => sum + term.probability, 0);
  const isNormalized = Math.abs(totalProbability - 1.0) < 0.01;
  const maxProbability = Math.max(...terms.map((t) => t.probability));
  const qubits = terms.length > 0 ? terms[0].state.length : 0;

  const formattedTerms = filteredTerms.slice(0, config.maxTermsBeforeCollapse).map((term) => {
    const amp = formatAmplitude(term.amplitude, term.imaginary, config);
    return `${amp}|${term.state}⟩`;
  });

  const fullText = formattedTerms.join(' + ').replace(/\+ -/g, '- ');
  const lines = breakIntoLines(fullText, config.maxLineLength);

  const preview = fullText.length > config.maxPreviewLength
    ? fullText.substring(0, config.maxPreviewLength - 3) + '...'
    : fullText;

  const visibleTermCount = Math.min(filteredTerms.length, config.maxTermsBeforeCollapse);
  const hiddenTermCount = filteredTerms.length - visibleTermCount;

  return {
    preview,
    full: fullText,
    lines,
    termCount: terms.length,
    visibleTermCount,
    hiddenTermCount,
    qubits,
    isNormalized,
    maxProbability,
    estimatedSize: fullText.length,
    isTruncated: wasSampled || hiddenTermCount > 0,
  };
}

export class LazyQuantumFormatter {
  private stateString: string;
  private config: FormatConfig;
  private cachedResult: FormattedState | null = null;

  constructor(stateString: string, config?: Partial<FormatConfig>) {
    this.stateString = stateString;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getValue(): FormattedState {
    if (!this.cachedResult) {
      this.cachedResult = formatQuantumState(this.stateString, this.config);
    }
    return this.cachedResult;
  }

  getPreview(): string {
    if (this.cachedResult) {
      return this.cachedResult.preview;
    }

    const quickPreview = this.stateString.substring(0, 300);
    return quickPreview.length < this.stateString.length
      ? quickPreview + '...'
      : quickPreview;
  }

  invalidate(): void {
    this.cachedResult = null;
  }
}

export function estimateFormattingCost(stateString: string): {
  cost: 'low' | 'medium' | 'high' | 'extreme';
  shouldLazyLoad: boolean;
  estimatedTerms: number;
} {
  const length = stateString.length;
  const estimatedTerms = (stateString.match(/\|/g) || []).length;

  let cost: 'low' | 'medium' | 'high' | 'extreme';
  let shouldLazyLoad = false;

  if (length < 1000) {
    cost = 'low';
  } else if (length < 10000) {
    cost = 'medium';
  } else if (length < 100000) {
    cost = 'high';
    shouldLazyLoad = true;
  } else {
    cost = 'extreme';
    shouldLazyLoad = true;
  }

  return { cost, shouldLazyLoad, estimatedTerms };
}
