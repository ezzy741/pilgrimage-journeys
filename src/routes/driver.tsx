import { createFileRoute, redirect } from "@tanstack/react-router";

/** Preserve old bookmarks without serving a simulated driver console to customers. */
export const Route = createFileRoute("/driver")({
  beforeLoad: () => {
    throw redirect({ href: "https://drivers.visit-hijaz.com/drivers/register" });
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
});
