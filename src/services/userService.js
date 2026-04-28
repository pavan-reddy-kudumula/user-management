const mongoose = require('mongoose');
const User = require('../models/User');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{7,15}$/;
const allowedKycStatuses = new Set(['Pending', 'Approved', 'Rejected']);
const allowedDeviceTypes = new Set(['Mobile', 'Desktop']);
const allowedOperatingSystems = new Set(['Android', 'iOS', 'Windows', 'macOS']);

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizePhone(value) {
  return typeof value === 'string' ? value.trim() : String(value || '').trim();
}

function validateDeviceInfo(deviceInfo) {
  if (deviceInfo == null) {
    return { value: undefined, error: null };
  }

  if (typeof deviceInfo !== 'object' || Array.isArray(deviceInfo)) {
    return { value: null, error: 'deviceInfo must be an object' };
  }

  const normalized = {};

  if (deviceInfo.ipAddress != null) {
    if (typeof deviceInfo.ipAddress !== 'string' || !deviceInfo.ipAddress.trim()) {
      return { value: null, error: 'deviceInfo.ipAddress must be a string' };
    }
    normalized.ipAddress = deviceInfo.ipAddress.trim();
  }

  if (deviceInfo.deviceType != null) {
    if (!allowedDeviceTypes.has(deviceInfo.deviceType)) {
      return { value: null, error: 'deviceInfo.deviceType must be Mobile or Desktop' };
    }
    normalized.deviceType = deviceInfo.deviceType;
  }

  if (deviceInfo.os != null) {
    if (!allowedOperatingSystems.has(deviceInfo.os)) {
      return { value: null, error: 'deviceInfo.os must be Android, iOS, Windows, or macOS' };
    }
    normalized.os = deviceInfo.os;
  }

  return { value: Object.keys(normalized).length > 0 ? normalized : undefined, error: null };
}

function validateCreatePayload(item, index) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return { value: null, error: 'Each record must be an object' };
  }

  const fullName = typeof item.fullName === 'string' ? item.fullName.trim() : '';
  if (fullName.length < 3) {
    return { value: null, error: 'fullName is required and must be at least 3 characters' };
  }

  const email = normalizeEmail(item.email);
  if (!email || !emailRegex.test(email)) {
    return { value: null, error: 'email is required and must be a valid email address' };
  }

  const phone = normalizePhone(item.phone);
  if (!phone || !phoneRegex.test(phone)) {
    return { value: null, error: 'phone is required and must contain only numeric digits' };
  }

  const walletBalance = item.walletBalance == null ? 0 : Number(item.walletBalance);
  if (!Number.isFinite(walletBalance) || walletBalance < 0) {
    return { value: null, error: 'walletBalance must be a number greater than or equal to 0' };
  }

  const isBlocked = item.isBlocked == null ? false : item.isBlocked;
  if (typeof isBlocked !== 'boolean') {
    return { value: null, error: 'isBlocked must be a boolean' };
  }

  const kycStatus = item.kycStatus == null ? 'Pending' : item.kycStatus;
  if (!allowedKycStatuses.has(kycStatus)) {
    return { value: null, error: 'kycStatus must be Pending, Approved, or Rejected' };
  }

  const deviceInfoResult = validateDeviceInfo(item.deviceInfo);
  if (deviceInfoResult.error) {
    return { value: null, error: deviceInfoResult.error };
  }

  return {
    value: {
      fullName,
      email,
      phone,
      walletBalance,
      isBlocked,
      kycStatus,
      ...(deviceInfoResult.value ? { deviceInfo: deviceInfoResult.value } : {}),
    },
    error: null,
  };
}

function buildIdentifierKeys(doc) {
  const keys = [];

  if (doc._id) {
    keys.push({ type: '_id', value: String(doc._id) });
  }

  if (doc.email) {
    keys.push({ type: 'email', value: normalizeEmail(doc.email) });
  }

  if (doc.phone) {
    keys.push({ type: 'phone', value: normalizePhone(doc.phone) });
  }

  return keys;
}

