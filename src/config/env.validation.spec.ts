import { validate } from './env.validation';

const baseEnv = {
  NODE_ENV: 'test',
  PORT: '3000',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'task_manager',
  JWT_SECRET: 'test-secret',
  JWT_EXPIRES_IN: '1h',
};

describe('env validation', () => {
  it('passes with a complete, valid environment and coerces numbers', () => {
    const result = validate({ ...baseEnv });
    expect(result.PORT).toBe(3000);
    expect(result.DB_PORT).toBe(5432);
    expect(result.DB_HOST).toBe('localhost');
    expect(typeof result.PORT).toBe('number');
  });

  it('throws when a required variable is missing', () => {
    const { DB_HOST: _omitted, ...missing } = baseEnv;
    expect(() => validate(missing)).toThrow(/Invalid environment configuration/);
  });

  it('throws when PORT is not a valid integer', () => {
    expect(() => validate({ ...baseEnv, PORT: 'not-a-number' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('throws when NODE_ENV is not an allowed value', () => {
    expect(() => validate({ ...baseEnv, NODE_ENV: 'staging' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
