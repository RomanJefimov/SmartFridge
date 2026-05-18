const mongoose = require('mongoose');

// Mock Mongoose for unit tests
jest.mock('mongoose', () => {
  // Define ValidationError directly inside the mock
  class MockValidationError extends Error {
      constructor(errorObject) {
          super('ValidationError');
          // Mongoose ValidationError contains `.errors` object
          this.errors = errorObject.errors;
          this.name = 'ValidationError';
          this.message = errorObject.message || 'Validation Failed';
      }
  }

  const mockedMongoose = {
    Schema: jest.fn().mockImplementation((schema, options) => {
      const mockSchema = {
        ...schema,
        pre: jest.fn(), // Mock pre-hooks if used
        statics: {},
        methods: {},
        loadClass: jest.fn(),
        path: jest.fn(),
        eachPath: jest.fn((cb) => {
          // Iterate over schema fields to simulate eachPath
          for (const key in schema) {
            if (
              schema[key] &&
              typeof schema[key] === 'object' &&
              !Array.isArray(schema[key]) &&
              schema[key].type
            ) {
                cb(key, {
                    isRequired: !!schema[key].required,
                    unique: !!schema[key].unique,
                    enumValues: schema[key].enum,
                    defaultValue: schema[key].default
                });
            } else if (
              key === 'profile' &&
              schema.profile &&
              typeof schema.profile === 'object' &&
              !Array.isArray(schema.profile)
            ) {
                for (const profileKey in schema.profile) {
                    const field = schema.profile[profileKey];
                    if (field && typeof field === 'object' && !Array.isArray(field) && field.type) {
                        cb(`profile.${profileKey}`, {
                            isRequired: !!field.required,
                            unique: !!field.unique,
                            enumValues: field.enum,
                            defaultValue: field.default
                        });
                    }
                }
            }
          }
        }),
        add: jest.fn(),
        originalSchema: schema // Keep original schema for default values access
      };

      // Validate returns object compatible with Mongoose ValidationError structure
      mockSchema.validate = function(data) {
          const validationErrors = {};

          // Top-level field validation
          for (const key in schema) {
              const field = schema[key];
              if (
                field &&
                typeof field === 'object' &&
                !Array.isArray(field) &&
                field.type
              ) {
                  if (
                    field.required &&
                    (data[key] === undefined || data[key] === null || data[key] === '')
                  ) {
                      validationErrors[key] = {
                        message: `${key} is required`,
                        kind: 'required',
                        path: key
                      };
                  }

                  if (
                    field.enum &&
                    data[key] !== undefined &&
                    !field.enum.includes(data[key])
                  ) {
                      validationErrors[key] = {
                        message: `${key} is not a valid enum value`,
                        kind: 'enum',
                        path: key
                      };
                  }
              }
          }

          // Profile field validation
          if (schema.profile && typeof schema.profile === 'object' && data.profile) {
              for (const key in schema.profile) {
                  const field = schema.profile[key];

                  if (
                    field &&
                    typeof field === 'object' &&
                    !Array.isArray(field) &&
                    field.type
                  ) {
                      if (
                        field.required &&
                        (data.profile[key] === undefined ||
                         data.profile[key] === null ||
                         data.profile[key] === '')
                      ) {
                          validationErrors[`profile.${key}`] = {
                            message: `profile.${key} is required`,
                            kind: 'required',
                            path: `profile.${key}`
                          };
                      }

                      if (
                        field.enum &&
                        data.profile[key] !== undefined &&
                        !field.enum.includes(data.profile[key])
                      ) {
                          validationErrors[`profile.${key}`] = {
                            message: `profile.${key} is not a valid enum value`,
                            kind: 'enum',
                            path: `profile.${key}`
                          };
                      }
                  }
              }
          }

          if (Object.keys(validationErrors).length > 0) {
              return {
                message: 'User validation failed',
                errors: validationErrors
              };
          }

          return null;
      };

      return mockSchema;
    }),

    model: jest.fn((name, schema) => {
      class MockModel {
        constructor(data) {
          // Apply default values
          const mergedData = { ...data };

          for (const key in schema.originalSchema) {
              if (
                schema.originalSchema[key] &&
                schema.originalSchema[key].hasOwnProperty('default') &&
                mergedData[key] === undefined
              ) {
                  mergedData[key] = schema.originalSchema[key].default;
              }

              // Handle nested defaults for profile
              if (
                key === 'profile' &&
                schema.originalSchema.profile &&
                typeof schema.originalSchema.profile === 'object'
              ) {
                  if (!mergedData.profile) mergedData.profile = {};

                  for (const profileKey in schema.originalSchema.profile) {
                      const field = schema.originalSchema.profile[profileKey];

                      if (
                        field &&
                        field.hasOwnProperty('default') &&
                        mergedData.profile[profileKey] === undefined
                      ) {
                          mergedData.profile[profileKey] = field.default;
                      }
                  }
              }
          }

          const validationResult = schema.validate(mergedData);

          if (validationResult) {
              this.validationError = new MockValidationError(validationResult);
          }

          Object.assign(this, mergedData);
        }

        async save() {
          if (this.validationError) {
              throw this.validationError;
          }

          // Simulate uniqueness check for email
          if (this.email) {
              const existingUser = await this.constructor.findOne({
                email: this.email
              });

              if (existingUser) {
                  // Simplified uniqueness simulation
                  // (real Mongoose would throw a duplicate key error)
              }
          }

          return Promise.resolve(this);
        }

        static findOne = jest.fn(() => Promise.resolve(null));
      }

      MockModel.schema = schema;
      return MockModel;
    }),

    Error: {
      ValidationError: MockValidationError
    }
  };

  return mockedMongoose;
});

