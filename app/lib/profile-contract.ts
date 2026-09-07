export const PROFILE_FIELDS = ["nameAndNickname", "team", "gender"] as const;

export type ProfileField = (typeof PROFILE_FIELDS)[number];
export type Profile = Record<ProfileField, string>;

export const INITIAL_PROFILE: Profile = {
  nameAndNickname: "",
  team: "",
  gender: "ไม่ระบุ",
};
