import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/i18n/i18n";

export function LanguageSelector() {
  const { language, setLanguage, supportedLanguages, isTranslating } = useI18n();

  const selected = supportedLanguages.find((l) => l.code === language);

  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="w-[10.5rem] border border-border bg-card hidden md:flex">
        <SelectValue placeholder={selected ? selected.label : "Language"} />
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.label}{isTranslating && l.code === language && language !== "en" ? " (… )" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
