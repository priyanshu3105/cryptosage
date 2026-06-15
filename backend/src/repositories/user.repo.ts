import { UserModel } from "../models/User";

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export const userRepo = {
  async create(input: CreateUserInput) {
    return UserModel.create(input);
  },

  async findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase().trim() }).exec();
  },

  async findById(userId: string) {
    return UserModel.findById(userId).exec();
  },

  async deleteById(userId: string) {
    return UserModel.findByIdAndDelete(userId).exec();
  },

  async updatePassword(userId: string, password: string) {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: { password },
      },
      { new: true }
    ).exec();
  },
};
