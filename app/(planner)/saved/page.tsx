import { LogOut, RotateCcw } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PostCard } from "@/components/post-card";
import { Avatar, Button, EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { config } from "@/lib/config";
import { requirePlannerEvent } from "@/lib/planner";
import { getCatalog } from "@/lib/queries/catalog";
import { getFeed } from "@/lib/queries/feed";
import { tagNames, toPostCard } from "@/lib/queries/feed-view";
import { signOut } from "@/app/actions/auth";
import { resetDemoAction } from "@/app/actions/admin";

export const metadata = { title: "Saved & settings" };

export default async function Saved() {
  const { viewer } = await requirePlannerEvent();
  const catalog = await getCatalog();
  const posts = await getFeed({ viewerId: viewer.id, savedOnly: true, limit: 50 });

  return (
    <main>
      <AppHeader title="Saved & settings" back="/home" />
      <section className="px-5 pt-4">
        <div className="card flex items-center gap-3 rounded-2xl p-4">
          <Avatar name={viewer.displayName || "You"} size={48} className="bg-sand text-ink-soft" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">{viewer.displayName}</p>
            <p className="truncate text-sm text-muted">{viewer.email}</p>
          </div>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="size-4" /> Sign out
            </Button>
          </form>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <LinkButton href="/onboarding/planner?new=1" variant="outline" size="sm">
            + New event
          </LinkButton>
          {config.demoMode && (
            <form action={resetDemoAction}>
              <Button variant="danger" size="sm" type="submit">
                <RotateCcw className="size-4" /> Reset demo data
              </Button>
            </form>
          )}
        </div>
      </section>
      <section className="px-5 pt-8 pb-6">
        <SectionTitle>Saved posts</SectionTitle>
        {posts.length ? (
          <div className="grid gap-5">
            {posts.map((p) => (
              <PostCard key={p.id} post={toPostCard(p, catalog)} tagNames={tagNames(catalog)} />
            ))}
          </div>
        ) : (
          <EmptyState title="No saved posts yet" body="Tap Save on any feed post to keep ideas here." action={<LinkButton href="/feed" size="sm">Open feed</LinkButton>} />
        )}
      </section>
    </main>
  );
}
