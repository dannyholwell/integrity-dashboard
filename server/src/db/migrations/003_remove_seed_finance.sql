DELETE FROM core_transaction
WHERE id IN (
  'txn-salary-001',
  'txn-rent-001',
  'txn-groceries-001',
  'txn-recovery-001',
  'txn-rent-topup-001',
  'txn-subscriptions-001',
  'txn-discretionary-001',
  'txn-groceries-002',
  'txn-recovery-002',
  'txn-rent-annual-001',
  'txn-discretionary-002',
  'txn-savings-snapshot-001'
)
AND source_system = 'manual';

DELETE FROM core_account
WHERE id IN ('acct-checking', 'acct-savings')
AND source_system = 'manual';
