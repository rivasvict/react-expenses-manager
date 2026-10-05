import React, { ReactNode } from "react";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

interface SyncOfflineNoteProps {
  children: ReactNode;
}

/**
 * Says the sync server is offline and what that means on the screen it sits
 * on, in the place of the actions that need the server. The status line is a
 * polite `role="status"`, so a screen reader hears it when the server drops
 * while the screen is open.
 */
const SyncOfflineNote = ({ children }: SyncOfflineNoteProps) => {
  const { t } = useTranslation();
  return (
    <div className="sync-offline-note">
      <p className="sync-offline-note__status" role="status">
        <span className="sync-offline-note__dot" aria-hidden="true" />
        {t("syncOffline.status")}
      </p>
      <p className="sync-offline-note__text">{children}</p>
    </div>
  );
};

export default SyncOfflineNote;
