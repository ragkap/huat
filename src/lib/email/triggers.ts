// Fire-and-forget email triggers — called from API routes
// These run async and never block the response

import {
  sendNewMessageEmail,
  sendNewFollowerEmail,
  sendConnectRequestEmail,
  sendConnectAcceptedEmail,
  sendPostReplyEmail,
  sendAngBaoMilestoneEmail,
} from "./send";

const ANGBAO_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

// Call after a message is sent
export function triggerMessageEmail(recipientId: string, senderName: string, content: string) {
  sendNewMessageEmail(recipientId, senderName, content).catch(() => {});
}

// Call after a follow
export function triggerFollowEmail(recipientId: string, followerName: string, followerUsername: string) {
  sendNewFollowerEmail(recipientId, followerName, followerUsername).catch(() => {});
}

// Call after a connect request
export function triggerConnectRequestEmail(recipientId: string, requesterName: string, requesterUsername: string) {
  sendConnectRequestEmail(recipientId, requesterName, requesterUsername).catch(() => {});
}

// Call after a connect is accepted
export function triggerConnectAcceptedEmail(recipientId: string, accepterName: string, accepterUsername: string) {
  sendConnectAcceptedEmail(recipientId, accepterName, accepterUsername).catch(() => {});
}

// Call after a reply is posted
export function triggerReplyEmail(parentAuthorId: string, replierName: string, replyContent: string, postId: string) {
  sendPostReplyEmail(parentAuthorId, replierName, replyContent, postId).catch(() => {});
}

// Call after angbao balance changes — check if a milestone was crossed
export function triggerAngBaoMilestoneCheck(userId: string, oldBalance: number, newBalance: number) {
  for (const milestone of ANGBAO_MILESTONES) {
    if (oldBalance < milestone && newBalance >= milestone) {
      sendAngBaoMilestoneEmail(userId, milestone).catch(() => {});
      break; // Only send for the highest milestone crossed
    }
  }
}
