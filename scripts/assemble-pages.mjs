import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const gamesDir = join(root, "games")
const site = join(root, "site")
rmSync(site, { recursive: true, force: true })
mkdirSync(site, { recursive: true })

const games = readdirSync(gamesDir).filter((name) => {
  if (name.startsWith("_")) return false
  return existsSync(join(gamesDir, name, "dist", "index.html"))
})

for (const name of games) {
  cpSync(join(gamesDir, name, "dist"), join(site, name), { recursive: true })
}

const links = games.map((name) => "<li><a href=\"./" + name + "/\">" + name + "</a></li>").join("")
const html = "<!doctype html><html><head><meta charset=\"utf-8\"><title>Web Games</title></head><body><h1>Web Games</h1><ul>" + links + "</ul></body></html>"
writeFileSync(join(site, "index.html"), html)
console.log("assembled " + games.length + " games into site/")
