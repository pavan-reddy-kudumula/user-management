function createUserRecord(index) {
  const sequence = String(index + 1).padStart(5, '0');
  const deviceTypes = ['Mobile', 'Desktop'];
  const operatingSystems = ['Android', 'iOS', 'Windows', 'macOS'];

  return {
    fullName: `User ${sequence}`,
    email: `user${sequence}@example.com`,
    phone: `${9000000000 + index}`,
    walletBalance: index % 2 === 0 ? index : 0,
    isBlocked: index % 17 === 0,
    kycStatus: index % 3 === 0 ? 'Approved' : 'Pending',
    deviceInfo: {
      ipAddress: `10.0.${Math.floor(index / 255)}.${index % 255}`,
      deviceType: deviceTypes[index % deviceTypes.length],
      os: operatingSystems[index % operatingSystems.length],
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function createUserRecords(count) {
  return Array.from({ length: count }, (_, index) => createUserRecord(index));
}

module.exports = { createUserRecord, createUserRecords };