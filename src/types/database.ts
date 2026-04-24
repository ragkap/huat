// Database schema — hand-written from supabase/migrations/*.sql.
// Re-generate with `supabase gen types` if you install the CLI + access token.

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type PostType = "post" | "poll" | "forecast";
export type Sentiment = "bullish" | "bearish" | "neutral";
export type ReactionType = "like" | "fire" | "rocket" | "bear";
export type RelType = "follow" | "connect_request" | "connect";
export type NotificationType =
  | "reaction"
  | "reply"
  | "follow"
  | "connect_request"
  | "connect_accept"
  | "forecast_resolved"
  | "mention";
export type ForecastOutcome = "pending" | "hit" | "missed";
export type Country = "SG" | "MY" | "US";
export type AlertDirection = "above" | "below";

// ─────────────────────────────────────────────────────────────────────────────
// Raw row types — the exact column shapes from the database.
// Each table gets Row (select), Insert (server-generated cols optional), and
// Update (everything optional). Named with a `Row` suffix to avoid colliding
// with the rich joined-view types further down.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  country: Country;
  is_verified: boolean;
  angbao_balance: number;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
}
export type ProfileInsert = Partial<ProfileRow> & Pick<ProfileRow, "id" | "username" | "display_name">;
export type ProfileUpdate = Partial<ProfileRow>;

export interface PostRow {
  id: string;
  author_id: string;
  content: string;
  post_type: PostType;
  sentiment: Sentiment | null;
  attachments: Attachment[];
  tagged_stocks: string[];
  is_pinned: boolean;
  parent_id: string | null;
  quote_of: string | null;
  created_at: string;
  updated_at: string;
}
export type PostInsert = Omit<Partial<PostRow>, "id" | "created_at" | "updated_at"> & {
  author_id: string;
  content: string;
};
export type PostUpdate = Partial<PostRow>;

export interface PollRow {
  id: string;
  post_id: string;
  question: string;
  options: PollOption[];
  ends_at: string | null;
  created_at: string;
}
export type PollInsert = Omit<Partial<PollRow>, "id" | "created_at"> & {
  post_id: string;
  question: string;
  options: PollOption[];
};

export interface PollVoteRow {
  id: string;
  poll_id: string;
  user_id: string;
  option_id: string;
  created_at: string;
}
export type PollVoteInsert = Omit<Partial<PollVoteRow>, "id" | "created_at"> & {
  poll_id: string;
  user_id: string;
  option_id: string;
};

export interface ForecastRow {
  id: string;
  post_id: string;
  ticker: string;
  current_price: number | null;
  target_price: number;
  target_date: string;
  outcome: ForecastOutcome;
  resolved_at: string | null;
  created_at: string;
}
export type ForecastInsert = Omit<Partial<ForecastRow>, "id" | "created_at"> & {
  post_id: string;
  ticker: string;
  target_price: number;
  target_date: string;
};
export type ForecastUpdate = Partial<ForecastRow>;

export interface ReactionRow {
  id: string;
  post_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
}

export interface SavedPostRow {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface RepostRow {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface SocialGraphRow {
  id: string;
  actor_id: string;
  subject_id: string;
  rel_type: RelType;
  created_at: string;
}

export interface MessageThreadRow {
  id: string;
  created_at: string;
  last_msg_at: string;
}

export interface ThreadParticipantRow {
  thread_id: string;
  user_id: string;
  joined_at: string;
}

export interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  payload: Json;
  is_read: boolean;
  created_at: string;
}
export type NotificationInsert = Omit<Partial<NotificationRow>, "id" | "created_at"> & {
  recipient_id: string;
  type: NotificationType;
};

export interface StockWatchlistRow {
  user_id: string;
  ticker: string;
  created_at: string;
}

export interface AngBaoTransactionRow {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  ref_id: string | null;
  created_at: string;
}

export interface EmailPreferencesRow {
  user_id: string;
  new_message: boolean;
  new_follower: boolean;
  connect_request: boolean;
  connect_accepted: boolean;
  post_reply: boolean;
  post_reaction: boolean;
  post_repost: boolean;
  angbao_milestone: boolean;
  weekly_digest: boolean;
  pause_all: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceAlertRow {
  id: string;
  user_id: string;
  ticker: string;
  target_price: number;
  direction: AlertDirection;
  triggered: boolean;
  created_at: string;
}

export interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Joined / view types — the shapes the app actually renders, which include
// computed fields (reactions_count, user_reaction, etc.) and nested relations.
// Exposed under the original names for backwards compatibility.
// ─────────────────────────────────────────────────────────────────────────────

export interface Attachment {
  url: string;
  type: "image" | "video" | "pdf" | "link";
  width?: number;
  height?: number;
  thumbnail_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_site_name?: string;
}

export interface PollOption {
  id: string;
  text: string;
}

export type Profile = ProfileRow;
export type AngBaoTransaction = AngBaoTransactionRow;
export type SocialEdge = SocialGraphRow;

export interface Post extends PostRow {
  tagged_stock_names?: Record<string, string>;
  author?: Profile;
  reactions_count?: ReactionCounts;
  replies_count?: number;
  reposts_count?: number;
  user_reposted?: boolean;
  user_reaction?: ReactionType | null;
  is_saved?: boolean;
  poll?: Poll;
  forecast?: Forecast;
  latest_reply?: LatestReply | null;
  quoted_post?: Post | null;
}

export interface LatestReply {
  id: string;
  content: string;
  author?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  created_at: string;
}

export interface ReactionCounts {
  like: number;
  fire: number;
  rocket: number;
  bear: number;
  total: number;
}

export interface Poll extends PollRow {
  vote_counts?: Record<string, number>;
  user_vote?: string | null;
  total_votes?: number;
}

export type Forecast = ForecastRow;

export interface Message extends MessageRow {
  sender?: Profile;
}

export interface Thread extends MessageThreadRow {
  participants?: Profile[];
  last_message?: Message;
  unread_count?: number;
}

export interface Notification extends NotificationRow {
  actor?: Profile;
}

// ─────────────────────────────────────────────────────────────────────────────
// Database generic for supabase-js.
//
// Kept permissive (`any`) on purpose. supabase-js infers return types from the
// select-string by looking up each listed column in the schema generic — if a
// Database type is even slightly incomplete (missing a column, wrong join),
// queries collapse to `never` across the whole codebase. Since the migrations
// aren't the full source of truth (triggers modify rows, tagged_stock_names
// comes from app-side enrichment, etc.), a hand-rolled Database type does more
// harm than good. Use the Row/Insert types above for explicit typing at the
// boundaries you care about.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
