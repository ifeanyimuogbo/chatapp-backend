import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import schema from './schema';
import resolvers from './resolvers';
import models, { sequelize } from './models';
import jwt from 'jsonwebtoken';
import http from 'http';
import {
  ApolloServer,
  AuthenticationError,
} from 'apollo-server-express';
import DataLoader from 'dataloader';
import loader from './loaders';

const app = express();
app.use(cors());

const getMe = async (req) => {
  const token = req.headers['x-token'];
  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (error) {
      throw new AuthenticationError(
        'Your session expired. Try again',
      );
    }
  }
};

const PORT = process.env.PORT || 8000;
const server = new ApolloServer({
  introspection: true,
  playground: true,
  typeDefs: schema,
  resolvers,
  context: async ({ req, connection }) => {
    if (connection) {
      return {
        models,
        loaders: {
          user: new DataLoader((keys) =>
            loader.user.batchUsers(keys, models),
          ),
        },
      };
    }
    if (req) {
      const me = await getMe(req);
      return {
        models,
        me,
        secret: process.env.SECRET,
        loaders: {
          user: new DataLoader((keys) =>
            loader.user.batchUsers(keys, models),
          ),
        },
      };
    }
  },
  formatError: (error) => {
    // remove the internal sequelize error message
    // leave only the important validation error
    const message = error.message
      .replace('SequelizeValidationError: ', '')
      .replace('Validation error: ', '');
    return { ...error, message };
  },
});
server.applyMiddleware({ app, path: '/graphql' });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const isTest = !!process.env.TEST_DATABASE;
const isProduction = !!process.env.DATABASE_URL;
sequelize.sync({ force: isTest || isProduction }).then(async () => {
  if (isTest || isProduction) {
    createUsersWithMessages(new Date());
  }
  httpServer.listen({ port: 8000 }, () => {
    console.log('Apollo Server on http://localhost:8000/graphql');
  });
});

// console.log(models);
// console.log(models.User.findAll);
//seed database
const createUsersWithMessages = async (date) => {
  await models.User.create(
    {
      id: '1',
      username: 'Muogbo',
      email: 'hello@ifeanyimuogbo.tech',
      password: 'muogboi',
      role: 'ADMIN',
      messages: [
        {
          text: 'Published an article to Hashnode',
          createdAt: date.setSeconds(date.getSeconds() + 1),
        },
      ],
    },
    {
      include: [models.Message],
    },
  );
  await models.User.create(
    {
      id: '2',
      username: 'ddavids',
      email: 'hello@ddavids.com',
      password: 'ddavids',
      messages: [
        {
          text: 'Happy to release ...',
          createdAt: date.setSeconds(date.getSeconds() + 1),
        },
        {
          text: 'Published a complete ...',
          createdAt: date.setSeconds(date.getSeconds() + 1),
        },
      ],
    },
    {
      include: [models.Message],
    },
  );
};
