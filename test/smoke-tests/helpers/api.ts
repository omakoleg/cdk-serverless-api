import Axios, { AxiosResponse } from "axios";
import { Event } from "../../../src/shared/types/event";
import { User } from "../../../src/shared/types/user";
import { env } from "./env";

/**
 * All response statuses (2xx, 4xxx, 5xx) in axios will be given out with resolve()
 */
Axios.defaults.validateStatus = () => true;

export const getBasicAuthHeader = (user: string, password: string): string =>
  "Basic " + Buffer.from(user + ":" + password).toString("base64");

export async function apiRead(
  userId: string,
  authHeader?: string
): Promise<AxiosResponse<User>> {
  const url = `${env.apiBaseUrl}/user`;
  console.log(`>>> ${url}`);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers.Authorization = authHeader;
  }
  return await Axios.get(`${url}?userId=${userId}`, {
    headers,
  });
}

export type RequestEvent = Omit<Event, "eventId" | "createdAt">;

export async function apiWrite(
  data: RequestEvent,
  authHeader?: string
): Promise<AxiosResponse<string>> {
  const url = `${env.apiBaseUrl}/write`;
  console.log(`>>> ${url}`);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers.Authorization = authHeader;
  }
  return await Axios.post(url, JSON.stringify(data), {
    headers,
  });
}
