import React from "react";
import { useTranslation } from "../../../i18n";
import { APP_VERSION } from "../../../version";
import "./styles.scss";

type VersionLabelProps = {
  version?: string;
};

const VersionLabel = ({ version = APP_VERSION }: VersionLabelProps) => {
  const { t } = useTranslation();

  if (!version) return null;

  return <p className="version-label">{t("version.label", { version })}</p>;
};

export default VersionLabel;
