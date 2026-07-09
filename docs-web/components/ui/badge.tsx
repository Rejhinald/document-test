import { cn } from "@/lib/utils";
import type { Role } from "@/lib/api/types";

const ROLE_STYLES: Record<Role, string> = {
  owner: "bg-accent-soft text-accent",
  editor: "bg-amber-100 text-amber-800",
  viewer: "bg-paper text-ink-soft border border-line",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        ROLE_STYLES[role],
        className,
      )}
    >
      {role}
    </span>
  );
}
