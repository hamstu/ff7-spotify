import React, { useEffect, useState } from "react";

import songs from "./songs.json";

const SPOTIFY_CLIENT_ID = "8b3968300ca141b8b1bc8dd5a96f9fee";
const FFVII_REMAKE_ALBUM_ID = "spotify:album:2ufkFJsK2Hh2ZdmgrRmCv3";

function generateSpotifyAuthUrl() {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "token",
    redirect_uri: location.protocol + "//" + location.host + location.pathname,
    // show_dialog: "true",
    scope:
      "user-read-playback-state user-read-currently-playing user-modify-playback-state",
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

function getAccessTokenFromURL() {
  const hash = window.location.hash.substring(1); // remove the leading `#`
  const hashParams = new URLSearchParams(hash);
  return hashParams.get("access_token");
}

function spotifyAPI(endpoint, method, params, body, accessToken) {
  let url = `https://api.spotify.com/v1${endpoint}`;

  if (params) {
    const queryString = new URLSearchParams(params);
    url = `${url}?${queryString}`;
  }

  return fetch(url, {
    method,
    body: method !== "GET" ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).catch((e) => console.error("Spotify API Error:", { url }, e));
}

function App() {
  const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);

  function playTrack(trackOffset) {
    spotifyAPI(
      "/me/player/play",
      "PUT",
      {
        device_id: deviceId,
      },
      {
        context_uri: FFVII_REMAKE_ALBUM_ID,
        offset: {
          position: trackOffset,
        },
        position_ms: 0,
      },
      spotifyAccessToken
    );
  }

  function getDevices() {
    spotifyAPI("/me/player/devices", "GET", null, null, spotifyAccessToken)
      .then((res) => res.json())
      .then((data) => {
        setDevices(data.devices);
        setDeviceId(data.devices[0].id);
        console.table(data.devices);
      });
  }

  useEffect(() => {
    const accessToken = getAccessTokenFromURL();
    if (accessToken) {
      setSpotifyAccessToken(accessToken);
      window.location.hash = "";
    }
  }, []);

  useEffect(() => {
    if (spotifyAccessToken) {
      getDevices();
    }
  }, [spotifyAccessToken]);

  return (
    <div className="">
      <a
        href={generateSpotifyAuthUrl()}
        className="inline-block p-3 px-6 m-10 mb-0 text-white uppercase text-2xl bg-green-500"
      >
        {spotifyAccessToken ? "Refresh Spotify Access" : "Login with Spotify"}
      </a>
      {devices.length > 0 && deviceId && (
        <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      )}
      {spotifyAccessToken && (
        <ol className="p-6">
          {songs.map((song, index) => (
            <li
              key={song.title}
              className={`text-gray-900 ${
                song.trackNumber === 1 ? "mt-3 pt-3 border-t-2" : ""
              }`}
            >
              <button
                className="block w-full p-2 text-left font-mono hover:bg-green-500 hover:text-white"
                onClick={() => playTrack(index)}
              >
                {song.title}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default App;
