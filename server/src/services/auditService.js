import { auditRepository } from '../repositories/auditRepository.js';

/**
 * Audit log helper service
 * @param {Object} logData 
 */
export const logAudit = async ({
  userId,
  action,
  entityType = null,
  entityId = null,
  oldValuesJson = null,
  newValuesJson = null,
  ipAddress = null
}) => {
  try {
    await auditRepository.create({
      userId,
      action,
      entityType,
      entityId,
      oldValuesJson,
      newValuesJson,
      ipAddress
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};
