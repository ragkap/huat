export const ANGBAO_REASONS: Record<string, { label: string; emoji: string }> = {
  first_post:        { label: "First post bonus!", emoji: "🧧" },
  post:              { label: "Created a post", emoji: "📝" },
  post_image:        { label: "Posted with image", emoji: "📸" },
  post_link:         { label: "Shared research/news", emoji: "📰" },
  reply:             { label: "Replied to a post", emoji: "💬" },
  react:             { label: "Reacted to a post", emoji: "❤️" },
  follow:            { label: "Followed someone", emoji: "👤" },
  poll:              { label: "Created a poll", emoji: "📊" },
  forecast:          { label: "Made a prediction", emoji: "🎯" },
  save:              { label: "Saved a post", emoji: "🔖" },
  repost:            { label: "Reposted", emoji: "🔄" },
  received_follow:   { label: "Someone followed you", emoji: "🌟" },
  received_reaction: { label: "Someone reacted to your post", emoji: "🔥" },
  received_reply:    { label: "Someone replied to your post", emoji: "💬" },
  received_repost:   { label: "Someone reposted your post", emoji: "🚀" },
  received_save:     { label: "Someone saved your post", emoji: "⭐" },
  referral_welcome:  { label: "Welcome bonus! Someone invited you", emoji: "🎉" },
  referral_bonus:    { label: "Your referral signed up!", emoji: "🧧" },
};

export function formatAngBao(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
