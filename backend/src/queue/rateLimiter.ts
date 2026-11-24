import { redisConnection } from '../config/redis';
import { prisma } from '../config/database';
import { sendSlackRateLimitAlert } from '../modules/slack/slack.service';

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  delayUntilNextWindowMs: number;
  windowKey: string;
}

function getCurrentHourWindow(): { windowStr: string; msUntilNextHour: number } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');

  const nextHour = new Date(now);
  nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
  const msUntilNextHour = Math.max(1000, nextHour.getTime() - now.getTime());

  return {
    windowStr: `${year}-${month}-${day}-${hour}`,
    msUntilNextHour,
  };
}

// Atomic Lua script: increments counter ONLY if < limit
const CHECK_AND_INCR_LUA = `
  local current = tonumber(redis.call('GET', KEYS[1]) or '0')
  local limit = tonumber(ARGV[1])
  local ttl = tonumber(ARGV[2])
  if current < limit then
    local nextVal = redis.call('INCR', KEYS[1])
    if nextVal == 1 then
      redis.call('EXPIRE', KEYS[1], ttl)
    end
    return {1, nextVal}
  else
    return {0, current}
  end
`;

export async function checkAndConsumeSenderRateLimit(
  senderId: string,
  senderEmail: string,
  userId: string,
  hourlyLimit: number
): Promise<RateLimitResult> {
  const { windowStr, msUntilNextHour } = getCurrentHourWindow();
  const redisKey = `ratelimit:sender:${senderId}:${windowStr}`;
  const ttlSeconds = Math.ceil(msUntilNextHour / 1000) + 120;

  const [allowedFlag, currentCount] = (await redisConnection.eval(
    CHECK_AND_INCR_LUA,
    1,
    redisKey,
    hourlyLimit,
    ttlSeconds
  )) as [number, number];

  if (allowedFlag === 1) {
    return {
      allowed: true,
      currentCount,
      limit: hourlyLimit,
      delayUntilNextWindowMs: 0,
      windowKey: windowStr,
    };
  }

  // Hourly limit reached! Trigger Slack notification ONCE per sender per hour window
  const slackNotifyLockKey = `slack_notified:${senderId}:${windowStr}`;
  const lockAcquired = await redisConnection.set(slackNotifyLockKey, '1', 'EX', ttlSeconds, 'NX');

  if (lockAcquired === 'OK') {
    // Non-blocking call so worker rescheduling never stalls if Slack API is slow
    triggerSlackNotification(userId, senderEmail, hourlyLimit, windowStr, msUntilNextHour).catch(
      (err) => console.error('⚠️ Slack alert background error:', err.message)
    );
  }

  // Add small random jitter (0-3s) so rescheduled jobs spread smoothly in the next hour
  const jitterMs = Math.floor(Math.random() * 3000);

  return {
    allowed: false,
    currentCount,
    limit: hourlyLimit,
    delayUntilNextWindowMs: msUntilNextHour + jitterMs,
    windowKey: windowStr,
  };
}

async function triggerSlackNotification(
  userId: string,
  senderEmail: string,
  hourlyLimit: number,
  windowStr: string,
  msUntilNextHour: number
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.slackAccessToken || !user.slackChannelId) {
    return; // User hasn't connected Slack — safely skip without error
  }

  const minutesRemaining = Math.ceil(msUntilNextHour / 60000);
  await sendSlackRateLimitAlert({
    accessToken: user.slackAccessToken,
    channelId: user.slackChannelId,
    senderEmail,
    hourlyLimit,
    windowStr,
    minutesUntilReset: minutesRemaining,
  });
}