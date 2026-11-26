import { activityDetailsSchema } from '@handle-it/contracts';
import { expect, it } from 'vitest';
import { describeActivity } from './activity-sentence';

const SAMPLES = {
  'board-renamed': { boardName: 'Maison' },
  'column-created': { columnName: 'À faire' },
  'column-renamed': { columnName: 'À faire' },
  'column-moved': { columnName: 'À faire' },
  'column-deleted': { columnName: 'À faire' },
  'card-created': { cardTitle: 'Pain', columnName: 'À faire' },
  'card-updated': { cardTitle: 'Pain' },
  'card-moved': { cardTitle: 'Pain', columnName: 'Fait' },
  'card-deleted': { cardTitle: 'Pain' },
  'label-created': { labelName: 'Urgent' },
  'label-updated': { labelName: 'Urgent' },
  'label-deleted': { labelName: 'Urgent' },
  'card-label-added': { cardTitle: 'Pain', labelName: 'Urgent' },
  'card-label-removed': { cardTitle: 'Pain', labelName: 'Urgent' },
  'member-joined': {},
  'member-left': {},
  'member-removed': { memberName: 'Bob' },
};

it('décrit chaque type d’historique du contrat, avec les noms donnés', () => {
  const types = activityDetailsSchema.options.map((option) => option.shape.type.value);
  expect(Object.keys(SAMPLES).sort()).toEqual([...types].sort());
  for (const [type, fields] of Object.entries(SAMPLES)) {
    const sentence = describeActivity(activityDetailsSchema.parse({ type, ...fields }));
    expect(sentence).toMatch(/^a /);
    for (const value of Object.values(fields)) expect(sentence).toContain(value);
  }
});

it('construit une phrase complète', () => {
  const details = { type: 'card-moved', cardTitle: 'Pain', columnName: 'Fait' } as const;
  expect(describeActivity(details)).toBe('a déplacé la carte « Pain » vers « Fait »');
});
