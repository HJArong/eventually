import { Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { PostCard } from "@/components/post-card";
import { ChipLink, EmptyState, LinkButton } from "@/components/ui";
import { getCatalog } from "@/lib/queries/catalog";
import { getFeed } from "@/lib/queries/feed";
import { tagNames, toPostCard } from "@/lib/queries/feed-view";
import { requireVendorShop } from "@/lib/vendor";

export const metadata = { title: "Feed" };

export default async function VendorFeed({ searchParams }: PageProps<"/vendor/feed">) {
  const { vendor } = await requireVendorShop();
  const { tab, posted } = await searchParams;
  const mine = tab !== "all";
  const catalog = await getCatalog();
  const posts = await getFeed({ viewerId: null, tab: "for-you", vendorId: mine ? vendor.id : undefined, limit: 30 });
  return (
    <main>
      <AppHeader
        title="Feed"
        subtitle="Your posts reach planners in the feed"
        right={
          <LinkButton href="/vendor/posts/new" size="sm">
            <Plus className="size-4" /> Post
          </LinkButton>
        }
      />
      <div className="flex gap-2 px-5 pt-4">
        <ChipLink href="/vendor/feed" selected={mine}>
          My posts
        </ChipLink>
        <ChipLink href="/vendor/feed?tab=all" selected={!mine}>
          Everyone
        </ChipLink>
      </div>
      {posted && (
        <p className="mx-5 mt-4 animate-pop-in rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success">
          Published! Planners will see it in their feed.
        </p>
      )}
      <div className="grid gap-5 px-5 pt-4 pb-6">
        {posts.length ? (
          posts.map((p) => <PostCard key={p.id} post={toPostCard(p, catalog)} interactive={false} tagNames={tagNames(catalog)} />)
        ) : (
          <EmptyState title="No posts yet" body="Share photos from recent events to get discovered." action={<LinkButton href="/vendor/posts/new" size="sm">Create a post</LinkButton>} />
        )}
      </div>
    </main>
  );
}
