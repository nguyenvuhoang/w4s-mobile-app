import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/lo';
import '@formatjs/intl-pluralrules/locale-data/vi';
import '@formatjs/intl-pluralrules/locale-data/zh';
import '@formatjs/intl-pluralrules/polyfill';

if (typeof Intl === 'object') {
  if (!Intl.PluralRules) {
    require('@formatjs/intl-pluralrules/polyfill');
  }

  if (typeof Intl.PluralRules === 'function') {
    require('@formatjs/intl-pluralrules/locale-data/en');
    require('@formatjs/intl-pluralrules/locale-data/vi');
    require('@formatjs/intl-pluralrules/locale-data/zh');
    require('@formatjs/intl-pluralrules/locale-data/lo');
  }
}