function validateUpdatePayload(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return { value: null, error: 'Each record must be an object' };
  }

  const keys = buildIdentifierKeys(item);
  if (keys.length === 0) {
    return { value: null, error: 'Each update record must include _id, email, or phone' };
  }

  const update = {};

  if (item.fullName != null) {
    if (typeof item.fullName !== 'string' || item.fullName.trim().length < 3) {
      return { value: null, error: 'fullName must be at least 3 characters' };
    }
    update.fullName = item.fullName.trim();
  }

  if (item.email != null) {
    const email = normalizeEmail(item.email);
    if (!email || !emailRegex.test(email)) {
      return { value: null, error: 'email must be a valid email address' };
    }
    update.email = email;
  }

  if (item.phone != null) {
    const phone = normalizePhone(item.phone);
    if (!phone || !phoneRegex.test(phone)) {
      return { value: null, error: 'phone must contain only numeric digits' };
    }
    update.phone = phone;
  }

  if (item.walletBalance != null) {
    const walletBalance = Number(item.walletBalance);
    if (!Number.isFinite(walletBalance) || walletBalance < 0) {
      return { value: null, error: 'walletBalance must be a number greater than or equal to 0' };
    }
    update.walletBalance = walletBalance;
  }

  if (item.isBlocked != null) {
    if (typeof item.isBlocked !== 'boolean') {
      return { value: null, error: 'isBlocked must be a boolean' };
    }
    update.isBlocked = item.isBlocked;
  }

  if (item.kycStatus != null) {
    if (!allowedKycStatuses.has(item.kycStatus)) {
      return { value: null, error: 'kycStatus must be Pending, Approved, or Rejected' };
    }
    update.kycStatus = item.kycStatus;
  }

  if (item.deviceInfo != null) {
    const deviceInfoResult = validateDeviceInfo(item.deviceInfo);
    if (deviceInfoResult.error) {
      return { value: null, error: deviceInfoResult.error };
    }
    if (deviceInfoResult.value) {
      update.deviceInfo = deviceInfoResult.value;
    }
  }

  if (Object.keys(update).length === 0) {
    return { value: null, error: 'At least one updatable field must be provided' };
  }

  return {
    value: { identifiers: keys, update },
    error: null,
  };
}

function detectDuplicateKey(existingMap, keys) {
  for (const key of keys) {
    const composite = `${key.type}:${key.value}`;
    if (existingMap.has(composite)) {
      return existingMap.get(composite);
    }
  }

  return null;
}

async function bulkCreateUsersService(payload) {
  if (!Array.isArray(payload) || payload.length === 0) {
    const error = new Error('Request body must be a non-empty array');
    error.statusCode = 400;
    throw error;
  }

  const failures = [];
  const normalizedDocs = [];
  const requestKeyMap = new Map();

  payload.forEach((item, index) => {
    const result = validateCreatePayload(item, index);
    if (result.error) {
      failures.push({ index, reason: result.error, input: item });
      return;
    }

    const duplicateEmail = requestKeyMap.get(`email:${result.value.email}`);
    const duplicatePhone = requestKeyMap.get(`phone:${result.value.phone}`);
    if (duplicateEmail != null || duplicatePhone != null) {
      failures.push({
        index,
        reason: 'Duplicate email or phone found within the request payload',
        input: item,
      });
      return;
    }

    requestKeyMap.set(`email:${result.value.email}`, index);
    requestKeyMap.set(`phone:${result.value.phone}`, index);
    normalizedDocs.push({ ...result.value, _requestIndex: index });
  });

  const emails = [...new Set(normalizedDocs.map((doc) => doc.email))];
  const phones = [...new Set(normalizedDocs.map((doc) => doc.phone))];

  if (emails.length > 0 || phones.length > 0) {
    const existingUsers = await User.find({
      $or: [
        ...(emails.length > 0 ? [{ email: { $in: emails } }] : []),
        ...(phones.length > 0 ? [{ phone: { $in: phones } }] : []),
      ],
    })
      .select('email phone')
      .lean();

    const occupiedKeys = new Map();
    existingUsers.forEach((user) => {
      occupiedKeys.set(`email:${user.email}`, true);
      occupiedKeys.set(`phone:${user.phone}`, true);
    });

    const insertableDocs = [];
    normalizedDocs.forEach((doc) => {
      const duplicateReason = detectDuplicateKey(occupiedKeys, [
        { type: 'email', value: doc.email },
        { type: 'phone', value: doc.phone },
      ]);

      if (duplicateReason) {
        failures.push({
          index: doc._requestIndex,
          reason: 'Email or phone already exists',
          input: {
            fullName: doc.fullName,
            email: doc.email,
            phone: doc.phone,
          },
        });
        return;
      }

      insertableDocs.push(doc);
    });

    normalizedDocs.length = 0;
    normalizedDocs.push(...insertableDocs);
  }

  let insertedUsers = [];
  if (normalizedDocs.length > 0) {
    const docsToInsert = normalizedDocs.map(({ _requestIndex, ...doc }) => doc);
    insertedUsers = await User.insertMany(docsToInsert, { ordered: false });
  }

  return {
    insertedCount: insertedUsers.length,
    failedCount: failures.length,
    insertedUsers,
    failedUsers: failures,
  };
}

