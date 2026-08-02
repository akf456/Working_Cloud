import { base44 } from '@/api/base44Client';

const STRIP_KEYS = ['id', 'created_date', 'updated_date', 'created_by_id', 'created_by', 'entity_name', 'app_id', 'is_sample', 'is_deleted', 'deleted_date', 'environment'];

export async function trashItem(entityType, record, area = 'school') {
  const name = record.title || record.name || 'Untitled';
  await base44.entities.TrashItem.create({
    entity_type: entityType,
    name,
    snapshot: JSON.stringify(record),
    deleted_date: new Date().toISOString(),
    area,
  });
  await base44.entities[entityType].delete(record.id);
}

export async function restoreItem(item) {
  const data = JSON.parse(item.snapshot);
  STRIP_KEYS.forEach((k) => delete data[k]);
  await base44.entities[item.entity_type].create(data);
  await base44.entities.TrashItem.delete(item.id);
}

export async function purgeItem(item) {
  await base44.entities.TrashItem.delete(item.id);
}