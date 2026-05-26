import { describe, expect, it } from "vitest";
import { decideRoute } from "./host-routing";

describe("decideRoute — admin subdomain", () => {
  it("rewrites the root to /admin", () => {
    expect(decideRoute("admin.8caps.co.uk", "/")).toEqual({
      kind: "admin-subdomain",
      internalPath: "/admin",
    });
  });

  it("rewrites nested paths under /admin/*", () => {
    expect(decideRoute("admin.8caps.co.uk", "/sites")).toEqual({
      kind: "admin-subdomain",
      internalPath: "/admin/sites",
    });
  });

  it("rewrites the login path to /admin/login", () => {
    expect(decideRoute("admin.8caps.co.uk", "/login")).toEqual({
      kind: "admin-subdomain",
      internalPath: "/admin/login",
    });
  });

  it("is idempotent when the path is already /admin/*", () => {
    expect(decideRoute("admin.8caps.co.uk", "/admin/sites")).toEqual({
      kind: "admin-subdomain",
      internalPath: "/admin/sites",
    });
  });

  it("matches the host case-insensitively", () => {
    expect(decideRoute("Admin.8Caps.CO.UK", "/enquiries")).toEqual({
      kind: "admin-subdomain",
      internalPath: "/admin/enquiries",
    });
  });

  it("strips port suffixes from the host", () => {
    expect(decideRoute("admin.8caps.co.uk:443", "/sites")).toEqual({
      kind: "admin-subdomain",
      internalPath: "/admin/sites",
    });
  });
});

describe("decideRoute — production apex", () => {
  it("redirects bare /admin on apex to subdomain root", () => {
    expect(decideRoute("8caps.co.uk", "/admin")).toEqual({
      kind: "apex-admin-redirect",
      targetPath: "/",
    });
  });

  it("redirects /admin/ on apex to subdomain root", () => {
    expect(decideRoute("8caps.co.uk", "/admin/")).toEqual({
      kind: "apex-admin-redirect",
      targetPath: "/",
    });
  });

  it("strips the /admin prefix when redirecting nested paths", () => {
    expect(decideRoute("8caps.co.uk", "/admin/sites")).toEqual({
      kind: "apex-admin-redirect",
      targetPath: "/sites",
    });
  });

  it("also redirects /admin/* from the www apex", () => {
    expect(decideRoute("www.8caps.co.uk", "/admin/enquiries")).toEqual({
      kind: "apex-admin-redirect",
      targetPath: "/enquiries",
    });
  });

  it("passes through non-admin paths on apex", () => {
    expect(decideRoute("8caps.co.uk", "/work")).toEqual({
      kind: "passthrough",
    });
  });

  it("passes through the apex homepage", () => {
    expect(decideRoute("8caps.co.uk", "/")).toEqual({
      kind: "passthrough",
    });
  });
});

describe("decideRoute — dev and preview hosts", () => {
  it("passes through localhost /admin/* so dev keeps working", () => {
    expect(decideRoute("localhost:3000", "/admin/sites")).toEqual({
      kind: "passthrough",
    });
  });

  it("passes through Vercel preview /admin/*", () => {
    expect(
      decideRoute("8caps-website-git-feature.vercel.app", "/admin/sites"),
    ).toEqual({ kind: "passthrough" });
  });

  it("passes through an unknown host entirely", () => {
    expect(decideRoute("example.com", "/admin")).toEqual({
      kind: "passthrough",
    });
  });
});
