import { describe, expect, it } from "vitest";
import { adminPath } from "./admin-paths";

describe("adminPath", () => {
  describe("on the apex/dev/preview host (basePath = /admin)", () => {
    it("renders / as /admin", () => {
      expect(adminPath("/admin", "/")).toBe("/admin");
    });
    it("prefixes nested paths with /admin", () => {
      expect(adminPath("/admin", "/sites")).toBe("/admin/sites");
      expect(adminPath("/admin", "/sites/new")).toBe("/admin/sites/new");
      expect(adminPath("/admin", "/sites/abc/edit")).toBe("/admin/sites/abc/edit");
    });
  });

  describe("on the admin subdomain (basePath = '')", () => {
    it("renders / as /", () => {
      expect(adminPath("", "/")).toBe("/");
    });
    it("leaves nested paths untouched", () => {
      expect(adminPath("", "/sites")).toBe("/sites");
      expect(adminPath("", "/sites/new")).toBe("/sites/new");
      expect(adminPath("", "/sites/abc/edit")).toBe("/sites/abc/edit");
    });
  });
});
