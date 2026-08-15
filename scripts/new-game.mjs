import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const slug = (process.argv[2] || "").trim()

export function isSlug(value) {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value)
}

export function titleFromSlug(value) {
  return value
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ")
}

function copyDir(from, to) {
  mkdirSync(to, { recursive: true })
  for (const name of readdirSync(from)) {
    const src = join(from, name)
    const dest = join(to, name)
    if (statSync(src).isDirectory()) copyDir(src, dest)
    else copyFileSync(src, dest)
  }
}

function rewrite(file, slugName, title) {
  const text = readFileSync(file, "utf8")
    .replaceAll("__GAME_SLUG__", slugName)
    .replaceAll("__GAME_TITLE__", title)
  writeFileSync(file, text)
}

export function createGame(slugName, workspace = root) {
  if (!isSlug(slugName)) {
    throw new Error("use a kebab-case slug like orbit-bay")
  }
  const src = join(workspace, "games", "_template")
  const dest = join(workspace, "games", slugName)
  if (existsSync(dest)) throw new Error("games/" + slugName + " already exists")
  copyDir(src, dest)
  rewrite(join(dest, "package.json"), slugName, titleFromSlug(slugName))
  rewrite(join(dest, "index.html"), slugName, titleFromSlug(slugName))
  rewrite(join(dest, "src", "main.ts"), slugName, titleFromSlug(slugName))
  return dest
}

const launchedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (launchedDirectly) {
  if (!isSlug(slug)) {
    console.error("Usage: new-game <slug>")
    process.exitCode = 1
  } else {
    const dest = createGame(slug)
    console.log("Created " + dest)
    console.log("Next: pnpm install && pnpm --filter " + slug + " dev")
  }
}
