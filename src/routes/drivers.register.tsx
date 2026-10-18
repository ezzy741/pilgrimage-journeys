import { createFileRoute, redirect } from "@tanstack/react-router";
import { DriverRegistration } from "@/components/DriverRegistration";

export const Route = createFileRoute("/drivers/register")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && window.location.hostname !== "drivers.visit-hijaz.com") {
      throw redirect({ href: "https://drivers.visit-hijaz.com/drivers/register" });
    }
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Driver Registration — Visit Hijaz" },
      {
        name: "description",
        content: "Share a few details to register your interest in driving with Visit Hijaz.",
      },
    ],
  }),
  component: DriverRegistration,
});
