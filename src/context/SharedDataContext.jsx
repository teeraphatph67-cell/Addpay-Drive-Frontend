import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "../api/api";

const SharedDataContext = createContext(null);

export const SharedDataProvider = ({ children }) => {
  const [sharedItems, setSharedItems] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserById = async (userId, token) => {
    try {
      const res = await fetch(`${API_BASE}/Mydrive/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch (e) {
      console.error("fetchUserById error", e);
      return null;
    }
  };

  const collectOwnerIds = (items, set = new Set()) => {
    items.forEach((item) => {
      if (item.owner_id) set.add(item.owner_id);
      if (item.children?.length) collectOwnerIds(item.children, set);
    });
    return set;
  };

  const fetchSharedFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("api_token");
      if (!token) throw new Error("ไม่พบ Token");

      const res = await fetch(`${API_BASE}/shared-with-me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Fetch failed");

      const items = json.data || [];

      const ownerIds = [...collectOwnerIds(items)];
      const users = {};
      for (const id of ownerIds) {
        const user = await fetchUserById(id, token);
        if (user) {
          users[id] = {
            username: user.username || user.name,
            avatar: user.avatar_url,
          };
        }
      }

      setUserMap(users);
      setSharedItems(items);
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SharedDataContext.Provider
      value={{
        sharedItems,
        setSharedItems,
        userMap,
        setUserMap,
        loading,
        error,
        fetchSharedFiles,
      }}
    >
      {children}
    </SharedDataContext.Provider>
  );
};

export const useSharedData = () => {
  const ctx = useContext(SharedDataContext);
  if (!ctx) throw new Error("useSharedData must be used inside SharedDataProvider");
  return ctx;
};

export default SharedDataContext;
