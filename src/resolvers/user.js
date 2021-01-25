import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import {
  AuthenticationError,
  UserInputError,
} from 'apollo-server-express';
import { isAdmin } from './authorization';
import { combine } from 'graphql-resolvers';
import { combineResolvers } from 'graphql-resolvers/lib/combineResolvers';

const createToken = async (user, secret, expiresIn) => {
  const { id, username, email, role } = user;
  return await jwt.sign({ id, email, username, role }, secret, {
    expiresIn,
  });
};
export default {
  Query: {
    users: async (parent, args, { models }) => {
      return await models.User.findAll();
    },
    me: async (parent, args, { models, me }) => {
      if (!me) {
        return null;
      }
      return await models.User.findByPk(me.id);
    },
    user: async (parent, { id }, { models }) => {
      return await models.User.findByPk(id);
    },
  },
  Mutation: {
    signup: async (
      parent,
      { username, email, password },
      { models, secret },
    ) => {
      const user = await models.User.create({
        username,
        email,
        password,
      });

      return { token: createToken(user, secret, '30m') };
    },
    signIn: async (
      parent,
      { login, password },
      { models, secret },
    ) => {
      const user = await models.User.findByLogin(login);
      if (!user) {
        throw new UserInputError(
          'No user found with this login credentials',
        );
      }
      const isValid = await user.validatePassword(password);
      if (!isValid) {
        throw new AuthenticationError('Invalid Password');
      }
      return { token: createToken(user, secret, '30m') };
    },
    deleteUser: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        return await models.User.destroy({ where: { id } });
      },
    ),
  },

  User: {
    messages: async (user, args, { models }) => {
      return await models.Message.findAll({
        where: {
          userId: user.id,
        },
      });
    },
  },
};
