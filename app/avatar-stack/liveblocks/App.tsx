import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

type Presence = {};

type Storage = {};

type UserMeta = {
  id: string;
  info: {
    name: string;
    picture: string;
  };
};

const { RoomProvider, useOthers, useSelf } = createRoomContext<
  Presence,
  Storage,
  UserMeta
>(client);

const IMAGE_SIZE = 48;

const Avatar = ({ picture }) => {
  return (
    <div className="">
      <img src={picture} height={IMAGE_SIZE} width={IMAGE_SIZE} className="" />
    </div>
  );
};

function App() {
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > 3;

  console.log(
    users.map((i) => i),
    currentUser
  );

  return (
    <main className="flex place-items-center place-content-center w-full h-screen select-none">
      <div className="flex pl-3">
        {users.slice(0, 3).map(({ connectionId, info }) => {
          return (
            <>
              <Avatar key={connectionId} picture={info.picture} />
              <p>User: {info.name}</p>
            </>
          );
        })}

        {hasMoreUsers && <div className="">+{users.length - 3}</div>}

        {currentUser && (
          <div className="relative ml-8 first:ml-0">
            <Avatar picture={currentUser.info.picture} />
            <p>Current user: {currentUser.info.name}</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default () => (
  <RoomProvider
    id="liveblocks-room"
    // initialPresence - The initial Presence to use for the User currently entering the Room.
    // Presence data belongs to the current User and is readable to all other Users in the room
    // while the current User is connected to the Room. Must be serializable to JSON.
    initialPresence={{}}
  >
    <App />
  </RoomProvider>
);
