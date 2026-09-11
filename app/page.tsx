import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold">{siteConfig.name}</h1>
      <p className="mt-2 text-sm text-neutral-500">{siteConfig.description}</p>
    </main>
  );
}
