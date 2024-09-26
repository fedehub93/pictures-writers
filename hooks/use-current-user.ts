import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";

const useCurrentUser = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          const response = await fetch(`/api/users/${user.id}`); // Assicurati che l'endpoint sia corretto
          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }
          const data = await response.json();
          setCurrentUser(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // Se non è firmato o non è caricato, finisci il caricamento
      }
    };

    fetchCurrentUser();
  }, [isLoaded, isSignedIn, user]);

  return { currentUser, loading, error };
};

export default useCurrentUser;
