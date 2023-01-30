import { useMemo } from "react";

import colors from "tailwindcss/colors";

const colorNames = Object.keys(colors).filter(
  (color) => !["transparent"].includes(color)
);

const Client = ({ clientConfig, removeClient }) => {
  const bgColor = useMemo(
    () => colorNames[Math.floor(Math.random() * colorNames.length)],
    []
  );

  const configParams = Object.entries(clientConfig)
    .filter(([key, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return (
    <div className={`mb-5 p-4 bg-${bgColor}-200`}>
      <p className="mb-2">clientId: {clientConfig.id}</p>

      <iframe
        className="p-1 border-neutral-600 border mb-2"
        width="700"
        height="180"
        src={`./presence-member.html?${configParams}`}
      ></iframe>

      <button
        type="button"
        className="bg-black text-white py-1 px-2 rounded text-xs mt-1"
        onClick={() => removeClient(clientConfig.id)}
      >
        Remove client
      </button>
    </div>
  );
};

const Clients = ({ clients, removeClient }) => {
  return clients.map((clientConfig) => (
    <Client
      key={clientConfig.id}
      clientConfig={clientConfig}
      removeClient={removeClient}
    />
  ));
};

export default Clients;
