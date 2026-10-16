import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 md:px-6">
          <Logo />
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Compass className="size-7" />
          </span>
          <p className="mt-6 text-sm font-semibold tracking-wide text-brand uppercase">Page not found</p>
          <h1 className="mt-2 font-heading text-3xl font-bold">This path isn&apos;t on the map yet</h1>
          <p className="mt-3 text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist in this prototype. Try the course catalog, start a free career discovery, or pick a
            demo journey.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">Browse courses</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/demo">Demo journeys</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
