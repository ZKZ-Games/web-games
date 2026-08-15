import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isSlug, titleFromSlug } from "./new-game.mjs"

describe("new-game", () => {
  it("accepts kebab slugs", () => {
    assert.equal(isSlug("orbit-bay"), true)
    assert.equal(isSlug("Playground"), false)
    assert.equal(isSlug("a"), true)
  })
  it("titles a slug", () => {
    assert.equal(titleFromSlug("orbit-bay"), "Orbit Bay")
  })
})
