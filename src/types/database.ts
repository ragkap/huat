// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

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

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  country: Country;
  is_verified: boolean;
  created_at: string;
}

export interface Attachment {
  url: string;
  type: "image" | "video" | "pdf" | "link";
  width?: number;
  height?: number;
  thumbnail_url?: string;
  // link preview fields (type === "link")
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_site_name?: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  post_type: PostType;
  sentiment: Sentiment | null;
  attachments: Attachment[];
  tagged_stocks: string[];
  tagged_stock_names?: Record<string, string>;
  is_pinned: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
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
  // Repost / quote
  quote_of?: string | null;
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

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  post_id: string;
  question: string;
  options: PollOption[];
  ends_at: string | null;
  created_at: string;
  vote_counts?: Record<string, number>;
  user_vote?: string | null;
  total_votes?: number;
}

export interface Forecast {
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

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender?: Profile;
}

export interface Thread {
  id: string;
  created_at: string;
  last_msg_at: string;
  participants?: Profile[];
  last_message?: Message;
  unread_count?: number;
}

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  payload: Json;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface SocialEdge {
  id: string;
  actor_id: string;
  subject_id: string;
  rel_type: RelType;
  created_at: string;
}

// Permissive Database type — replace with `supabase gen types` output in production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