async function bulkUpdateUsersService(payload) {
  if (!Array.isArray(payload) || payload.length === 0) {
    const error = new Error('Request body must be a non-empty array');
    error.statusCode = 400;
    throw error;
  }

  const failures = [];
  const validUpdates = [];
  const identifierQueries = [];
  const dedupeMap = new Map();

  payload.forEach((item, index) => {
    const result = validateUpdatePayload(item);
    if (result.error) {
      failures.push({ index, reason: result.error, input: item });
      return;
    }

    const primaryKey = result.value.identifiers.find(Boolean);
    const primaryIdentifier = primaryKey ? `${primaryKey.type}:${primaryKey.value}` : null;
    if (primaryIdentifier && dedupeMap.has(primaryIdentifier)) {
      failures.push({
        index,
        reason: 'Duplicate identifier found within the request payload',
        input: item,
      });
      return;
    }

    if (primaryIdentifier) {
      dedupeMap.set(primaryIdentifier, index);
    }

    validUpdates.push({ index, ...result.value });
    identifierQueries.push(...result.value.identifiers);
  });

  const lookupFilters = [];
  const objectIdValues = [];
  const emailValues = [];
  const phoneValues = [];

  identifierQueries.forEach((identifier) => {
    if (identifier.type === '_id' && mongoose.Types.ObjectId.isValid(identifier.value)) {
      objectIdValues.push(new mongoose.Types.ObjectId(identifier.value));
      return;
    }

    if (identifier.type === 'email') {
      emailValues.push(identifier.value);
      return;
    }

    if (identifier.type === 'phone') {
      phoneValues.push(identifier.value);
    }
  });

  if (objectIdValues.length > 0) {
    lookupFilters.push({ _id: { $in: objectIdValues } });
  }

  if (emailValues.length > 0) {
    lookupFilters.push({ email: { $in: [...new Set(emailValues)] } });
  }

  if (phoneValues.length > 0) {
    lookupFilters.push({ phone: { $in: [...new Set(phoneValues)] } });
  }

  const existingUsers = lookupFilters.length > 0
    ? await User.find({ $or: lookupFilters }).select('_id email phone').lean()
    : [];

  const existingLookup = new Map();
  existingUsers.forEach((user) => {
    existingLookup.set(`_id:${String(user._id)}`, user);
    existingLookup.set(`email:${user.email}`, user);
    existingLookup.set(`phone:${user.phone}`, user);
  });

  const updateOps = [];
  const acceptedUpdates = [];

  validUpdates.forEach(({ index, identifiers, update }) => {
    let matchedIdentifier = null;

    for (const identifier of identifiers) {
      if (identifier.type === '_id' && mongoose.Types.ObjectId.isValid(identifier.value)) {
        const existing = existingLookup.get(`_id:${identifier.value}`);
        if (existing) {
          matchedIdentifier = { filter: { _id: existing._id } };
          break;
        }
      }

      if (identifier.type === 'email') {
        const existing = existingLookup.get(`email:${identifier.value}`);
        if (existing) {
          matchedIdentifier = { filter: { email: existing.email } };
          break;
        }
      }

      if (identifier.type === 'phone') {
        const existing = existingLookup.get(`phone:${identifier.value}`);
        if (existing) {
          matchedIdentifier = { filter: { phone: existing.phone } };
          break;
        }
      }
    }

    if (!matchedIdentifier) {
      failures.push({
        index,
        reason: 'Target user not found',
        input: { ...update, identifiers },
      });
      return;
    }

    acceptedUpdates.push({ index, identifiers, update, filter: matchedIdentifier.filter });
    updateOps.push({
      updateOne: {
        filter: matchedIdentifier.filter,
        update: {
          $set: {
            ...update,
            updatedAt: new Date(),
          },
        },
      },
    });
  });

  if (updateOps.length === 0) {
    return {
      matchedCount: 0,
      modifiedCount: 0,
      failedCount: failures.length,
      failedUsers: failures,
    };
  }

  let bulkResult;
  try {
    bulkResult = await User.bulkWrite(updateOps, { ordered: false });
  } catch (error) {
    const writeErrors = Array.isArray(error?.writeErrors) ? error.writeErrors : [];
    writeErrors.forEach((writeError) => {
      const failedOperation = acceptedUpdates[writeError.index];
      failures.push({
        index: failedOperation?.index ?? writeError.index,
        reason: writeError.errmsg || error.message,
        input: failedOperation,
      });
    });

    bulkResult = error?.result || error?.writeResult || null;
  }

  return {
    matchedCount: bulkResult?.matchedCount || 0,
    modifiedCount: bulkResult?.modifiedCount || 0,
    failedCount: failures.length,
    failedUsers: failures,
  };
}

async function getUsersService(page = 1, limit = 10) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limitNum).lean(),
    User.countDocuments(),
  ]);

  return {
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
}

async function getUserByIdService(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid user ID');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(id).lean();
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function getUserByEmailService(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    const error = new Error('Invalid email format');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function getUserByPhoneService(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || !phoneRegex.test(normalizedPhone)) {
    const error = new Error('Invalid phone format');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ phone: normalizedPhone }).lean();
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

module.exports = {
  bulkCreateUsersService,
  bulkUpdateUsersService,
  getUsersService,
  getUserByIdService,
  getUserByEmailService,
  getUserByPhoneService,
};