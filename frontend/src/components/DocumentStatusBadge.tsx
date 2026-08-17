import type { DocumentStatus } from "../api/types";

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}
