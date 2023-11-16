const { UserInputError, AuthenticationError } = require('apollo-server')

const jwt = require('jsonwebtoken')

const config = require('./utils/config')

const Author = require('./modals/Author')
const Book = require('./modals/Book')
const User = require('./modals/User')

const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

const resolvers = {
  Query: {
    bookCount: async () => {
      const books = await Book.find({})
      return books.length
    },
    authorCount: async () => {
      const authors = await Author.find({})
      return authors.length
    },
    allBooks: async (root, args) => {
      let books = await Book.find({})
      if (args.author) {
        books = books.filter((book) => book.author === args.author)
      }
      if (args.genre) {
        books = books.filter((book) => book.genres.includes(args.genre))
      }
      return books
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      return authors
    },
    me: (_, args, context) => {
      return context.currentUser
    },
  },

  Author: {
    bookCount: async (root) => {
      const books = await Book.find({ author: root.id })
      return books.length
    },
  },

  Book: {
    author: async (root) => {
      const author = await Author.findById(root.author)
      return {
        name: author.name,
        id: author.id,
        born: author.born,
      }
    },
  },

  Mutation: {
    addBook: async (_, args, context) => {
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new AuthenticationError('not authenticated')
      }
      let author = await Author.findOne({ name: args.author })
      if (!author) {
        author = new Author({ name: args.author })
        await author.save()
      }
      const book = new Book({ ...args, author: author })
      try {
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      pubsub.publish('BOOK_ADDED', { bookAdded: book })
      return book
    },
    editAuthor: async (_, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('not authenticated')
      }
      let author = await Author.findOne({ name: args.name })
      if (!author) {
        return null
      }
      author.born = args.setBornTo
      try {
        await author.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      return author
    },
    createUser: async (_, args) => {
      const user = await new User({ ...args })
      try {
        await user.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      return user
    },
    login: async (_, args) => {
      const user = await User.findOne({ username: args.username })
      if (!user || args.password !== config.USER_PASSWORD) {
        throw new UserInputError('wrong credentials')
      }
      const userForToken = {
        username: user.username,
        id: user._id,
      }
      return { value: jwt.sign(userForToken, config.JWT_SECRET) }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
  },
}

module.exports = resolvers
