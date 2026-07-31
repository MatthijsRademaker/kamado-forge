import { describe, expect, test } from "bun:test";
import { resolveApiProxyTarget } from "../vite.config";

describe("development API proxy target", () => {
  test("uses localhost by default and accepts Compose backend DNS", () => {
    expect(resolveApiProxyTarget({})).toBe("http://localhost:3000");
    expect(resolveApiProxyTarget({ API_PROXY_TARGET: "http://backend:3000" })).toBe("http://backend:3000");
  });
});
