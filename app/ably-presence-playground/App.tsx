import { useState } from "react";
import { configureAbly, assertConfiguration } from "@ably-labs/react-hooks";
import { useInterval } from "usehooks-ts";
import { nanoid } from "nanoid";

import Clients from "./components/Clients";

const optionalClientId = "optionalClientId"; // When not provided in authUrl, a default will be used.
configureAbly({
  authUrl: `/api/ably-token-request?clientId=${optionalClientId}`,
});

const REFRESH_IN_SECONDS = 10;

function App() {
  const [refresh, setRefresh] = useState<number>(REFRESH_IN_SECONDS);
  const [refreshEnabled, enabledRefresh] = useState<boolean>(false);
  const [clientsCount, setClientsCount] = useState<number>(1);
  const [clientsConnectedCount, setClientsConnectedCount] = useState<number>(0);
  const [messagesCount, setPresenceMessagesCount] = useState<number | null>(
    null
  );
  const [messagesCountDiff, setPresenceMessagesCountDiff] = useState<
    number | null
  >(0);
  const [clients, setClients] = useState<{ id: string }[]>([]);
  const [statPeriod, setStatPeriod] = useState<string>("hour");
  const [clientEnterChecked, setClientEnterChecked] = useState<boolean>(true);
  const [clientEnterSubscribeChecked, setClientEnterSubscribeChecked] =
    useState<boolean>(false);
  const [clientUpdateSubscribeChecked, setClientUpdateSubscribeChecked] =
    useState<boolean>(false);
  const [clientLeaveSubscribeChecked, setClientLeaveSubscribeChecked] =
    useState<boolean>(false);

  const [channelFlagPublish, setChannelFlagPublish] = useState<boolean>(true);
  const [channelFlagSubscribe, setChannelFlagSubscribe] =
    useState<boolean>(true);
  const [channelFlagPresence, setChannelFlagPresence] = useState<boolean>(true);
  const [channelFlagPresenceSubscribe, setChannelFlagPresenceSubscribe] =
    useState<boolean>(true);

  const ably = assertConfiguration();

  const addClients = async () => {
    const newClients = Array.from(Array(clientsCount)).map(() => {
      return {
        id: nanoid(),
        enter: clientEnterChecked,
        enterSubscribe: clientEnterSubscribeChecked,
        updateSubscribe: clientUpdateSubscribeChecked,
        leaveSubscribe: clientLeaveSubscribeChecked,
        flagPublish: channelFlagPublish,
        flagSubscribe: channelFlagSubscribe,
        flagPresence: channelFlagPresence,
        flagPresenceSubscribe: channelFlagPresenceSubscribe,
      };
    });

    setClients([...clients, ...newClients]);
  };

  const removeClient = (id) => {
    const clientIndex = clients.findIndex((client) => client.id === id);
    clients[clientIndex] = undefined;
    setClients(clients.filter((i) => i));
  };

  const removeAllClients = () => {
    setClients([]);
  };

  const fetchStats = async () => {
    const stats = await ably.stats({ unit: statPeriod, limit: 1 });
    const newCount = stats.items[0].all.presence.count;
    const channel = await ably.channels.get("multiplayer-playground");
    const presenceData = await channel.presence.get();
    setPresenceMessagesCountDiff(newCount - messagesCount);
    setPresenceMessagesCount(newCount);
    setClientsConnectedCount(presenceData.length);
  };

  const getCurrentDateTimeDetail = () => {
    const now = new Date();

    const details = {
      day: () => `${now.getDate()}/${now.getMonth()}`,
      hour: () => `${now.getHours()}:00 ${now.getDate()}/${now.getMonth()}`,
      minute: () =>
        `${now.getHours()}:${now.getMinutes()} ${now.getDate()}/${now.getMonth()}`,
    };

    return details[statPeriod]();
  };

  useInterval(
    async () => {
      // Your custom logic here
      if (refresh === 0) {
        fetchStats();
        setRefresh(REFRESH_IN_SECONDS);
      } else {
        setRefresh(refresh - 1);
      }
    },
    refreshEnabled ? 1000 : null
  );

  return (
    <div className="p-5 grid grid-cols-12 gap-4">
      <div className="col-span-12 sticky top-4">
        <div className="bg-cyan-400 p-4 flex items-center">
          {messagesCount !== null ? (
            <p>
              <>
                Presence messages sent in last{" "}
                <select
                  value={statPeriod}
                  onChange={(event) => setStatPeriod(event.target.value)}
                >
                  <option value="hour">hour</option>
                  <option value="minute">minute</option>
                  <option value="day">day</option>
                </select>{" "}
                (since {getCurrentDateTimeDetail()})
              </>
              :{" "}
              <span
                className={
                  refreshEnabled && refresh > 0 && refresh < 5
                    ? ""
                    : "animate-enter-stat"
                }
              >
                {messagesCount}

                {refreshEnabled && messagesCountDiff > 0 ? (
                  <span className="text-yellow-600 ml-1">
                    +{messagesCountDiff}
                  </span>
                ) : null}
              </span>
            </p>
          ) : null}

          {clientsConnectedCount > 0 ? (
            <p className="ml-4">Connected clients: {clientsConnectedCount}</p>
          ) : null}

          {messagesCount !== null ? (
            <p className="ml-auto">
              Refresh in: <span>{refresh}</span>s{" "}
              <button
                type="button"
                className="bg-black text-white py-1 px-2 rounded"
                onClick={() => enabledRefresh(!refreshEnabled)}
              >
                {refreshEnabled ? "stop" : "start"}
              </button>
            </p>
          ) : null}

          {messagesCount === null ? (
            <p className="self-end">
              <button
                type="button"
                className="bg-black text-white py-1 px-2 rounded"
                onClick={async () => fetchStats()}
              >
                fetch stats
              </button>
            </p>
          ) : null}
        </div>
      </div>

      <div className="col-span-9">
        <div className="mb-2">
          {clients.length > 0 ? (
            <Clients clients={clients} removeClient={removeClient} />
          ) : (
            <p className="p-4 bg-amber-400 inline-block">
              No clients connected
            </p>
          )}
        </div>
      </div>

      <div className="col-span-3 relative">
        <div className="bg-red-400 p-4 mb-2 sticky" style={{ top: "6rem" }}>
          <form>
            add{" "}
            <input
              type="number"
              style={{ width: "40px" }}
              value={clientsCount}
              className="p-1"
              onChange={(event) =>
                setClientsCount(parseInt(event.target.value, 10))
              }
            />{" "}
            {clientsCount === 1 ? "client" : "clients"}
            <fieldset>
              <label className="flex items-center">
                <input
                  className="mr-1"
                  type="checkbox"
                  name="enter"
                  checked={clientEnterChecked}
                  onChange={(event) =>
                    setClientEnterChecked(event.target.checked)
                  }
                />
                enter
              </label>

              <label className="flex items-center">
                <input
                  className="mr-1"
                  type="checkbox"
                  name="enter"
                  checked={clientEnterSubscribeChecked}
                  onChange={(event) =>
                    setClientEnterSubscribeChecked(event.target.checked)
                  }
                />
                enter subscribe
              </label>

              <label className="flex items-center">
                <input
                  className="mr-1"
                  type="checkbox"
                  name="enter"
                  checked={clientUpdateSubscribeChecked}
                  onChange={(event) =>
                    setClientUpdateSubscribeChecked(event.target.checked)
                  }
                />
                update subscribe
              </label>

              <label className="flex items-center">
                <input
                  className="mr-1"
                  type="checkbox"
                  name="enter"
                  checked={clientLeaveSubscribeChecked}
                  onChange={(event) =>
                    setClientLeaveSubscribeChecked(event.target.checked)
                  }
                />
                leave subscribe
              </label>
            </fieldset>
            <fieldset>
              <label className="flex items-center">
                <input
                  className="mr-1"
                  type="checkbox"
                  name="enter"
                  checked={channelFlagPublish}
                  onChange={(event) =>
                    setChannelFlagPublish(event.target.checked)
                  }
                />
                PUBLISH flag
              </label>

              <label className="flex items-center">
                <input
                  className="mr-1"
                  type="checkbox"
                  name="enter"
                  checked={channelFlagSubscribe}
                  onChange={(event) =>
                    setChannelFlagSubscribe(event.target.checked)
                  }
                />
                SUBSCRIBE flag
              </label>

              <label className="flex items-center">
                <input
                  className="mr-1"
                  type="checkbox"
                  name="enter"
                  checked={channelFlagPresence}
                  onChange={(event) =>
                    setChannelFlagPresence(event.target.checked)
                  }
                />
                PRESENCE flag
              </label>

              <label className="flex items-center">
                <input
                  className="mr-1"
                  type="checkbox"
                  name="enter"
                  checked={channelFlagPresenceSubscribe}
                  onChange={(event) =>
                    setChannelFlagPresenceSubscribe(event.target.checked)
                  }
                />
                PRESENCE_SUBSCRIBE flag
              </label>
            </fieldset>
            <div className="flex">
              <button
                type="button"
                className="bg-black text-white py-1 px-2 rounded text-xs mt-1"
                onClick={addClients}
              >
                go
              </button>
              <button
                type="button"
                className="bg-black text-white py-1 px-2 rounded text-xs mt-1 ml-auto"
                onClick={removeAllClients}
              >
                remove all
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
