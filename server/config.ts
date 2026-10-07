// Runtime configuration resolved from the environment, kept apart from
// index.ts (which binds a port on import-as-entry-point) so it is testable.
import path from "node:path";

// Where the sync server keeps its JSON files. A release deployment sets
// DATA_DIR to a directory outside the release folders, so deploying a new
// version never touches the data (docs/deployment/README.md); with it unset
// the server keeps using `defaultDir`, which local dev and the legacy
// deploy.sh rely on. Empty or whitespace-only counts as unset, and a relative
// path is taken from the working directory the server was started in.
export const resolveDataDir = (
  env: NodeJS.ProcessEnv,
  defaultDir: string
): string => {
  const configured = env.DATA_DIR?.trim();
  return configured ? path.resolve(configured) : defaultDir;
};
