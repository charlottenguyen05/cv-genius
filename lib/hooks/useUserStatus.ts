"use client";
import { useEffect, useState } from "react";
import { getCurrentUser, supabase } from "../supabase/client";
import { User } from "@supabase/supabase-js";

const useUserStatus = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let componentIsUnmounted = false;
    const checkUserStatus = async () => {
      if (!componentIsUnmounted) {
        try {
          let { user: userData, error } = await getCurrentUser();
          if (userData) {
            setUser(userData);
            setError("");
          } else {
            setUser(null);
            setError(error?.message || "Cannot get user info");
          }
        } catch (error: any) {
          setError("Check your internet connection, something went wrong");
        } finally {
          setIsLoading(false);
        }
      }
    };
    checkUserStatus();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => setUser(session?.user || null)
    );

    return () => {
      componentIsUnmounted = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, error };
};

export default useUserStatus;
