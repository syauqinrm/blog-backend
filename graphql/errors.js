const { GraphQLError } = require("graphql");

class AuthenticationError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    });
  }
}

class ForbiddenError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "FORBIDDEN",
        http: { status: 403 },
      },
    });
  }
}

class NotFoundError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "NOT_FOUND",
        http: { status: 404 },
      },
    });
  }
}

class ValidationError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "BAD_USER_INPUT",
        http: { status: 400 },
      },
    });
  }
}

module.exports = {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
};
