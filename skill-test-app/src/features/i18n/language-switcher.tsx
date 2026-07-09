import { useI18n } from "./provider";

export function LanguageSwitcher() {
  const { languages, language, setLanguage } = useI18n();
  if (!languages.length) return null;
  const current = languages.find((l) => l.languageCode === language);
  return (
    <label className="lang-switcher">
      <span className="lang-switcher__label" aria-hidden="true">
        🌐
      </span>
      <select
        className="lang-switcher__select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Language"
      >
        {languages.map((l) => (
          <option key={l.languageCode} value={l.languageCode}>
            {l.languageName}
            {l.isDefault ? " ★" : ""}
          </option>
        ))}
      </select>
      {current ? (
        <span className="lang-switcher__code">{current.languageCode}</span>
      ) : null}
    </label>
  );
}