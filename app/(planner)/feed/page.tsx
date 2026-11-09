import { Bookmark } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { PostCard } from "@/components/post-card";
import { ChipLink, EmptyState, LinkButton } from "@/components/ui";
import { requirePlannerEvent } from "@/lib/planner";
import { getCatalog } from "@/lib/queries/catalog";
import { getFeed, type FeedTab } from "@/lib/queries/feed";
import { tagNames, toPostCard } from "@/lib/queries/feed-view";

export const metadata = { title: "Feed" };

export default async function Feed({ searchParams }: PageProps<"/feed">) {
  const { viewer, event } = await requirePlannerEvent();
  const { tab: rawTab, tag } = await searchParams;
  const tab: FeedTab = rawTab === "following" || rawTab === "near" ? rawTab : "for-you";
  const catalog = await getCatalog();
  const eventTag = typeof tag === "string" ? tag : undefined;
  const posts = await getFeed({ viewerId: viewer.id, tab, areaId: event.areaId, eventType: eventTag, limit: 40 });
  const area = catalog.areaById.get(event.areaId)?.name;
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const next = { tab: tab === "for-you" ? undefined : tab, tag: eventTag, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    return p.toString() ? `/feed?${p}` : "/feed";
  };

  return (
    <main>
      <AppHeader
        title="Feed"
        subtitle="Fresh work from Cebu vendors"
        right={
          <Link href="/saved" className="flex size-10 items-center justify-center rounded-full border-2 border-ink bg-white" aria-label="Saved posts">
            <Bookmark className="size-5" />
          </Link>
        }
      />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4">
        <ChipLink href={qs({ tab: undefined })} selected={tab === "for-you"}>
          For you
        </ChipLink>
        <ChipLink href={qs({ tab: "following" })} selected={tab === "following"}>
          Following
        </ChipLink>
        <ChipLink href={qs({ tab: "near" })} selected={tab === "near"}>
          Near me · {area}
        </ChipLink>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-2 pb-1">
        {catalog.eventTypes.map((e) => (
          <ChipLink key={e.slug} href={qs({ tag: eventTag === e.slug ? undefined : e.slug })} selected={eventTag === e.slug} className="h-8 text-xs">
            #{e.name.toLowerCase().replace(/\s+/g, "")}
          </ChipLink>
        ))}
      </div>
      <div className="grid gap-5 px-5 pt-4 pb-6">
        {posts.length ? (
          posts.map((p) => <PostCard key={p.id} post={toPostCard(p, catalog)} tagNames={tagNames(catalog)} />)
        ) : (
          <EmptyState
            title={tab === "following" ? "Follow vendors to fill this tab" : "Nothing here yet"}
            body={tab === "following" ? "Tap Follow on any post or vendor profile." : "Try another filter."}
            action={
              <LinkButton href="/feed" variant="outline" size="sm">
                Back to For you
              </LinkButton>
            }
          />
        )}
      </div>
    </main>
  );
}
