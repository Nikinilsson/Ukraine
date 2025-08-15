export interface Source {
  uri: string;
  title: string;
}

export interface Perspective {
  left: string;
  center: string;
  right: string;
}

export interface Highlight {
  textToHighlight: string;
  perspectives: Perspective;
}

export interface SummaryData {
  topic: string;
  summary: string;
  sources: Source[];
  timestamp: string;
  imageUrl?: string;
  imageCredit?: string;
  pullQuote?: string;
  highlights?: Highlight[];
}
