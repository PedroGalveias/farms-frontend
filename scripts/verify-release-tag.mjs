import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const RELEASE_TAG = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** Parse the strict v<major>.<minor>.<patch> release tags this project ships. */
export function parseReleaseTag(tag) {
  const match = RELEASE_TAG.exec(tag);
  return match ? match.slice(1).map(Number) : null;
}

/** Compare two parsed release versions. */
export function compareReleaseVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    const difference = left[index] - right[index];
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * Reject malformed or repeated/backwards releases. package.json deliberately
 * remains a development marker for the next planned release, so it need not
 * equal a maintenance tag cut from an earlier commit.
 */
export function verifyReleaseTag(tag, existingTags) {
  const version = parseReleaseTag(tag);
  if (!version) {
    throw new Error(
      `Tag ${tag} must use the release format v<major>.<minor>.<patch>.`,
    );
  }

  const previous = existingTags
    .map((existingTag) => ({
      tag: existingTag,
      version: parseReleaseTag(existingTag),
    }))
    .filter((candidate) => candidate.version !== null)
    .sort((left, right) => compareReleaseVersions(left.version, right.version))
    .at(-1);

  if (previous && compareReleaseVersions(version, previous.version) <= 0) {
    throw new Error(
      `Tag ${tag} must be newer than the latest release tag ${previous.tag}.`,
    );
  }

  return previous?.tag;
}

function main() {
  const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;
  if (!tag) {
    throw new Error("Pass a release tag or set GITHUB_REF_NAME.");
  }

  const existingTags = execFileSync("git", ["tag", "--list", "v*"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);
  // `git tag --list` includes the tag that triggered this workflow, but that
  // tag is the candidate being evaluated rather than a prior release.
  const previousTag = verifyReleaseTag(
    tag,
    existingTags.filter((existingTag) => existingTag !== tag),
  );
  console.log(
    previousTag
      ? `OK: ${tag} is newer than ${previousTag}.`
      : `OK: ${tag} is the first release tag.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
