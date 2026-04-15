import ar from '@/translations/ar.json';
import de from '@/translations/de.json';
import en from '@/translations/en.json';
import es from '@/translations/es.json';
import fr from '@/translations/fr.json';
import it from '@/translations/it.json';
import pl from '@/translations/pl.json';
import sv from '@/translations/sv.json';
import uk from '@/translations/uk.json';

export const resources = {
  en: {
    translation: en,
  },
  ar: {
    translation: ar,
  },
  de: {
    translation: de,
  },
  es: {
    translation: es,
  },
  fr: {
    translation: fr,
  },
  it: {
    translation: it,
  },
  pl: {
    translation: pl,
  },
  sv: {
    translation: sv,
  },
  uk: {
    translation: uk,
  },
};

export type Language = keyof typeof resources;
