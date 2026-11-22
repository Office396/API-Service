"use client";

export const sessionChannel = "toolzync-account-session";

export function switchSession(path: "/dashboard" | "/sign-in") {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(sessionChannel);
    channel.postMessage("changed");
    channel.close();
  }
  // A full navigation also discards any private data in Next's client router cache.
  window.location.replace(path);
}
