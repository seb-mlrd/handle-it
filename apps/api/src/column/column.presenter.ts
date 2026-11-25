import type { ColumnResponse } from '@handle-it/contracts';
import type { Column } from './column.entity.js';

export function presentColumn(column: Column): ColumnResponse {
  return { id: column.getId(), name: column.getName() };
}
