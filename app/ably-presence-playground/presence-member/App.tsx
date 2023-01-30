import { Types } from "ably";
import { useCallback, useEffect, useState } from "react";
import {
  assertConfiguration,
  configureAbly,
  ChannelParameters,
} from "@ably-labs/react-hooks";

interface PresenceMessage<T = any> {
  action: Types.PresenceAction;
  clientId: string;
  connectionId: string;
  data: T;
  encoding: string;
  id: string;
  timestamp: number;
}

type OnPresenceMessageReceived<T> = (presenceData: PresenceMessage<T>) => void;

function usePresence<T = any>({
  channelNameOrNameAndOptions,
  messageOrPresenceObject,
  onPresenceUpdated,
  actionOptions,
}: {
  channelNameOrNameAndOptions: ChannelParameters;
  messageOrPresenceObject?: T;
  onPresenceUpdated?: OnPresenceMessageReceived<T>;
  actionOptions;
}) {
  const ably = assertConfiguration();

  const channelName =
    typeof channelNameOrNameAndOptions === "string"
      ? channelNameOrNameAndOptions
      : channelNameOrNameAndOptions.channelName;

  const channel = ably.channels.get(channelName);

  const updatePresence = async (message?: Types.PresenceMessage) => {
    onPresenceUpdated?.call(this, message);
  };

  const onMount = async () => {
    if (typeof channelNameOrNameAndOptions !== "string") {
      await channel.setOptions(channelNameOrNameAndOptions.options);
    }

    if (actionOptions.enter) {
      await channel.presence.enter(messageOrPresenceObject);
    }

    if (actionOptions.enterSubscribe)
      channel.presence.subscribe("enter", updatePresence);
    if (actionOptions.leaveSubscribe)
      channel.presence.subscribe("leave", updatePresence);
    if (actionOptions.updateSubscribe)
      channel.presence.subscribe("update", updatePresence);
  };

  const onUnmount = () => {
    if (channel.state === "attached" && actionOptions.enter) {
      channel.presence.leave();
    }

    if (actionOptions.enterSubscribe) channel.presence.unsubscribe("enter");
    if (actionOptions.leaveSubscribe) channel.presence.unsubscribe("leave");
    if (actionOptions.updateSubscribe) channel.presence.unsubscribe("update");
  };

  const useEffectHook = () => {
    onMount();

    return () => {
      onUnmount();
    };
  };

  useEffect(useEffectHook, []);

  const updateStatus = (messageOrPresenceObject: T) => {
    channel.presence.update(messageOrPresenceObject);
  };

  return updateStatus;
}

const StatusIcon = ({ flag }) => {
  return flag ? (
    <span className="text-green-500 ml-1">✓</span>
  ) : (
    <span className="text-red-500 ml-1">x</span>
  );
};

function App() {
  const [updateValue, setUpdateValue] = useState("");
  const [clientLog, setClientLog] = useState([]);

  const getAbly = useCallback(() => {
    const params = new URLSearchParams(window.location.search);

    const ably = configureAbly({
      authUrl: `/api/ably-token-request?clientId=${params.get("id")}`,
    });

    return ably;
  }, []);
  getAbly();

  const getActionOptions = useCallback(() => {
    const params = new URLSearchParams(window.location.search);

    return {
      enter: params.get("enter") === "true",
      enterSubscribe: params.get("enterSubscribe") === "true",
      updateSubscribe: params.get("updateSubscribe") === "true",
      leaveSubscribe: params.get("leaveSubscribe") === "true",
      flags: {
        publish: params.get("flagPublish") === "true",
        subscribe: params.get("flagSubscribe") === "true",
        presence: params.get("flagPresence") === "true",
        presenceSubscribe: params.get("flagPresenceSubscribe") === "true",
      },
    };
  }, []);

  const getFlags = (flags): Types.ChannelModes => {
    const resolvedFlags: Types.ChannelModes = [];

    if (flags.publish) resolvedFlags.push("PUBLISH");
    if (flags.subscribe) resolvedFlags.push("SUBSCRIBE");
    if (flags.presence) resolvedFlags.push("PRESENCE");
    if (flags.presenceSubscribe) resolvedFlags.push("PRESENCE_SUBSCRIBE");

    return resolvedFlags;
  };

  const actionOptions = getActionOptions();
  const modes = getFlags(actionOptions.flags);

  const updateStatus = usePresence({
    channelNameOrNameAndOptions: {
      channelName: "multiplayer-playground",
      options: {
        modes,
      },
    },
    onPresenceUpdated: (msg) => {
      setClientLog((current) => [...current, msg]);
    },
    actionOptions,
  });

  const update = () => {
    updateStatus(updateValue);
    setUpdateValue("");
  };

  const peers = clientLog.reverse().map((msg, index) => {
    return (
      <li key={index} className="flex">
        <p className="text-xs">clientId: {msg.clientId}</p>
        <p className="text-xs ml-2">action: {msg.action}</p>
        {msg.data ? <p className="text-xs ml-2">data: {msg.data}</p> : msg.data}
      </li>
    );
  });

  return (
    <div className="text-xs p-1">
      <div>
        <div className="mb-2 flex items-center">
          <input
            type="text"
            className="border border-gray-500 rounded py-1"
            value={updateValue}
            onChange={(event) => setUpdateValue(event.target.value)}
          />
          <button
            type="button"
            className="ml-2 bg-black text-white py-1 px-2 rounded"
            onClick={update}
          >
            Update
          </button>
        </div>

        <ul className="text-xs h-20 overflow-scroll rounded border border-slate-400 mb-2 p-1">
          {peers}
        </ul>

        <div className="grid grid-cols-4">
          <span className="ml-2">
            <StatusIcon flag={actionOptions.enter} /> Enter
          </span>

          <span className="ml-2">
            <StatusIcon flag={actionOptions.enterSubscribe} /> Enter subscribe
          </span>

          <span className="ml-2">
            <StatusIcon flag={actionOptions.updateSubscribe} /> Update subscribe
          </span>

          <span className="ml-2">
            <StatusIcon flag={actionOptions.leaveSubscribe} /> Leave subscribe
          </span>
          <span className="ml-2">
            <StatusIcon flag={actionOptions.flags.publish} /> PUBLISH
          </span>

          <span className="ml-2">
            <StatusIcon flag={actionOptions.flags.subscribe} /> SUBSCRIBE
          </span>

          <span className="ml-2">
            <StatusIcon flag={actionOptions.flags.presence} /> PRESENCE
          </span>

          <span className="ml-2">
            <StatusIcon flag={actionOptions.flags.presenceSubscribe} />{" "}
            PRESENCE_SUBSCRIBE
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
