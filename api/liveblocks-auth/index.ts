import * as dotenv from "dotenv";
import { authorize } from "@liveblocks/node";
import { HandlerEvent, HandlerContext } from "@netlify/functions";

dotenv.config();

const NAMES = [
  "Charlie Layne",
  "Mislav Abha",
  "Tatum Paolo",
  "Anjali Wanda",
  "Jody Hekla",
  "Emil Joyce",
  "Jory Quispe",
  "Quinn Elton",
];

export async function handler(event: HandlerEvent, context: HandlerContext) {
  if (!process.env.LIVEBLOCKS_API_KEY) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(`Missing LIVEBLOCKS_API_KEY environment variable.
        If you're running locally, please ensure you have a ./.env file with a value for LIVEBLOCKS_API_KEY=your-key.
        If you're running in Netlify, make sure you've configured env variable LIVEBLOCKS_API_KEY.`),
    };
  }

  const body = JSON.parse(event.body);

  const response = await authorize({
    room: body.room,
    secret: process.env.LIVEBLOCKS_API_KEY,
    userInfo: {
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      picture: `https://liveblocks.io/avatars/avatar-${Math.floor(
        Math.random() * 30
      )}.png`,
    },
  });

  return {
    statusCode: response.status,
    headers: { "content-type": "application/json" },
    body: response.body,
  };
}
