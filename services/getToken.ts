"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function getToken() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    throw { message: "User not found" };
  }
  // Get the OAuth access token for the user
  const provider = "github";
  const client = await clerkClient();
  const clerkResponse = await client.users.getUserOauthAccessToken(
    userId,
    provider
  );

  const accessToken = clerkResponse.data[0] || "";
  if (!accessToken) {
    return { message: "Access token not found", status: 401 };
  }
  return { token: accessToken.token };
}
