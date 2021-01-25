import { ForbiddenError } from 'apollo-server-express';
import { skip, combineResolvers } from 'graphql-resolvers';

export const isAuthenticated = (parent, { id }, { me }) =>
  me ? skip : new ForbiddenError('Not authenticated as user');
export const isAdmin = combineResolvers(
  isAuthenticated,
  (parent, args, { me: { role } }) =>
    role === 'ADMIN'
      ? skip
      : new ForbiddenError('Not authorized as admin'),
);
export const isMessageOwner = async (
  parent,
  args,
  { models, me },
) => {
  const message = await models.Message.findByPk(id, { raw: true });
  if (message.userId !== me.id) {
    throw new ForbiddenError('Not authenticated as owner');
  }
  return skip;
};
