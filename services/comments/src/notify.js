import workerAdapter from 'axios/lib/adapters/worker.js';
import notifications from 'twikoo-func/utils/notify';
import { equalsMail } from 'twikoo-func/utils';
import { getAxios, getPushoo } from 'twikoo-func/utils/lib';
import logger from 'twikoo-func/utils/logger';

// With nodejs_compat, Axios auto-detection selects XHR, which Workers do not have.
getAxios().defaults.adapter = workerAdapter;
const pushoo = getPushoo();
export const emailTest = notifications.emailTest;

export async function sendNotice(comment, config, getParentComment, qmsgQQ) {
  if (!qmsgQQ || String(config.PUSHOO_CHANNEL).trim().toLowerCase() !== 'qmsg') {
    return notifications.sendNotice(comment, config, getParentComment);
  }
  if (comment.isSpam && config.NOTIFY_SPAM === 'false') return;

  await Promise.all([
    notifications.noticeMaster(comment, config),
    notifications.noticeReply(comment, config, getParentComment),
    sendQmsg(comment, config, qmsgQQ),
  ]).catch(() => logger.error('Comment notification failed.'));
}

async function sendQmsg(comment, config, qmsgQQ) {
  if (!config.PUSHOO_TOKEN || equalsMail(config.BLOGGER_EMAIL, comment.mail)) return;
  const qq = String(qmsgQQ).trim();
  if (!/^\d+$/.test(qq)) throw new Error('QMSG_QQ must contain a QQ number.');
  // Qmsg 3 requires an explicit recipient and rejects URLs and digit sequences.
  // Keep the notice independent of visitor content; read full comments on the site.
  const result = await pushoo('qmsg', {
    token: config.PUSHOO_TOKEN,
    content: '博客收到一条新留言，请打开网站查看。',
    options: { qmsg: { url: 'https://qmsg.zendee.cn/v3', qq } },
  });
  if (result?.success !== true) throw new Error('Qmsg did not accept the notification.');
}
