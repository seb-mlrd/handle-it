import type { LabelResponse } from '@handle-it/contracts';
import type { Label } from './label.entity.js';

export function presentLabel(label: Label): LabelResponse {
  return { id: label.getId(), name: label.getName(), color: label.getColor() };
}
