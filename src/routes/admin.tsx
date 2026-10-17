import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowUpRight, CarFront, ClipboardList, ShieldCheck } from "lucide-react";
import { AdminBookings } from "@/components/AdminBookings";
import { AdminDrivers } from "@/components/AdminDrivers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && window.location.hostname !== "admin.visit-hijaz.com") {
      throw redirect({ href: "https://admin.visit-hijaz.com/admin" });
    }
  },
  head: () => ({
    meta: [
      { title: "Staff Portal — Visit Hijaz" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Admin-only tools for reviewing saved customer bookings and pending driver registrations.",
      },
      { property: "og:title", content: "Staff Portal — Visit Hijaz" },
      {
        property: "og:description",
        content: "Admin-only booking and pending driver registration review.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a
            href="https://visit-hijaz.com"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <span>Visit Hijaz</span>
            <span className="text-muted-foreground">/ Staff</span>
          </a>
          <a
            href="https://visit-hijaz.com"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Main website <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Staff workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Admin portal</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Review saved customer bookings and driver registrations awaiting review. A listed
              registration is not an approval, and a booking is not a confirmation.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
            Admin-only access
          </div>
        </div>

        <Tabs defaultValue="bookings" className="space-y-5">
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2">
            <TabsTrigger value="bookings" className="gap-2 py-2.5">
              <ClipboardList aria-hidden="true" className="size-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="drivers" className="gap-2 py-2.5">
              <CarFront aria-hidden="true" className="size-4" />
              Driver registrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-0 focus-visible:outline-none">
            <AdminBookings />
          </TabsContent>
          <TabsContent value="drivers" className="mt-0 focus-visible:outline-none">
            <AdminDrivers />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
