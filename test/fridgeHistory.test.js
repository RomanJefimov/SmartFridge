const mongoose = require('mongoose');

// Mock Mongoose for unit tests
jest.mock('mongoose', () => {
  // Define ValidationError directly inside the mock
  class MockValidationError extends Error {
      constructor(errorObject) {
          super('ValidationError');
          this.errors = errorObject.errors;
          this.name = 'ValidationError';
          this.message = errorObject.message || 'Validation Failed';
      }
  }

  const mockedMongoose = {
    Types: { // Add Types for ObjectId
        ObjectId: class MockObjectId {
            constructor(id) {
                this.id = id;
            }
            toString() { return this.id; }
            static isValid(id) {
                return typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);
            }
            get name() { return 'ObjectId'; } // Add name getter
        }
    },
    Error: {
      ValidationError: MockValidationError
    }
  };

  const MockSchemaFunction = jest.fn().mockImplementation((schema, options) => {
    const mockSchema = {
      // Simulate schema, but use original schema for validation and defaults
      originalSchema: schema,
      pre: jest.fn(),
      statics: {},
      methods: {},
      loadClass: jest.fn(),
      path: jest.fn(),
      eachPath: jest.fn((cb) => {
          const traverseSchema = (currentSchema, prefix = '') => {
            for (const key in currentSchema) {
                const field = currentSchema[key];
                const fullPath = prefix ? `${prefix}.${key}` : key;

                if (field && typeof field === 'object' && !Array.isArray(field)) {
                    if (field.type && field.type.name === 'ObjectId') {
                        cb(fullPath, { isRequired: !!field.required, type: field.type });
                    } else if (field.type === String || field.type === Number || field.type === Date || field.type === Boolean) {
                        cb(fullPath, {
                            isRequired: !!field.required,
                            unique: !!field.unique,
                            enumValues: field.enum,
                            defaultValue: field.default,
                            type: field.type
                        });
                    } else if (Array.isArray(field) && field.length > 0 && typeof field[0] === 'object' && field[0].type) {
                        cb(fullPath, {
                            isRequired: !!field.required,
                            schema: { eachPath: (subCb) => traverseSchema(field[0], subCb) },
                            type: [Object]
                        });
                    } else if (typeof field === 'object' && Object.keys(field).length > 0 && !field.type) {
                        traverseSchema(field, fullPath);
                    }
                } else if (field === String || field === Number || field === Date || field === Boolean) {
                    cb(fullPath, { isRequired: false, type: field });
                } else if (Array.isArray(field)) {
                     if (field.length > 0 && (field[0] === String || field[0] === Number || field[0] === Date || field[0] === Boolean)) {
                        cb(fullPath, { isRequired: false, type: [field[0]] });
                     } else if (field.length > 0 && typeof field[0] === 'object') {
                        cb(fullPath, {
                            isRequired: !!field.required,
                            schema: { eachPath: (subCb) => traverseSchema(field[0], subCb) },
                            type: [Object]
                        });
                     }
                }
            }
          };
          traverseSchema(schema);
        }),
        add: jest.fn(),
      };

      // Attach Types.ObjectId so mongoose.Schema.Types.ObjectId is available
      mockSchema.Types = mockedMongoose.Types;

      mockSchema.validate = function(data) {
          const validationErrors = {};

          const validateField = (fieldSchema, value, path) => {
              // Ensure fieldSchema is valid before accessing .required
              if (!fieldSchema || typeof fieldSchema !== 'object') return;

              if (fieldSchema.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
                  validationErrors[path] = { message: `${path} is required`, kind: 'required', path: path };
              }
              if (fieldSchema.enum && value !== undefined && !fieldSchema.enum.includes(value)) {
                  validationErrors[path] = { message: `${path} is not a valid enum value`, kind: 'enum', path: path };
              }
              if (fieldSchema.type && fieldSchema.type.name === 'ObjectId' && value !== undefined && !mockedMongoose.Types.ObjectId.isValid(value)) {
                  validationErrors[path] = { message: `${path} is not a valid ObjectId`, kind: 'ObjectId', path: path };
              }
          };

          const recursiveValidate = (currentSchema, currentData, prefix = '') => {
            // If currentData is undefined, create empty object for required field checks
            const dataToValidate = currentData || {};

            for (const key in currentSchema) {
                const fieldSchema = currentSchema[key];
                const fullPath = prefix ? `${prefix}.${key}` : key;
                const value = dataToValidate[key];

                // Required field validation
                if (fieldSchema && fieldSchema.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
                   validateField(fieldSchema, value, fullPath);
                }

                if (fieldSchema && typeof fieldSchema === 'object' && !Array.isArray(fieldSchema)) {
                    if (fieldSchema.type && (fieldSchema.type.name === 'ObjectId' || fieldSchema.type === String || fieldSchema.type === Number || fieldSchema.type === Date || fieldSchema.type === Boolean)) {
                        validateField(fieldSchema, value, fullPath);
                    } else if (Array.isArray(fieldSchema) && fieldSchema.length > 0 && typeof fieldSchema[0] === 'object' && fieldSchema[0].type) {
                        if (fieldSchema.required && (!value || value.length === 0)) {
                             validationErrors[fullPath] = { message: `${fullPath} is required`, kind: 'required', path: fullPath };
                        }
                        if (Array.isArray(value)) {
                            value.forEach((item, index) => {
                                recursiveValidate(fieldSchema[0], item, `${fullPath}.${index}`);
                            });
                        }
                    } else if (typeof fieldSchema === 'object' && Object.keys(fieldSchema).length > 0 && !fieldSchema.type) {
                        recursiveValidate(fieldSchema, value, fullPath);
                    }
                } else if (fieldSchema === String || fieldSchema === Number || fieldSchema === Date || fieldSchema === Boolean) {
                    validateField({ type: fieldSchema }, value, fullPath);
                } else if (Array.isArray(fieldSchema)) {
                    if (fieldSchema.required && (!value || value.length === 0)) {
                         validationErrors[fullPath] = { message: `${fullPath} is required`, kind: 'required', path: fullPath };
                    }
                }
            }
          };

          recursiveValidate(mockSchema.originalSchema, data); // Use originalSchema for traversal

          if (Object.keys(validationErrors).length > 0) {
              return { message: 'Validation Failed', errors: validationErrors };
          }
          return null;
      };
      return mockSchema;
    });

  // Attach static Types property to the MockSchemaFunction
  MockSchemaFunction.Types = mockedMongoose.Types;

  return { // Return full mocked mongoose object
    ...mockedMongoose, // Copy Types and Error
    Schema: MockSchemaFunction, // Use custom Schema mock
    model: jest.fn((name, schema) => {
      class MockModel {
        constructor(data) {
          const mergedData = { ...data };

          const applyDefaults = (currentSchema, currentData) => {
              for (const key in currentSchema) {
                  const fieldSchema = currentSchema[key];
                  if (fieldSchema && fieldSchema.hasOwnProperty('default') && currentData[key] === undefined) {
                      currentData[key] = fieldSchema.default;
                  } else if (fieldSchema && typeof fieldSchema === 'object' && !Array.isArray(fieldSchema) && !fieldSchema.type && currentData[key] && typeof currentData[key] === 'object') {
                      applyDefaults(fieldSchema, currentData[key]);
                  } else if (Array.isArray(fieldSchema) && fieldSchema.length > 0 && typeof fieldSchema[0] === 'object' && currentData[key] && Array.isArray(currentData[key])) {
                      currentData[key].forEach(item => applyDefaults(fieldSchema[0], item));
                  }
              }
          };

          applyDefaults(schema.originalSchema, mergedData);

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
          return Promise.resolve(this);
        }

        static findOne = jest.fn(() => Promise.resolve(null));
        static create = jest.fn((data) => Promise.resolve(new MockModel(data)));
      }

      MockModel.schema = schema;
      return MockModel;
    })
  };
});

// Move FridgeHistory import inside beforeAll
let FridgeHistory;

// Tests for FridgeHistory model
describe('FridgeHistory Model Unit Tests', () => {
    let schemaCall;
    let mockUserId;

    beforeAll(() => {
        // Load mocked mongoose model
        FridgeHistory = require('../model/fridgeHistory');

        // Generate valid ObjectId using mocked mongoose.Types.ObjectId
        mockUserId = new mongoose.Types.ObjectId().toString();

        // Because of how jest.mock works, mongoose.Schema is called only once for the whole test run
        // So we need to find the correct call
        const calls = mongoose.Schema.mock.calls;

        // Find schema call that contains 'userId' field (unique for FridgeHistory)
        schemaCall = calls.find(call => call[0].hasOwnProperty('userId'))[0];
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserId = new mongoose.Types.ObjectId().toString(); // Recreate mockUserId for each test
    });

    test('should require userId field', async () => {
        const historyData = {
            products: [{ name: 'Milk' }]
        };

        const history = new FridgeHistory(historyData);

        await expect(history.save()).rejects.toThrow(mongoose.Error.ValidationError);
        await expect(history.save()).rejects.toMatchObject({
            errors: {
                userId: { message: 'userId is required' }
            }
        });
    });
});