// Move User model import inside beforeAll so Jest can properly mock mongoose
let User;

// User model unit tests
describe('User Model Unit Tests', () => {
    let schemaCall;

    beforeAll(() => {
        User = require('../model/User');

        // Ensure mongoose.Schema was called
        expect(mongoose.Schema).toHaveBeenCalledTimes(1);
        schemaCall = mongoose.Schema.mock.calls[0][0];
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should define the User schema correctly', () => {
        expect(schemaCall.email).toBeDefined();
        expect(schemaCall.email.type).toBe(String);
        expect(schemaCall.email.required).toBe(true);
        expect(schemaCall.email.unique).toBe(true);
        expect(schemaCall.email.lowercase).toBe(true);

        expect(schemaCall.passwordHash).toBeDefined();
        expect(schemaCall.passwordHash.type).toBe(String);
        expect(schemaCall.passwordHash.required).toBe(true);

        expect(schemaCall.role).toBeDefined();
        expect(schemaCall.role.type).toBe(String);
        expect(schemaCall.role.enum).toEqual(['user', 'admin']);
        expect(schemaCall.role.default).toBe('user');

        expect(schemaCall.profile).toBeDefined();
        expect(schemaCall.profile.name.type).toBe(String);
        expect(schemaCall.profile.goal.enum).toEqual([
            'weight_loss',
            'muscle_gain',
            'healthy_eating',
            ''
        ]);
    });

    test('should validate a user with valid data', async () => {
        const userData = {
            email: 'test@example.com',
            passwordHash: 'hashedpassword123',
            profile: {
                name: 'Test User'
            }
        };

        const user = new User(userData);

        await expect(user.save()).resolves.toEqual(
            expect.objectContaining(userData)
        );
    });

    test('should set default role to "user" if not provided', async () => {
        const userData = {
            email: 'test2@example.com',
            passwordHash: 'hashedpassword123'
        };

        const user = new User(userData);

        await expect(user.save()).resolves.toEqual(
            expect.objectContaining({
                ...userData,
                role: 'user'
            })
        );
    });

    test('should require email field', async () => {
        const userData = {
            passwordHash: 'hashedpassword123'
        };

        const user = new User(userData);

        await expect(user.save()).rejects.toThrow(
            mongoose.Error.ValidationError
        );

        await expect(user.save()).rejects.toMatchObject({
            errors: {
                email: {
                    message: 'email is required'
                }
            }
        });
    });

    test('should require passwordHash field', async () => {
        const userData = {
            email: 'test3@example.com'
        };

        const user = new User(userData);

        await expect(user.save()).rejects.toThrow(
            mongoose.Error.ValidationError
        );

        await expect(user.save()).rejects.toMatchObject({
            errors: {
                passwordHash: {
                    message: 'passwordHash is required'
                }
            }
        });
    });

    test('should not allow invalid role enum value', async () => {
        const userData = {
            email: 'test4@example.com',
            passwordHash: 'hashedpassword123',
            role: 'superadmin'
        };

        const user = new User(userData);

        await expect(user.save()).rejects.toThrow(
            mongoose.Error.ValidationError
        );

        await expect(user.save()).rejects.toMatchObject({
            errors: {
                role: {
                    message: 'role is not a valid enum value'
                }
            }
        });
    });

    test('should not allow invalid profile.goal enum value', async () => {
        const userData = {
            email: 'test5@example.com',
            passwordHash: 'hashedpassword123',
            profile: {
                goal: 'gain_weight'
            }
        };

        const user = new User(userData);

        await expect(user.save()).rejects.toThrow(
            mongoose.Error.ValidationError
        );

        await expect(user.save()).rejects.toMatchObject({
            errors: {
                'profile.goal': {
                    message: 'profile.goal is not a valid enum value'
                }
            }
        });
    });

    test('should call findOne for uniqueness check during save', async () => {
        User.findOne.mockImplementationOnce(() =>
            Promise.resolve(null)
        );

        const userData = {
            email: 'new@example.com',
            passwordHash: 'newhashedpassword'
        };

        const user = new User(userData);

        await expect(user.save()).resolves.toBeDefined();

        expect(User.findOne).toHaveBeenCalledWith({
            email: 'new@example.com'
        });

        expect(User.findOne).toHaveBeenCalledTimes(1);
    });
});