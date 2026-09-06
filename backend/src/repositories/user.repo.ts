import { UserModel } from "../models/User";

type CreateUserInput = {
  name: string;
  email: string;
  password?: string | null;
  isGuest?: boolean;
};

type UpgradeUserInput = {
  name: string;
  email: string;
  password: string;
};

export const userRepo = {
  async create(input: CreateUserInput) {
    return UserModel.create({
      name: input.name,
      email: input.email,
      password: input.password ?? null,
      isGuest: input.isGuest ?? false,
    });
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
      { $set: { password } },
      { new: true }
    ).exec();
  },

  async upgradeGuest(userId: string, input: UpgradeUserInput) {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: input.name,
          email: input.email.toLowerCase().trim(),
          password: input.password,
          isGuest: false,
        },
      },
      { new: true }
    ).exec();
  },
};
