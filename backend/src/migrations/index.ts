import * as migration_20260620_122130_init from './20260620_122130_init';

export const migrations = [
  {
    up: migration_20260620_122130_init.up,
    down: migration_20260620_122130_init.down,
    name: '20260620_122130_init'
  },
];
