import React from "react";
import { useTranslation } from "../LanguageProvider";
import { TranslationKey } from "../translations/en";
import { TranslationParams } from "../translator";

type TransProps = {
  i18nKey: TranslationKey;
  params?: TranslationParams;
  /**
   * Renders each `<name>…</name>` span of the translated text, keyed by
   * name — e.g. a link wrapped around a few words, whose position in the
   * sentence differs between languages.
   */
  components: Record<string, (children: string) => React.ReactNode>;
};

const TAG = /<(\w+)>(.*?)<\/\1>/g;

/**
 * A translation containing inline markup. Only the tags named in
 * `components` are turned into elements; the text itself is never parsed as
 * HTML.
 */
const Trans = ({ i18nKey, params, components }: TransProps) => {
  const { t } = useTranslation();
  const text = t(i18nKey, params);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  text.replace(TAG, (match, name: string, children: string, offset: number) => {
    parts.push(text.slice(lastIndex, offset));
    const render = components[name];
    parts.push(
      <React.Fragment key={offset}>
        {render ? render(children) : children}
      </React.Fragment>
    );
    lastIndex = offset + match.length;
    return match;
  });
  parts.push(text.slice(lastIndex));
  return <>{parts}</>;
};

export default Trans;
