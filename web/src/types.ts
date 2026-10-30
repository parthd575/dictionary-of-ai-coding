export type Entry = {
  slug: string;
  title: string;
  description: string;
  body: string;
  usage: string;
  section: number;
  links: string[];
};

export type Section = {
  number: number;
  title: string;
  slugs: string[];
};

export type Content = {
  sections: Section[];
  entries: Record<string, Entry>;
};
