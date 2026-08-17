import { useI18n } from "../context/I18nContext";
import type { DocumentStatus } from "../api/types";

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { t } = useI18n();
  return <span className={`badge badge-${status}`}>{t(`status.${status}` as const)}</span>;
}
