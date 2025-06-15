const { buildSchema } = require("graphql");

const schema = buildSchema(`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    createdAt: String!
    updatedAt: String!
    posts: [Post!]
    comments: [Comment!]
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    user: User!
    userId: ID!
    comments: [Comment!]
    commentCount: Int!
  }

  type Comment {
    id: ID!
    comment: String!
    createdAt: String!
    updatedAt: String!
    user: User!
    post: Post!
    userId: ID!
    postId: ID!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
    message: String!
  }

  type PostsConnection {
    posts: [Post!]!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type CommentsConnection {
    comments: [Comment!]!
    totalCount: Int!
  }

  type PostPayload {
    post: Post!
    message: String!
  }

  type CommentPayload {
    comment: Comment!
    message: String!
  }

  type DeletePayload {
    success: Boolean!
    message: String!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: String = "pembaca"
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreatePostInput {
    title: String!
    content: String!
    status: String = "draft"
  }

  input UpdatePostInput {
    title: String
    content: String
    status: String
  }

  input CreateCommentInput {
    postId: ID!
    comment: String!
  }

  input UpdateCommentInput {
    comment: String!
  }

  type Query {
    # User queries
    me: User
    users: [User!]!
    user(id: ID!): User

    # Post queries
    posts(
      limit: Int = 10
      offset: Int = 0
      status: String
      userId: ID
    ): PostsConnection!
    post(id: ID!): Post
    myPosts: [Post!]!

    # Comment queries
    comments(postId: ID!, limit: Int = 10, offset: Int = 0): CommentsConnection!
    comment(id: ID!): Comment
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Post mutations
    createPost(input: CreatePostInput!): PostPayload!
    updatePost(id: ID!, input: UpdatePostInput!): PostPayload!
    deletePost(id: ID!): DeletePayload!

    # Comment mutations
    createComment(input: CreateCommentInput!): CommentPayload!
    updateComment(id: ID!, input: UpdateCommentInput!): CommentPayload!
    deleteComment(id: ID!): DeletePayload!
  }
`);

module.exports = schema;
