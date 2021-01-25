import { expect } from 'chai';
import * as userApi from './api';

describe('users', () => {
  describe('user(id: String!): User', () => {
    it('returns a user when user can be found', async () => {
      const expectedResult = {
        data: {
          user: {
            id: '2',
            username: 'ddavids',
            role: null,
            email: 'hello@ddavids.com',
          },
        },
      };
      const result = await userApi.user({ id: '2' });
      expect(result.data).to.eql(expectedResult);
    });
    it('returns null when user cannot be found', async () => {
      const expectedResult = {
        data: {
          user: null,
        },
      };
      const result = await userApi.user({ id: '42' });

      expect(result.data).to.eql(expectedResult);
    });
  });
  describe('deleteUser(id: String!): Boolean!', () => {
    it('returns an error because only admins can delete a user', async () => {
      const {
        data: {
          data: {
            signIn: { token },
          },
        },
      } = await userApi.signIn({
        login: 'ddavids',
        password: 'ddavids',
      });
      const {
        data: { errors },
      } = userApi.deleteUser({ id: '2', token });

      expect(errors[0].message).to.eql('Not authorized as admin');
    });
  });
});
