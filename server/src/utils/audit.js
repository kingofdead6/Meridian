import AuditLog from '../models/AuditLog.js';

export function audit(req, action, entity, entityId, summary) {
  if (!req?.user) return;
  AuditLog.create({
    company: req.user.company,
    user: req.user._id,
    userName: req.user.name,
    action,
    entity,
    entityId,
    summary,
  }).catch((e) => console.error('audit failed', e.message));
}
