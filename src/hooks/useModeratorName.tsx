import { useEffect, useState } from "react";
import { userService } from "../services/userService";
import type { User } from "../types";

let usersCache: User[] | null = null;
let usersPromise: Promise<void> | null = null;

async function resolveModerator(
  moderatorId: string,
): Promise<{ name: string; user: User | null }> {
  if (!usersCache) {
    if (!usersPromise) {
      usersPromise = userService.getAllUsers().then((users) => {
        usersCache = users;
      });
    }
    await usersPromise;
  }

  const user = usersCache!.find((u) => u.id === moderatorId) ?? null;

  if (user) {
    return { name: `${user.firstName} ${user.lastName}`, user };
  }
  return { name: moderatorId.slice(-8), user: null };
}

export function useModeratorName(moderatorId?: string | null) {
  const [name, setName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!moderatorId) {
      setName(undefined);
      return;
    }

    let cancelled = false;
    setName(moderatorId.slice(-8));

    resolveModerator(moderatorId).then(({ name: resolved }) => {
      if (!cancelled) setName(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [moderatorId]);

  return name;
}

interface ModeratorNameProps {
  moderatorId?: string | null;
}

export function ModeratorName({ moderatorId }: ModeratorNameProps) {
  const name = useModeratorName(moderatorId);
  return <>{name ?? "Unknown"}</>;
}
